import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { GetGameQuery } from './get-game.query';
import {
  IGameRepository,
  GameWithRelations,
} from '../../domain/repositories/game.repository.interface';

@QueryHandler(GetGameQuery)
export class GetGameHandler implements IQueryHandler<GetGameQuery> {
  private readonly logger = new Logger(GetGameHandler.name);

  constructor(
    @Inject('IGameRepository')
    private readonly gameRepository: IGameRepository,
  ) {}

  async execute(query: GetGameQuery): Promise<GameWithRelations> {
    const gameWithRelations = await this.gameRepository.findByIdWithRelations(
      query.gameId,
    );

    if (!gameWithRelations) {
      throw new NotFoundException('Game not found');
    }

    return gameWithRelations;
  }
}
