import { Injectable } from '@nestjs/common';
import { shuffleArray } from '../utils/rng.util';
import { countAdjacentDiamonds } from '../utils/board.util';

@Injectable()
export class BoardService {
  /**
   * Генерирует расположение алмазов на поле fieldSize x fieldSize
   * @param fieldSize размер поля
   * @param diamondsCount количество алмазов (нечетное)
   * @returns boolean[][] где true означает наличие алмаза
   */
  generateDiamonds(fieldSize: number, diamondsCount: number): boolean[][] {
    const diamonds: boolean[][] = Array(fieldSize)
      .fill(null)
      .map(() => Array(fieldSize).fill(false));

    // Создаем список всех возможных позиций
    const positions: Array<[number, number]> = [];
    for (let x = 0; x < fieldSize; x++) {
      for (let y = 0; y < fieldSize; y++) {
        positions.push([x, y]);
      }
    }

    // Перемешиваем и выбираем первые diamondsCount позиций
    const shuffled = shuffleArray(positions);
    for (let i = 0; i < diamondsCount; i++) {
      const [x, y] = shuffled[i];
      diamonds[x][y] = true;
    }

    return diamonds;
  }

  /**
   * Подсчитывает количество соседних алмазов для клетки
   */
  countAdjacentDiamonds(
    diamonds: boolean[][],
    x: number,
    y: number,
    fieldSize: number,
  ): number {
    return countAdjacentDiamonds(diamonds, x, y, fieldSize);
  }
}
