import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Game } from '../entities/game.entity';
import { GamePlayer } from '../entities/game-player.entity';
import { GameCell } from '../entities/game-cell.entity';
import { Move, MoveResult } from '../entities/move.entity';
import { BoardService } from './board.service';
import { generateToken, randomInt } from '../utils/rng.util';
import {
  GameState,
  BoardCell,
  Scores,
  Players,
  MoveResult as GameMoveResult,
  GameOver,
  GameStatus,
  CellState,
  CellType,
  GameOverReason,
} from '../types/game-state.types';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(GamePlayer)
    private playerRepository: Repository<GamePlayer>,
    @InjectRepository(GameCell)
    private cellRepository: Repository<GameCell>,
    private boardService: BoardService,
    private dataSource: DataSource,
  ) {}

  async createGame(fieldSize: number, diamondsCount: number): Promise<Game> {
    if (diamondsCount % 2 === 0) {
      throw new BadRequestException('diamondsCount must be odd');
    }

    if (diamondsCount > fieldSize * fieldSize) {
      throw new BadRequestException(
        'diamondsCount must be <= fieldSize * fieldSize',
      );
    }

    const diamonds = this.boardService.generateDiamonds(
      fieldSize,
      diamondsCount,
    );

    const game = this.gameRepository.create({
      fieldSize,
      diamondsCount,
      diamondsFound: 0,
      status: GameStatus.WAITING,
      turnPlayerId: null,
    });

    const savedGame = await this.gameRepository.save(game);

    const player1 = this.playerRepository.create({
      gameId: savedGame.id,
      slot: 1,
      token: generateToken('p1'),
      connected: false,
      score: 0,
    });

    const player2 = this.playerRepository.create({
      gameId: savedGame.id,
      slot: 2,
      token: generateToken('p2'),
      connected: false,
      score: 0,
    });

    await Promise.all([
      this.playerRepository.save(player1),
      this.playerRepository.save(player2),
    ]);

    // Создаем клетки поля
    const cells: GameCell[] = [];
    for (let x = 0; x < fieldSize; x++) {
      for (let y = 0; y < fieldSize; y++) {
        const adjacentDiamonds = this.boardService.countAdjacentDiamonds(
          diamonds,
          x,
          y,
          fieldSize,
        );

        const cell = this.cellRepository.create({
          gameId: savedGame.id,
          x,
          y,
          isDiamond: diamonds[x][y],
          adjacentDiamonds,
          openedByPlayerId: null,
          openedAt: null,
        });

        cells.push(cell);
      }
    }

    await this.cellRepository.save(cells);

    return await this.gameRepository.findOne({
      where: { id: savedGame.id },
      relations: ['players', 'cells'],
    });
  }

  async findGameById(gameId: string): Promise<Game> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
      relations: ['players', 'cells', 'turnPlayer'],
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return game;
  }

  async findPlayerByToken(token: string): Promise<GamePlayer> {
    const player = await this.playerRepository.findOne({
      where: { token },
      relations: ['game'],
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    return player;
  }

  async validateToken(game: Game, token: string): Promise<GamePlayer> {
    const player = game.players.find((p) => p.token === token);

    if (!player) {
      throw new Error('Invalid token');
    }

    return player;
  }

  async joinGame(gameId: string, token: string): Promise<Game> {
    const game = await this.findGameById(gameId);
    const player = await this.validateToken(game, token);

    player.connected = true;
    player.lastSeenAt = new Date();
    await this.playerRepository.save(player);

    const updatedPlayers = await this.playerRepository.find({
      where: { gameId },
    });

    const allConnected = updatedPlayers.every((p) => p.connected);

    if (allConnected && game.status === GameStatus.WAITING) {
      // Выбираем случайного игрока для первого хода
      const randomPlayer =
        updatedPlayers[randomInt(0, updatedPlayers.length - 1)];

      game.status = GameStatus.ACTIVE;
      game.turnPlayerId = randomPlayer.id;
      await this.gameRepository.save(game);
    }

    return await this.findGameById(gameId);
  }

  async openCell(
    gameId: string,
    token: string,
    x: number,
    y: number,
  ): Promise<{
    game: Game;
    moveResult: GameMoveResult;
    gameOver?: GameOver;
  }> {
    const gameForValidation = await this.gameRepository.findOne({
      where: { id: gameId },
    });

    if (!gameForValidation) {
      throw new NotFoundException('Game not found');
    }

    if (
      x < 0 ||
      x >= gameForValidation.fieldSize ||
      y < 0 ||
      y >= gameForValidation.fieldSize
    ) {
      throw new Error('OUT_OF_BOUNDS');
    }

    return await this.dataSource.transaction(async (manager) => {
      const game = await manager
        .createQueryBuilder(Game, 'game')
        .where('game.id = :gameId', { gameId })
        .setLock('pessimistic_write')
        .getOne();

      if (!game) {
        throw new NotFoundException('Game not found');
      }

      game.players = await manager.find(GamePlayer, {
        where: { gameId },
      });

      if (game.turnPlayerId) {
        game.turnPlayer = await manager.findOne(GamePlayer, {
          where: { id: game.turnPlayerId },
        });
      }

      if (game.status === GameStatus.FINISHED) {
        throw new Error('GAME_FINISHED');
      }

      if (game.status !== GameStatus.ACTIVE) {
        throw new Error('GAME_NOT_ACTIVE');
      }

      const player = await this.validateToken(game, token);

      if (game.turnPlayerId !== player.id) {
        throw new Error('NOT_YOUR_TURN');
      }

      const cell = await manager
        .createQueryBuilder(GameCell, 'cell')
        .where('cell.gameId = :gameId AND cell.x = :x AND cell.y = :y', {
          gameId,
          x,
          y,
        })
        .setLock('pessimistic_write')
        .getOne();

      if (!cell) {
        throw new NotFoundException('Cell not found');
      }

      if (cell.openedAt !== null) {
        throw new Error('CELL_ALREADY_OPENED');
      }

      // Открываем клетку
      const now = new Date();
      cell.openedByPlayerId = player.id;
      cell.openedAt = now;
      await manager.save(cell);

      // Определяем результат хода
      const isDiamond = cell.isDiamond;
      const result: MoveResult = isDiamond
        ? MoveResult.DIAMOND
        : MoveResult.NUMBER;

      // Обновляем счет игрока и количество найденных алмазов
      if (isDiamond) {
        player.score += 1;
        await manager.save(player);

        game.diamondsFound += 1;
      }

      // Переключаем ход только если открыта не алмаз
      // Если открыт алмаз, игрок делает еще один ход (ход не переключается)
      if (!isDiamond) {
        const otherPlayer = game.players.find((p) => p.id !== player.id);
        if (!otherPlayer) {
          throw new Error('Expected exactly 2 players in game');
        }
        game.turnPlayerId = otherPlayer.id;
      }

      const allPlayers = await manager.find(GamePlayer, {
        where: { gameId },
      });

      let gameOver: GameOver | undefined;
      if (game.diamondsFound >= game.diamondsCount) {
        game.status = GameStatus.FINISHED;
        game.turnPlayerId = null;
        game.finishedAt = now;

        const scores: Scores = {
          p1: allPlayers.find((p) => p.slot === 1)?.score || 0,
          p2: allPlayers.find((p) => p.slot === 2)?.score || 0,
        };

        const winner =
          scores.p1 > scores.p2 ? 1 : scores.p2 > scores.p1 ? 2 : 0;

        gameOver = {
          status: GameStatus.FINISHED,
          scores,
          winner,
          reason: GameOverReason.ALL_DIAMONDS_FOUND,
        };
      }

      const updateData: any = {
        diamondsFound: game.diamondsFound,
        status: game.status,
      };

      if (game.turnPlayerId !== null) {
        updateData.turnPlayerId = game.turnPlayerId;
      } else {
        updateData.turnPlayerId = null;
      }

      if (game.finishedAt) {
        updateData.finishedAt = game.finishedAt;
      }

      await manager
        .createQueryBuilder()
        .update(Game)
        .set(updateData)
        .where('id = :gameId', { gameId })
        .execute();

      const moveCount = await manager.count(Move, { where: { gameId } });
      const move = manager.create(Move, {
        gameId: game.id,
        playerId: player.id,
        cellId: cell.id,
        moveNo: moveCount + 1,
        result,
        numberValue: isDiamond ? null : cell.adjacentDiamonds,
      });
      await manager.save(move);

      const updatedGame = await manager
        .createQueryBuilder(Game, 'game')
        .leftJoinAndSelect('game.players', 'players')
        .leftJoinAndSelect('game.cells', 'cells')
        .leftJoinAndSelect('game.turnPlayer', 'turnPlayer')
        .where('game.id = :gameId', { gameId })
        .getOne();

      if (!updatedGame) {
        throw new NotFoundException('Game not found after update');
      }

      const cellValue: BoardCell = isDiamond
        ? { s: CellState.OPENED, t: CellType.DIAMOND }
        : {
            s: CellState.OPENED,
            t: CellType.NUMBER,
            v: cell.adjacentDiamonds,
          };

      const scores: Scores = {
        p1: allPlayers.find((p) => p.slot === 1)?.score || 0,
        p2: allPlayers.find((p) => p.slot === 2)?.score || 0,
      };

      let nextTurnPlayer = 1;
      const currentTurnPlayerId = updatedGame.turnPlayerId;

      if (currentTurnPlayerId) {
        const turnPlayer = updatedGame.players.find(
          (p) => p.id === currentTurnPlayerId,
        );
        if (turnPlayer) {
          nextTurnPlayer = turnPlayer.slot;
        } else {
          const turnPlayerFromAll = allPlayers.find(
            (p) => p.id === currentTurnPlayerId,
          );
          if (turnPlayerFromAll) {
            nextTurnPlayer = turnPlayerFromAll.slot;
          }
        }
      }

      const moveResult: GameMoveResult = {
        x,
        y,
        cell: cellValue,
        turn: nextTurnPlayer,
        scores,
        found: updatedGame.diamondsFound,
      };

      return { game: updatedGame, moveResult, gameOver };
    });
  }

  async disconnectPlayer(gameId: string, playerSlot: number): Promise<Game> {
    const game = await this.findGameById(gameId);
    const player = game.players.find((p) => p.slot === playerSlot);

    if (player) {
      player.connected = false;
      await this.playerRepository.save(player);
    }

    return await this.findGameById(gameId);
  }

  convertToGameState(game: Game, playerSlot?: number): GameState {
    // Формируем доску - все клетки изначально закрыты для обоих игроков
    const board: BoardCell[][] = [];

    // Создаем карту клеток для быстрого поиска
    const cellsMap = new Map<string, GameCell>();
    for (const cell of game.cells) {
      cellsMap.set(`${cell.x},${cell.y}`, cell);
    }

    // Формируем доску: board[y][x] где y - строка, x - столбец
    for (let y = 0; y < game.fieldSize; y++) {
      const row: BoardCell[] = [];
      for (let x = 0; x < game.fieldSize; x++) {
        const cell = cellsMap.get(`${x},${y}`);
        if (!cell) {
          // Клетка не найдена - создаем закрытую (не должно происходить в нормальных условиях)
          row.push({ s: CellState.CLOSED });
        } else if (cell.openedAt === null) {
          // Клетка закрыта - не передаем информацию об алмазах
          row.push({ s: CellState.CLOSED });
        } else if (cell.isDiamond) {
          // Клетка открыта и содержит алмаз
          row.push({ s: CellState.OPENED, t: CellType.DIAMOND });
        } else {
          // Клетка открыта и содержит число
          row.push({
            s: CellState.OPENED,
            t: CellType.NUMBER,
            v: cell.adjacentDiamonds,
          });
        }
      }
      board.push(row);
    }

    const players: Players = {
      p1: {
        connected: game.players.find((p) => p.slot === 1)?.connected || false,
      },
      p2: {
        connected: game.players.find((p) => p.slot === 2)?.connected || false,
      },
    };

    const scores: Scores = {
      p1: game.players.find((p) => p.slot === 1)?.score || 0,
      p2: game.players.find((p) => p.slot === 2)?.score || 0,
    };

    let turn = 1;
    if (game.turnPlayerId) {
      const turnPlayer = game.players.find((p) => p.id === game.turnPlayerId);
      if (turnPlayer) {
        turn = turnPlayer.slot;
      } else if (game.turnPlayer) {
        turn = game.turnPlayer.slot;
      }
    }

    return {
      gameId: game.id,
      status: game.status,
      fieldSize: game.fieldSize,
      diamondsCount: game.diamondsCount,
      found: game.diamondsFound,
      turn,
      scores,
      youAre: playerSlot,
      players,
      board,
    };
  }
}
