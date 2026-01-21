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
import { GamesService } from '../services/games.service';
import { JoinDto } from '../dto/join.dto';
import { OpenCellDto } from '../dto/open-cell.dto';
import { WsError } from '../types/game-state.types';

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

  constructor(private readonly gamesService: GamesService) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleConnection(_client: Socket) {
    // Required by OnGatewayConnection interface
  }

  async handleDisconnect(client: Socket) {
    const gameId = (client as any).gameId;
    const playerSlot = (client as any).playerSlot;

    if (gameId && playerSlot) {
      const updatedGame = await this.gamesService.disconnectPlayer(
        gameId,
        playerSlot,
      );

      const room = `game:${gameId}`;
      const sockets = await this.server.in(room).fetchSockets();
      for (const socket of sockets) {
        const slot = (socket as any).playerSlot;
        if (slot) {
          const gameState = this.gamesService.convertToGameState(
            updatedGame,
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

      // Валидация игры и токена
      const game = await this.gamesService.findGameById(gameId);
      const player = await this.gamesService.validateToken(game, token);
      const playerSlot = player.slot;

      // Присоединяемся к комнате
      const room = `game:${gameId}`;
      client.join(room);

      // Сохраняем информацию о слоте игрока в сокете
      (client as any).gameId = gameId;
      (client as any).playerSlot = playerSlot;
      (client as any).token = token;

      const updatedGame = await this.gamesService.joinGame(gameId, token);

      const gameState = this.gamesService.convertToGameState(
        updatedGame,
        playerSlot,
      );

      client.emit('state', gameState);

      // Рассылаем обновленное состояние всем в комнате с правильным youAre для каждого
      const sockets = await this.server.in(room).fetchSockets();
      for (const socket of sockets) {
        const slot = (socket as any).playerSlot;
        if (slot) {
          const stateForPlayer = this.gamesService.convertToGameState(
            updatedGame,
            slot,
          );
          socket.emit('state', stateForPlayer);
        }
      }
    } catch (error) {
      const wsError: WsError = {
        code: this.getErrorCode(error),
        message: error.message || 'Unknown error',
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

      const { game, moveResult, gameOver } = await this.gamesService.openCell(
        gameId,
        token,
        x,
        y,
      );

      // Отправляем результат хода
      this.server.to(room).emit('move_result', moveResult);

      // Отправляем обновленное состояние каждому клиенту с правильным youAre
      const sockets = await this.server.in(room).fetchSockets();
      for (const socket of sockets) {
        const slot = (socket as any).playerSlot;
        if (slot) {
          const gameState = this.gamesService.convertToGameState(game, slot);
          socket.emit('state', gameState);
        }
      }

      if (gameOver) {
        this.server.to(room).emit('game_over', gameOver);
      }
    } catch (error) {
      const wsError: WsError = {
        code: this.getErrorCode(error),
        message: error.message || 'Unknown error',
      };
      client.emit('error', wsError);
    }
  }

  private getErrorCode(error: any): string {
    if (
      error.message === 'Game not found' ||
      error.message.includes('not found')
    ) {
      return 'GAME_NOT_FOUND';
    }
    if (error.message === 'Invalid token') {
      return 'INVALID_TOKEN';
    }
    if (error.message === 'INVALID_GAME_ID') {
      return 'INVALID_GAME_ID';
    }
    if (error.message === 'GAME_NOT_ACTIVE') {
      return 'GAME_NOT_ACTIVE';
    }
    if (error.message === 'NOT_YOUR_TURN') {
      return 'NOT_YOUR_TURN';
    }
    if (error.message === 'CELL_ALREADY_OPENED') {
      return 'CELL_ALREADY_OPENED';
    }
    if (error.message === 'OUT_OF_BOUNDS') {
      return 'OUT_OF_BOUNDS';
    }
    return 'UNKNOWN_ERROR';
  }
}
