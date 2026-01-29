import { Game } from '../entities/game.entity';
import { GamePlayer } from '../entities/game-player.entity';
import { GameCell } from '../entities/game-cell.entity';

export interface IGameRepository {
  save(game: Game): Promise<Game>;
  findById(id: string): Promise<Game | null>;
  findByIdWithRelations(id: string): Promise<GameWithRelations | null>;
}

export interface GameWithRelations {
  game: Game;
  players: GamePlayer[];
  cells: GameCell[];
}
