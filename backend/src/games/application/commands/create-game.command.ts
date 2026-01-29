import { ICommand } from '@nestjs/cqrs';

export class CreateGameCommand implements ICommand {
  constructor(
    public readonly fieldSize: number,
    public readonly diamondsCount: number,
  ) {}
}
