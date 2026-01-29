import { ICommand } from '@nestjs/cqrs';

export class DisconnectPlayerCommand implements ICommand {
  constructor(
    public readonly gameId: string,
    public readonly playerSlot: number,
  ) {}
}
