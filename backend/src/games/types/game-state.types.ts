/**
 * Типы для API и WebSocket событий
 * Эти типы используются для обмена данными с клиентом
 */

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

/**
 * Закрытая клетка на доске
 */
export interface ClosedCell {
  s: CellState.CLOSED;
}

/**
 * Открытая клетка с числом (количество соседних алмазов)
 */
export interface OpenNumberCell {
  s: CellState.OPENED;
  t: CellType.NUMBER;
  v: number;
}

/**
 * Открытая клетка с алмазом
 */
export interface OpenDiamondCell {
  s: CellState.OPENED;
  t: CellType.DIAMOND;
}

export type BoardCell = ClosedCell | OpenNumberCell | OpenDiamondCell;
export type Board = BoardCell[][];

/**
 * Счет игроков (для API)
 */
export interface Scores {
  p1: number;
  p2: number;
}

/**
 * Информация об игроках (для API)
 */
export interface Players {
  p1: { connected: boolean };
  p2: { connected: boolean };
}

/**
 * Полное состояние игры (отправляется клиенту через WebSocket)
 */
export interface GameState {
  gameId: string;
  status: GameStatus | string;
  fieldSize: number; // размер поля NxN
  diamondsCount: number; // количество алмазов
  found: number; // diamondsFound - количество найденных алмазов
  turn: number; // slot игрока, чей сейчас ход (1 или 2)
  scores: Scores;
  youAre?: number; // slot текущего игрока (1 или 2)
  players: Players;
  board: Board;
}

/**
 * Результат хода (отправляется клиенту через WebSocket)
 */
export interface MoveResult {
  x: number;
  y: number;
  cell: OpenNumberCell | OpenDiamondCell;
  turn: number; // slot игрока, чей следующий ход (1 или 2)
  scores: Scores;
  found: number; // diamondsFound - количество найденных алмазов
}

export enum GameOverReason {
  ALL_DIAMONDS_FOUND = 'all_diamonds_found',
}

/**
 * Событие окончания игры (отправляется клиенту через WebSocket)
 */
export interface GameOver {
  status: GameStatus.FINISHED;
  scores: Scores;
  winner: number; // slot победителя (1 или 2, или 0 если ничья)
  reason: GameOverReason;
}

/**
 * Ошибка WebSocket
 */
export interface WsError {
  code: string;
  message: string;
}
