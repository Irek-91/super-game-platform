import { GameWithRelations } from '../../domain/repositories/game.repository.interface';
import { GameStatus } from '../../domain/entities/game.entity';
import {
  MoveResult,
  GameOver as GameOverType,
} from '../../types/game-state.types';

export interface CreateGameResult {
  gameId: string;
  status: GameStatus;
  fieldSize: number;
  diamondsCount: number;
  wsUrl: string;
  players: {
    p1: { token: string };
    p2: { token: string };
  };
}

export type JoinGameResult = GameWithRelations;

export interface OpenCellResult {
  gameWithRelations: GameWithRelations;
  moveResult: MoveResult;
  gameOver?: GameOverResult;
}

export interface GameOverResult extends Omit<GameOverType, 'reason'> {
  reason: string;
}

export type DisconnectPlayerResult = GameWithRelations;
