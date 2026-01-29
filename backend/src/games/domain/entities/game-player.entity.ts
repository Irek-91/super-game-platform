export class GamePlayer {
  constructor(
    public readonly id: string,
    public readonly gameId: string,
    public readonly slot: number,
    public readonly token: string,
    public connected: boolean,
    public score: number,
    public readonly joinedAt: Date,
    public lastSeenAt: Date | null,
  ) {}

  /**
   * Бизнес-логика: подключение игрока
   */
  connect(): void {
    this.connected = true;
    this.lastSeenAt = new Date();
  }

  /**
   * Бизнес-логика: отключение игрока
   */
  disconnect(): void {
    this.connected = false;
  }

  /**
   * Бизнес-логика: увеличение счета
   */
  incrementScore(): void {
    this.score += 1;
  }

  /**
   * Бизнес-инвариант: валидация слота
   */
  static validateSlot(slot: number): void {
    if (slot !== 1 && slot !== 2) {
      throw new Error('Slot must be 1 or 2');
    }
  }
}
