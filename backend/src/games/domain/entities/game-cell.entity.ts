export class GameCell {
  constructor(
    public readonly id: string,
    public readonly gameId: string,
    public readonly x: number,
    public readonly y: number,
    public readonly isDiamond: boolean,
    public readonly adjacentDiamonds: number,
    public openedByPlayerId: string | null,
    public openedAt: Date | null,
  ) {}

  /**
   * Бизнес-логика: открытие клетки
   */
  open(playerId: string): void {
    if (this.openedAt !== null) {
      throw new Error('Cell is already opened');
    }
    this.openedByPlayerId = playerId;
    this.openedAt = new Date();
  }

  /**
   * Бизнес-инвариант: проверка, открыта ли клетка
   */
  isOpened(): boolean {
    return this.openedAt !== null;
  }

  /**
   * Бизнес-инвариант: валидация координат
   */
  static validateCoordinates(x: number, y: number, fieldSize: number): void {
    if (x < 0 || x >= fieldSize || y < 0 || y >= fieldSize) {
      throw new Error('Coordinates out of bounds');
    }
  }
}
