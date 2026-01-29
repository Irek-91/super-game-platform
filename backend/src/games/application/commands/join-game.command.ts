import { ICommand } from '@nestjs/cqrs';

export class JoinGameCommand implements ICommand {
  constructor(
    public readonly gameId: string,
    public readonly token: string,
  ) {}
}
