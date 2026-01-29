import { IQuery } from '@nestjs/cqrs';

export class GetGameQuery implements IQuery {
  constructor(public readonly gameId: string) {}
}
