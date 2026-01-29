import { GamePlayer } from '../entities/game-player.entity';

export interface IGamePlayerRepository {
  save(player: GamePlayer): Promise<GamePlayer>;
  findByToken(token: string): Promise<GamePlayer | null>;
  findByGameId(gameId: string): Promise<GamePlayer[]>;
  findById(id: string): Promise<GamePlayer | null>;
}
