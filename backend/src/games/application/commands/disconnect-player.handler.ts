import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { DisconnectPlayerCommand } from './disconnect-player.command';
import { IGameRepository } from '../../domain/repositories/game.repository.interface';
import { IGamePlayerRepository } from '../../domain/repositories/game-player.repository.interface';
import { GamePlayer } from '../../domain/entities/game-player.entity';
import { DisconnectPlayerResult } from '../types/command-results.types';

@CommandHandler(DisconnectPlayerCommand)
export class DisconnectPlayerHandler implements ICommandHandler<DisconnectPlayerCommand> {
  private readonly logger = new Logger(DisconnectPlayerHandler.name);

  constructor(
    @Inject('IGameRepository')
    private readonly gameRepository: IGameRepository,
    @Inject('IGamePlayerRepository')
    private readonly playerRepository: IGamePlayerRepository,
  ) {}

  async execute(
    command: DisconnectPlayerCommand,
  ): Promise<DisconnectPlayerResult> {
    this.logger.log({
      service: 'games',
      gameId: command.gameId,
      playerSlot: command.playerSlot,
      eventType: 'disconnect_player',
    });

    const gameWithRelations = await this.gameRepository.findByIdWithRelations(
      command.gameId,
    );

    if (!gameWithRelations) {
      throw new NotFoundException('Game not found');
    }

    const { players } = gameWithRelations;

    const playersBySlot = new Map<number, GamePlayer>();
    for (const p of players) {
      playersBySlot.set(p.slot, p);
    }
    const player = playersBySlot.get(command.playerSlot);

    if (player) {
      player.disconnect();
      await this.playerRepository.save(player);
    }

    this.logger.log({
      service: 'games',
      gameId: command.gameId,
      playerSlot: command.playerSlot,
      eventType: 'player_disconnected',
      status: 'success',
    });

    return gameWithRelations;
  }
}
