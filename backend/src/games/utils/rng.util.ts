import { randomBytes } from 'crypto';

/**
 * Генерирует уникальный токен с указанным префиксом.
 * Использует криптографически стойкий генератор случайных чисел для создания безопасного токена.
 *
 * @param prefix - Префикс для токена (например, 'game', 'player')
 * @returns Строка токена в формате: {prefix}_{8_символов_случайной_строки}
 */
export function generateToken(prefix: string): string {
  const randomPart = randomBytes(6).toString('base64url').substring(0, 8);
  return `${prefix}_${randomPart}`;
}

/**
 * Генерирует случайное целое число в указанном диапазоне (включительно).
 *
 * @param min - Минимальное значение (включительно)
 * @param max - Максимальное значение (включительно)
 * @returns Случайное целое число от min до max включительно
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Перемешивает элементы массива используя алгоритм Фишера-Йетса.
 * Создает новый массив, не изменяя исходный.
 *
 * @param array - Исходный массив для перемешивания
 * @returns Новый массив с перемешанными элементами
 * @template T - Тип элементов массива
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
