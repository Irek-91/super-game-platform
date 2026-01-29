import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IGamePlayerRepository } from '@/games/domain/repositories/game-player.repository.interface';
import { GamePlayer } from '@/games/domain/entities/game-player.entity';
import { GamePlayer as GamePlayerOrm } from '../typeorm-entities/game-player.entity';

@Injectable()
export class GamePlayerRepository implements IGamePlayerRepository {
  constructor(
    @InjectRepository(GamePlayerOrm)
    private readonly repo: Repository<GamePlayerOrm>,
  ) {}

  async save(player: GamePlayer): Promise<GamePlayer> {
    const ormEntity = await this.repo.findOne({ where: { id: player.id } });
    if (ormEntity) {
      ormEntity.connected = player.connected;
      ormEntity.score = player.score;
      ormEntity.lastSeenAt = player.lastSeenAt;
      await this.repo.save(ormEntity);
    } else {
      const newEntity = this.repo.create({
        id: player.id,
        gameId: player.gameId,
        slot: player.slot,
        token: player.token,
        connected: player.connected,
        score: player.score,
        joinedAt: player.joinedAt,
        lastSeenAt: player.lastSeenAt,
      });
      await this.repo.save(newEntity);
    }
    return player;
  }

  async findByToken(token: string): Promise<GamePlayer | null> {
    const ormEntity = await this.repo.findOne({ where: { token } });
    if (!ormEntity) return null;
    return this.toDomain(ormEntity);
  }

  async findByGameId(gameId: string): Promise<GamePlayer[]> {
    const ormEntities = await this.repo.find({ where: { gameId } });
    return ormEntities.map(this.toDomain);
  }

  async findById(id: string): Promise<GamePlayer | null> {
    const ormEntity = await this.repo.findOne({ where: { id } });
    if (!ormEntity) return null;
    return this.toDomain(ormEntity);
  }

  private toDomain(orm: GamePlayerOrm): GamePlayer {
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
}
