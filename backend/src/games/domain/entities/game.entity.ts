export enum GameStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  FINISHED = 'finished',
}

export class Game {
  constructor(
    public readonly id: string,
    public readonly fieldSize: number,
    public readonly diamondsCount: number,
    public status: GameStatus,
    public turnPlayerId: string | null,
    public diamondsFound: number,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public finishedAt: Date | null,
  ) {}

  /**
   * Бизнес-инвариант: игра может быть завершена только если все алмазы найдены
   */
  canFinish(): boolean {
    return this.diamondsFound >= this.diamondsCount;
  }

  /**
   * Бизнес-логика: завершение игры
   */
  finish(): void {
    if (!this.canFinish()) {
      throw new Error('Cannot finish game: not all diamonds found');
    }
    this.status = GameStatus.FINISHED;
    this.turnPlayerId = null;
    this.finishedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Бизнес-логика: активация игры
   */
  activate(turnPlayerId: string): void {
    if (this.status !== GameStatus.WAITING) {
      throw new Error('Game can only be activated from WAITING status');
    }
    this.status = GameStatus.ACTIVE;
    this.turnPlayerId = turnPlayerId;
    this.updatedAt = new Date();
  }

  /**
   * Бизнес-логика: переключение хода
   */
  switchTurn(otherPlayerId: string): void {
    if (this.status !== GameStatus.ACTIVE) {
      throw new Error('Can only switch turn in ACTIVE game');
    }
    this.turnPlayerId = otherPlayerId;
    this.updatedAt = new Date();
  }

  /**
   * Бизнес-логика: увеличение счетчика найденных алмазов
   */
  incrementDiamondsFound(): void {
    if (this.diamondsFound >= this.diamondsCount) {
      throw new Error('All diamonds already found');
    }
    this.diamondsFound += 1;
    this.updatedAt = new Date();
  }
}
