import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamesController } from './controllers/games.controller';
import { GamesGateway } from './gateways/games.gateway';
import { GamesService } from './services/games.service';
import { BoardService } from './services/board.service';
import { Game } from './entities/game.entity';
import { GamePlayer } from './entities/game-player.entity';
import { GameCell } from './entities/game-cell.entity';
import { Move } from './entities/move.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Game, GamePlayer, GameCell, Move])],
  controllers: [GamesController],
  providers: [GamesService, BoardService, GamesGateway],
  exports: [GamesService],
})
export class GamesModule {}
