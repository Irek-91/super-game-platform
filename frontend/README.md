# Frontend - Super Game Platform

Vue 3 приложение для Super Game Platform.

## Технологии

- Vue 3 (Composition API)
- TypeScript
- Vite
- Pinia (state management)
- Vue Router
- Socket.io-client (WebSocket)
- Axios (HTTP клиент)

## Установка

```bash
npm install
```

## Настройка

Создайте файл `.env` в корне проекта `frontend/`:

```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

## Запуск

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173`

## Сборка

```bash
npm run build
```

## Функциональность

1. **Создание игры**: Ввод параметров N (размер поля) и M (количество алмазов)
2. **Подключение к игре**: Выбор игрока (P1 или P2) и подключение через WebSocket
3. **Игровой процесс**: 
   - Отображение игрового поля
   - Открытие клеток по клику
   - Отображение статуса игры (ход, счёт, найденные алмазы)
   - Обработка событий WebSocket (state, move_result, game_over, error)
