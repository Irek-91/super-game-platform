import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { GamesService } from '../services/games.service';
import { CreateGameDto } from '../dto/create-game.dto';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createGame(@Body() createGameDto: CreateGameDto) {
    const { fieldSize, diamondsCount } = createGameDto;

    const game = await this.gamesService.createGame(fieldSize, diamondsCount);

    const player1 = game.players.find((p) => p.slot === 1);
    const player2 = game.players.find((p) => p.slot === 2);

    return {
      gameId: game.id,
      status: game.status,
      fieldSize: game.fieldSize,
      diamondsCount: game.diamondsCount,
      wsUrl: '/ws',
      players: {
        p1: { token: player1?.token || '' },
        p2: { token: player2?.token || '' },
      },
    };
  }
}
