import { ICommand } from '@nestjs/cqrs';

export class OpenCellCommand implements ICommand {
  constructor(
    public readonly gameId: string,
    public readonly token: string,
    public readonly x: number,
    public readonly y: number,
  ) {}
}
