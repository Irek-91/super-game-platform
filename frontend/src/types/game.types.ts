export enum GameStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  FINISHED = 'finished',
}

export enum CellState {
  CLOSED = 'c',
  OPENED = 'o',
}

export enum CellType {
  NUMBER = 'n',
  DIAMOND = 'd',
}

export interface ClosedCell {
  s: CellState.CLOSED;
}

export interface OpenNumberCell {
  s: CellState.OPENED;
  t: CellType.NUMBER;
  v: number; // 0-8
}

export interface OpenDiamondCell {
  s: CellState.OPENED;
  t: CellType.DIAMOND;
}

export type BoardCell = ClosedCell | OpenNumberCell | OpenDiamondCell;
export type Board = BoardCell[][];

export interface Scores {
  p1: number;
  p2: number;
}

export interface Players {
  p1: { connected: boolean };
  p2: { connected: boolean };
}

export interface GameState {
  status: GameStatus | string;
  diamondsCount: number;
  found: number;
  turn: number;
  scores: Scores;
  youAre?: number;
  players: Players;
  board: Board;
}

export interface GameOver {
  status: GameStatus.FINISHED;
  scores: Scores;
}

export interface WsError {
  code: string;
  message: string;
}

export interface CreateGameResponse {
  gameId: string;
  players: {
    p1: { token: string };
    p2: { token: string };
  };
}

