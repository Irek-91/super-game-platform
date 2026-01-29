import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CommandBus } from '@nestjs/cqrs';
import { JoinDto } from '../dto/join.dto';
import { OpenCellDto } from '../dto/open-cell.dto';
import { WsError } from '../types/game-state.types';
import { JoinGameCommand } from '../application/commands/join-game.command';
import { OpenCellCommand } from '../application/commands/open-cell.command';
import { DisconnectPlayerCommand } from '../application/commands/disconnect-player.command';
import { GameStateMapper } from '../application/services/game-state.mapper';
import { GamePlayer } from '../domain/entities/game-player.entity';

@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class GamesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly commandBus: CommandBus,
    private readonly gameStateMapper: GameStateMapper,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleConnection(_client: Socket) {
    // Required by OnGatewayConnection interface
  }

  async handleDisconnect(client: Socket) {
    const gameId = (client as any).gameId;
    const playerSlot = (client as any).playerSlot;

    if (gameId && playerSlot) {
      const gameWithRelations = await this.commandBus.execute(
        new DisconnectPlayerCommand(gameId, playerSlot),
      );

      const room = `game:${gameId}`;
      const sockets = await this.server.in(room).fetchSockets();
      for (const socket of sockets) {
        const slot = (socket as any).playerSlot;
        if (slot) {
          const gameState = this.gameStateMapper.convertToGameState(
            gameWithRelations.game,
            gameWithRelations.players,
            gameWithRelations.cells,
            slot,
          );
          socket.emit('state', gameState);
        }
      }
    }
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinDto,
  ) {
    try {
      const { gameId, token } = payload;

      const gameWithRelations = await this.commandBus.execute(
        new JoinGameCommand(gameId, token),
      );

      const playersByToken = new Map<string, GamePlayer>();
      for (const p of gameWithRelations.players) {
        playersByToken.set(p.token, p);
      }
      const player = playersByToken.get(token);
      if (!player) {
        throw new Error('Invalid token');
      }

      const playerSlot = player.slot;

      const room = `game:${gameId}`;
      client.join(room);

      // Сохраняем информацию о слоте игрока в сокете
      (client as any).gameId = gameId;
      (client as any).playerSlot = playerSlot;
      (client as any).token = token;

      const gameState = this.gameStateMapper.convertToGameState(
        gameWithRelations.game,
        gameWithRelations.players,
        gameWithRelations.cells,
        playerSlot,
      );

      client.emit('state', gameState);

      // Рассылаем обновленное состояние всем в комнате с правильным youAre для каждого
      const sockets = await this.server.in(room).fetchSockets();
      for (const socket of sockets) {
        const slot = (socket as any).playerSlot;
        if (slot) {
          const stateForPlayer = this.gameStateMapper.convertToGameState(
            gameWithRelations.game,
            gameWithRelations.players,
            gameWithRelations.cells,
            slot,
          );
          socket.emit('state', stateForPlayer);
        }
      }
    } catch (error) {
      const message =
        error.response?.message ||
        error.message ||
        (typeof error === 'string' ? error : 'Unknown error');
      const wsError: WsError = {
        code: this.getErrorCode(error),
        message: Array.isArray(message) ? message[0] : message,
      };
      client.emit('error', wsError);
    }
  }

  @SubscribeMessage('open_cell')
  async handleOpenCell(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: OpenCellDto,
  ) {
    try {
      const { gameId, token, x, y } = payload;

      const socketGameId = (client as any).gameId;
      if (!socketGameId || socketGameId !== gameId) {
        throw new Error('INVALID_GAME_ID');
      }

      const socketToken = (client as any).token;
      if (!socketToken || socketToken !== token) {
        throw new Error('INVALID_TOKEN');
      }

      const room = `game:${gameId}`;
      if (!client.rooms.has(room)) {
        throw new Error('GAME_NOT_FOUND');
      }

      const result = await this.commandBus.execute(
        new OpenCellCommand(gameId, token, x, y),
      );

      const { gameWithRelations, moveResult, gameOver } = result;

      // Отправляем результат хода
      this.server.to(room).emit('move_result', moveResult);

      // Отправляем обновленное состояние каждому клиенту с правильным youAre
      const sockets = await this.server.in(room).fetchSockets();
      for (const socket of sockets) {
        const slot = (socket as any).playerSlot;
        if (slot) {
          const gameState = this.gameStateMapper.convertToGameState(
            gameWithRelations.game,
            gameWithRelations.players,
            gameWithRelations.cells,
            slot,
          );
          socket.emit('state', gameState);
        }
      }

      if (gameOver) {
        this.server.to(room).emit('game_over', gameOver);
      }
    } catch (error) {
      const message =
        error.response?.message ||
        error.message ||
        (typeof error === 'string' ? error : 'Unknown error');
      const wsError: WsError = {
        code: this.getErrorCode(error),
        message: Array.isArray(message) ? message[0] : message,
      };
      client.emit('error', wsError);
    }
  }

  private getErrorCode(error: any): string {
    const message =
      error.response?.message ||
      error.message ||
      (typeof error === 'string' ? error : 'Unknown error');

    if (
      message === 'Game not found' ||
      message.includes('not found') ||
      message === 'Cell not found'
    ) {
      return 'GAME_NOT_FOUND';
    }
    if (message === 'Invalid token') {
      return 'INVALID_TOKEN';
    }
    if (message === 'INVALID_GAME_ID') {
      return 'INVALID_GAME_ID';
    }
    if (message === 'GAME_NOT_ACTIVE' || message === 'GAME_FINISHED') {
      return message;
    }
    if (message === 'NOT_YOUR_TURN') {
      return 'NOT_YOUR_TURN';
    }
    if (message === 'CELL_ALREADY_OPENED') {
      return 'CELL_ALREADY_OPENED';
    }
    if (
      message === 'OUT_OF_BOUNDS' ||
      message === 'Coordinates out of bounds'
    ) {
      return 'OUT_OF_BOUNDS';
    }
    return 'UNKNOWN_ERROR';
  }
}
