import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { GamesController } from './controllers/games.controller';
import { GamesGateway } from './gateways/games.gateway';
import { BoardService } from './domain/services/board.service';
import { GameStateMapper } from './application/services/game-state.mapper';
import { GameOrmEntity } from './infrastructure/persistence/typeorm-entities/game.entity';
import { GamePlayer } from './infrastructure/persistence/typeorm-entities/game-player.entity';
import { GameCell } from './infrastructure/persistence/typeorm-entities/game-cell.entity';

// Command handlers
import { CreateGameHandler } from './application/commands/create-game.handler';
import { JoinGameHandler } from './application/commands/join-game.handler';
import { OpenCellHandler } from './application/commands/open-cell.handler';
import { DisconnectPlayerHandler } from './application/commands/disconnect-player.handler';

// Query handlers
import { GetGameHandler } from './application/queries/get-game.handler';

// Repository implementations (Infrastructure layer)
import { GameRepository } from './infrastructure/persistence/repositories/game.repository';
import { GamePlayerRepository } from './infrastructure/persistence/repositories/game-player.repository';
import { GameCellRepository } from './infrastructure/persistence/repositories/game-cell.repository';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([GameOrmEntity, GamePlayer, GameCell]),
  ],
  controllers: [GamesController],
  providers: [
    BoardService,
    GameStateMapper,
    CreateGameHandler,
    JoinGameHandler,
    OpenCellHandler,
    DisconnectPlayerHandler,
    GetGameHandler,
    {
      provide: 'IGameRepository',
      useClass: GameRepository,
    },
    {
      provide: 'IGamePlayerRepository',
      useClass: GamePlayerRepository,
    },
    {
      provide: 'IGameCellRepository',
      useClass: GameCellRepository,
    },
    GamesGateway,
  ],
})
export class GamesModule {}
