import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OpenCellCommand } from './open-cell.command';
import { IGameRepository } from '../../domain/repositories/game.repository.interface';
import { IGamePlayerRepository } from '../../domain/repositories/game-player.repository.interface';
import { IGameCellRepository } from '../../domain/repositories/game-cell.repository.interface';
import { GameStatus } from '../../domain/entities/game.entity';
import { GameCell } from '../../domain/entities/game-cell.entity';
import { GamePlayer } from '../../domain/entities/game-player.entity';
import { OpenCellResult } from '../types/command-results.types';
import { CellState, CellType } from '../../types/game-state.types';

@CommandHandler(OpenCellCommand)
export class OpenCellHandler implements ICommandHandler<OpenCellCommand> {
  private readonly logger = new Logger(OpenCellHandler.name);

  constructor(
    @Inject('IGameRepository')
    private readonly gameRepository: IGameRepository,
    @Inject('IGamePlayerRepository')
    private readonly playerRepository: IGamePlayerRepository,
    @Inject('IGameCellRepository')
    private readonly cellRepository: IGameCellRepository,
  ) {}

  async execute(command: OpenCellCommand): Promise<OpenCellResult> {
    this.logger.log({
      service: 'games',
      gameId: command.gameId,
      eventType: 'open_cell',
      x: command.x,
      y: command.y,
    });

    const gameWithRelations = await this.gameRepository.findByIdWithRelations(
      command.gameId,
    );

    if (!gameWithRelations) {
      throw new NotFoundException('Game not found');
    }

    const { game, players } = gameWithRelations;

    const playersByToken = new Map<string, GamePlayer>();
    const playersById = new Map<string, GamePlayer>();
    const playersBySlot = new Map<number, GamePlayer>();
    for (const p of players) {
      playersByToken.set(p.token, p);
      playersById.set(p.id, p);
      playersBySlot.set(p.slot, p);
    }

    if (game.status === GameStatus.FINISHED) {
      throw new BadRequestException('GAME_FINISHED');
    }

    if (game.status !== GameStatus.ACTIVE) {
      throw new BadRequestException('GAME_NOT_ACTIVE');
    }

    const player = playersByToken.get(command.token);
    if (!player) {
      throw new BadRequestException('Invalid token');
    }

    if (game.turnPlayerId !== player.id) {
      throw new BadRequestException('NOT_YOUR_TURN');
    }

    try {
      GameCell.validateCoordinates(command.x, command.y, game.fieldSize);
    } catch {
      throw new BadRequestException('Coordinates out of bounds');
    }

    const cell = await this.cellRepository.findByGameIdAndCoordinates(
      game.id,
      command.x,
      command.y,
    );

    if (!cell) {
      throw new NotFoundException('Cell not found');
    }

    if (cell.isOpened()) {
      throw new BadRequestException('CELL_ALREADY_OPENED');
    }

    cell.open(player.id);
    await this.cellRepository.save(cell);

    if (cell.isDiamond) {
      player.incrementScore();
      await this.playerRepository.save(player);

      game.incrementDiamondsFound();
    }

    if (!cell.isDiamond) {
      const otherPlayer = Array.from(playersById.values()).find(
        (p) => p.id !== player.id,
      );
      if (!otherPlayer) {
        throw new BadRequestException('Expected exactly 2 players in game');
      }
      game.switchTurn(otherPlayer.id);
    }

    let gameOver = null;
    if (game.canFinish()) {
      game.finish();
      const player1 = playersBySlot.get(1);
      const player2 = playersBySlot.get(2);
      const score1 = player1?.score || 0;
      const score2 = player2?.score || 0;
      gameOver = {
        status: GameStatus.FINISHED,
        scores: {
          p1: score1,
          p2: score2,
        },
        winner: score1 > score2 ? 1 : score2 > score1 ? 2 : 0,
        reason: 'all_diamonds_found',
      };
    }

    await this.gameRepository.save(game);

    this.logger.log({
      service: 'games',
      gameId: game.id,
      playerId: player.id,
      eventType: 'cell_opened',
      status: 'success',
      isDiamond: cell.isDiamond,
    });

    const updatedGameWithRelations =
      await this.gameRepository.findByIdWithRelations(game.id);

    if (!updatedGameWithRelations) {
      throw new NotFoundException('Game not found after update');
    }

    const player1 = playersBySlot.get(1);
    const player2 = playersBySlot.get(2);
    const turnPlayer = game.turnPlayerId
      ? playersById.get(game.turnPlayerId)
      : null;

    return {
      gameWithRelations: updatedGameWithRelations,
      moveResult: {
        x: command.x,
        y: command.y,
        cell: cell.isDiamond
          ? { s: CellState.OPENED, t: CellType.DIAMOND }
          : {
              s: CellState.OPENED,
              t: CellType.NUMBER,
              v: cell.adjacentDiamonds,
            },
        turn: turnPlayer?.slot || 1,
        scores: {
          p1: player1?.score || 0,
          p2: player2?.score || 0,
        },
        found: game.diamondsFound,
      },
      gameOver,
    };
  }
}
