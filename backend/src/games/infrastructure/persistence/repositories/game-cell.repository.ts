import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IGameCellRepository } from '@/games/domain/repositories/game-cell.repository.interface';
import { GameCell } from '@/games/domain/entities/game-cell.entity';
import { GameCell as GameCellOrm } from '../typeorm-entities/game-cell.entity';

@Injectable()
export class GameCellRepository implements IGameCellRepository {
  constructor(
    @InjectRepository(GameCellOrm)
    private readonly repo: Repository<GameCellOrm>,
  ) {}

  async save(cell: GameCell): Promise<GameCell> {
    const ormEntity = await this.repo.findOne({
      where: { gameId: cell.gameId, x: cell.x, y: cell.y },
    });
    if (ormEntity) {
      ormEntity.openedByPlayerId = cell.openedByPlayerId;
      ormEntity.openedAt = cell.openedAt;
      await this.repo.save(ormEntity);
    } else {
      const newEntity = this.repo.create({
        id: cell.id,
        gameId: cell.gameId,
        x: cell.x,
        y: cell.y,
        isDiamond: cell.isDiamond,
        adjacentDiamonds: cell.adjacentDiamonds,
        openedByPlayerId: cell.openedByPlayerId,
        openedAt: cell.openedAt,
      });
      await this.repo.save(newEntity);
    }
    return cell;
  }

  async saveMany(cells: GameCell[]): Promise<GameCell[]> {
    const ormEntities = cells.map((cell) =>
      this.repo.create({
        id: cell.id,
        gameId: cell.gameId,
        x: cell.x,
        y: cell.y,
        isDiamond: cell.isDiamond,
        adjacentDiamonds: cell.adjacentDiamonds,
        openedByPlayerId: cell.openedByPlayerId,
        openedAt: cell.openedAt,
      }),
    );
    await this.repo.save(ormEntities);
    return cells;
  }

  async findByGameId(gameId: string): Promise<GameCell[]> {
    const ormEntities = await this.repo.find({ where: { gameId } });
    return ormEntities.map(this.toDomain);
  }

  async findByGameIdAndCoordinates(
    gameId: string,
    x: number,
    y: number,
  ): Promise<GameCell | null> {
    const ormEntity = await this.repo.findOne({
      where: { gameId, x, y },
    });
    if (!ormEntity) return null;
    return this.toDomain(ormEntity);
  }

  private toDomain(orm: GameCellOrm): GameCell {
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
