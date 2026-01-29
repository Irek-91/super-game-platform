import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { CreateGameCommand } from './create-game.command';
import { IGameRepository } from '../../domain/repositories/game.repository.interface';
import { IGamePlayerRepository } from '../../domain/repositories/game-player.repository.interface';
import { IGameCellRepository } from '../../domain/repositories/game-cell.repository.interface';
import { Game, GameStatus } from '../../domain/entities/game.entity';
import { GamePlayer } from '../../domain/entities/game-player.entity';
import { GameCell } from '../../domain/entities/game-cell.entity';
import { BoardService } from '../../domain/services/board.service';
import { generateToken } from '../../utils/rng.util';
import { v4 as uuidv4 } from 'uuid';
import { CreateGameResult } from '../types/command-results.types';

@CommandHandler(CreateGameCommand)
export class CreateGameHandler implements ICommandHandler<CreateGameCommand> {
  private readonly logger = new Logger(CreateGameHandler.name);

  constructor(
    @Inject('IGameRepository')
    private readonly gameRepository: IGameRepository,
    @Inject('IGamePlayerRepository')
    private readonly playerRepository: IGamePlayerRepository,
    @Inject('IGameCellRepository')
    private readonly cellRepository: IGameCellRepository,
    private readonly boardService: BoardService,
  ) {}

  async execute(command: CreateGameCommand): Promise<CreateGameResult> {
    this.logger.log({
      service: 'games',
      eventType: 'create_game',
      fieldSize: command.fieldSize,
      diamondsCount: command.diamondsCount,
    });

    const diamonds = this.boardService.generateDiamonds(
      command.fieldSize,
      command.diamondsCount,
    );

    const gameId = uuidv4();
    const now = new Date();
    const game = new Game(
      gameId,
      command.fieldSize,
      command.diamondsCount,
      GameStatus.WAITING,
      null,
      0,
      now,
      now,
      null,
    );

    const savedGame = await this.gameRepository.save(game);

    const player1 = new GamePlayer(
      uuidv4(),
      savedGame.id,
      1,
      generateToken('p1'),
      false,
      0,
      now,
      null,
    );

    const player2 = new GamePlayer(
      uuidv4(),
      savedGame.id,
      2,
      generateToken('p2'),
      false,
      0,
      now,
      null,
    );

    await Promise.all([
      this.playerRepository.save(player1),
      this.playerRepository.save(player2),
    ]);

    const cells: GameCell[] = [];
    for (let x = 0; x < command.fieldSize; x++) {
      for (let y = 0; y < command.fieldSize; y++) {
        const adjacentDiamonds = this.boardService.countAdjacentDiamonds(
          diamonds,
          x,
          y,
          command.fieldSize,
        );

        const cell = new GameCell(
          uuidv4(),
          savedGame.id,
          x,
          y,
          diamonds[x][y],
          adjacentDiamonds,
          null,
          null,
        );

        cells.push(cell);
      }
    }

    await this.cellRepository.saveMany(cells);

    this.logger.log({
      service: 'games',
      gameId: savedGame.id,
      eventType: 'game_created',
      status: 'success',
    });

    return {
      gameId: savedGame.id,
      status: savedGame.status,
      fieldSize: savedGame.fieldSize,
      diamondsCount: savedGame.diamondsCount,
      wsUrl: '/ws',
      players: {
        p1: { token: player1.token },
        p2: { token: player2.token },
      },
    };
  }
}
