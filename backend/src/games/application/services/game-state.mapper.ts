import { Injectable } from '@nestjs/common';
import { Game } from '../../domain/entities/game.entity';
import { GamePlayer } from '../../domain/entities/game-player.entity';
import { GameCell } from '../../domain/entities/game-cell.entity';
import {
  GameState,
  BoardCell,
  Scores,
  Players,
  CellState,
  CellType,
} from '../../types/game-state.types';

@Injectable()
export class GameStateMapper {
  convertToGameState(
    game: Game,
    players: GamePlayer[],
    cells: GameCell[],
    playerSlot?: number,
  ): GameState {
    const board: BoardCell[][] = [];

    const cellsMap = new Map<string, GameCell>();
    for (const cell of cells) {
      cellsMap.set(`${cell.x},${cell.y}`, cell);
    }

    const playersBySlot = new Map<number, GamePlayer>();
    const playersById = new Map<string, GamePlayer>();
    for (const player of players) {
      playersBySlot.set(player.slot, player);
      playersById.set(player.id, player);
    }

    for (let y = 0; y < game.fieldSize; y++) {
      const row: BoardCell[] = [];
      for (let x = 0; x < game.fieldSize; x++) {
        const cell = cellsMap.get(`${x},${y}`);
        if (!cell) {
          row.push({ s: CellState.CLOSED });
        } else if (cell.openedAt === null) {
          row.push({ s: CellState.CLOSED });
        } else if (cell.isDiamond) {
          row.push({ s: CellState.OPENED, t: CellType.DIAMOND });
        } else {
          row.push({
            s: CellState.OPENED,
            t: CellType.NUMBER,
            v: cell.adjacentDiamonds,
          });
        }
      }
      board.push(row);
    }

    const player1 = playersBySlot.get(1);
    const player2 = playersBySlot.get(2);

    const playersDto: Players = {
      p1: {
        connected: player1?.connected || false,
      },
      p2: {
        connected: player2?.connected || false,
      },
    };

    const scores: Scores = {
      p1: player1?.score || 0,
      p2: player2?.score || 0,
    };

    let turn = 1;
    if (game.turnPlayerId) {
      const turnPlayer = playersById.get(game.turnPlayerId);
      if (turnPlayer) {
        turn = turnPlayer.slot;
      }
    }

    return {
      gameId: game.id,
      status: game.status,
      fieldSize: game.fieldSize,
      diamondsCount: game.diamondsCount,
      found: game.diamondsFound,
      turn,
      scores,
      youAre: playerSlot,
      players: playersDto,
      board,
    };
  }
}
