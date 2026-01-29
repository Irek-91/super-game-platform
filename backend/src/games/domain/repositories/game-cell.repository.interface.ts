import { GameCell } from '../entities/game-cell.entity';

export interface IGameCellRepository {
  save(cell: GameCell): Promise<GameCell>;
  saveMany(cells: GameCell[]): Promise<GameCell[]>;
  findByGameId(gameId: string): Promise<GameCell[]>;
  findByGameIdAndCoordinates(
    gameId: string,
    x: number,
    y: number,
  ): Promise<GameCell | null>;
}
