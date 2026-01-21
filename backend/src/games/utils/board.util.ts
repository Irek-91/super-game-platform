/**
 * Подсчитывает количество алмазов в соседних ячейках вокруг указанной позиции.
 * Проверяет все 8 соседних ячеек (включая диагональные).
 *
 * @param diamonds - Двумерный массив булевых значений, где true означает наличие алмаза
 * @param x - Координата X ячейки
 * @param y - Координата Y ячейки
 * @param fieldSize - Размер игрового поля (ширина и высота)
 * @returns Количество алмазов в соседних ячейках (от 0 до 8)
 */
export function countAdjacentDiamonds(
  diamonds: boolean[][],
  x: number,
  y: number,
  fieldSize: number,
): number {
  let count = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < fieldSize && ny >= 0 && ny < fieldSize) {
        if (diamonds[nx][ny]) {
          count++;
        }
      }
    }
  }
  return count;
}
