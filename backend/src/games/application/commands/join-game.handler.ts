import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JoinGameCommand } from './join-game.command';
import { IGameRepository } from '../../domain/repositories/game.repository.interface';
import { IGamePlayerRepository } from '../../domain/repositories/game-player.repository.interface';
import { GameStatus } from '../../domain/entities/game.entity';
import { GamePlayer } from '../../domain/entities/game-player.entity';
import { randomInt } from '../../utils/rng.util';
import { JoinGameResult } from '../types/command-results.types';

@CommandHandler(JoinGameCommand)
export class JoinGameHandler implements ICommandHandler<JoinGameCommand> {
  private readonly logger = new Logger(JoinGameHandler.name);

  constructor(
    @Inject('IGameRepository')
    private readonly gameRepository: IGameRepository,
    @Inject('IGamePlayerRepository')
    private readonly playerRepository: IGamePlayerRepository,
  ) {}

  async execute(command: JoinGameCommand): Promise<JoinGameResult> {
    this.logger.log({
      service: 'games',
      gameId: command.gameId,
      eventType: 'join_game',
    });

    const gameWithRelations = await this.gameRepository.findByIdWithRelations(
      command.gameId,
    );

    if (!gameWithRelations) {
      throw new NotFoundException('Game not found');
    }

    const { game, players } = gameWithRelations;

    const playersByToken = new Map<string, GamePlayer>();
    for (const p of players) {
      playersByToken.set(p.token, p);
    }

    const player = playersByToken.get(command.token);
    if (!player) {
      throw new BadRequestException('Invalid token');
    }

    player.connect();
    await this.playerRepository.save(player);

    const allPlayers = await this.playerRepository.findByGameId(game.id);
    const allConnected = allPlayers.every((p) => p.connected);

    if (allConnected && game.status === GameStatus.WAITING) {
      const randomPlayer = allPlayers[randomInt(0, allPlayers.length - 1)];

      game.activate(randomPlayer.id);
      await this.gameRepository.save(game);

      this.logger.log({
        service: 'games',
        gameId: game.id,
        eventType: 'game_started',
        turnPlayerId: randomPlayer.id,
      });
    }

    this.logger.log({
      service: 'games',
      gameId: game.id,
      playerId: player.id,
      eventType: 'player_joined',
      status: 'success',
    });

    return gameWithRelations;
  }
}
