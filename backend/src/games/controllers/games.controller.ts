import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CreateGameDto } from '../dto/create-game.dto';
import { CreateGameCommand } from '../application/commands/create-game.command';

@Controller('games')
export class GamesController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createGame(@Body() createGameDto: CreateGameDto) {
    const { fieldSize, diamondsCount } = createGameDto;

    return await this.commandBus.execute(
      new CreateGameCommand(fieldSize, diamondsCount),
    );
  }
}
