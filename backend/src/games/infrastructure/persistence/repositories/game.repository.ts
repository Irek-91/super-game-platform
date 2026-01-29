import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  IGameRepository,
  GameWithRelations,
} from '@/games/domain/repositories/game.repository.interface';
import { Game } from '@/games/domain/entities/game.entity';
import { GamePlayer } from '@/games/domain/entities/game-player.entity';
import { GameCell } from '@/games/domain/entities/game-cell.entity';
import { GameOrmEntity } from '../typeorm-entities/game.entity';
import { GamePlayer as GamePlayerOrm } from '../typeorm-entities/game-player.entity';
import { GameCell as GameCellOrm } from '../typeorm-entities/game-cell.entity';

@Injectable()
export class GameRepository implements IGameRepository {
  constructor(
    @InjectRepository(GameOrmEntity)
    private readonly gameRepo: Repository<GameOrmEntity>,
    @InjectRepository(GamePlayerOrm)
    private readonly playerRepo: Repository<GamePlayerOrm>,
    @InjectRepository(GameCellOrm)
    private readonly cellRepo: Repository<GameCellOrm>,
    private readonly dataSource: DataSource,
  ) {}

  async save(game: Game): Promise<Game> {
    const ormEntity = await this.gameRepo.findOne({ where: { id: game.id } });

    if (ormEntity) {
      ormEntity.status = game.status;
      ormEntity.turnPlayerId = game.turnPlayerId;
      ormEntity.diamondsFound = game.diamondsFound;
      ormEntity.updatedAt = game.updatedAt;
      ormEntity.finishedAt = game.finishedAt;
      await this.gameRepo.save(ormEntity);
    } else {
      const newEntity = this.gameRepo.create({
        id: game.id,
        fieldSize: game.fieldSize,
        diamondsCount: game.diamondsCount,
        status: game.status,
        turnPlayerId: game.turnPlayerId,
        diamondsFound: game.diamondsFound,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
        finishedAt: game.finishedAt,
      });
      await this.gameRepo.save(newEntity);
    }
    return game;
  }

  async findById(id: string): Promise<Game | null> {
    const ormEntity = await this.gameRepo.findOne({ where: { id } });
    if (!ormEntity) return null;
    return this.toDomain(ormEntity);
  }

  async findByIdWithRelations(id: string): Promise<GameWithRelations | null> {
    const ormEntity = await this.gameRepo.findOne({
      where: { id },
      relations: ['players', 'cells'],
    });
    if (!ormEntity) return null;

    return {
      game: this.toDomain(ormEntity),
      players: ormEntity.players.map(this.playerToDomain),
      cells: ormEntity.cells.map(this.cellToDomain),
    };
  }

  private toDomain(orm: GameOrmEntity): Game {
    return new Game(
      orm.id,
      orm.fieldSize,
      orm.diamondsCount,
      orm.status,
      orm.turnPlayerId,
      orm.diamondsFound,
      orm.createdAt,
      orm.updatedAt,
      orm.finishedAt,
    );
  }

  private playerToDomain(orm: GamePlayerOrm): GamePlayer {
    return new GamePlayer(
      orm.id,
      orm.gameId,
      orm.slot,
      orm.token,
      orm.connected,
      orm.score,
      orm.joinedAt,
      orm.lastSeenAt,
    );
  }

  private cellToDomain(orm: GameCellOrm): GameCell {
    return new GameCell(
      orm.id,
      orm.gameId,
      orm.x,
      orm.y,
      orm.isDiamond,
      orm.adjacentDiamonds,
      orm.openedByPlayerId,
      orm.openedAt,
    );
  }
}
