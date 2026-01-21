# Backend - Super Game Platform

Backend приложение для тестового задания, реализованное на NestJS с TypeScript, PostgreSQL и Socket.io.

## Технологии

- **NestJS** - фреймворк для Node.js
- **TypeScript** - типизированный JavaScript
- **PostgreSQL** - реляционная база данных
- **TypeORM** - ORM для работы с базой данных
- **Socket.io** - библиотека для WebSocket соединений

## Установка и запуск

### Требования

- Node.js (версия 18 или выше)
- PostgreSQL (версия 12 или выше)
- npm или yarn

### Шаги установки

1. **Установите зависимости:**

```bash
cd backend
npm install
```

2. **Настройте переменные окружения:**

Скопируйте `env.example` в `.env` и настройте параметры подключения к базе данных:

```bash
cp env.example .env
```

3. **Настройте базу данных:**

Запустите PostgreSQL через Docker Compose:

```bash
docker-compose up -d
```

**Сброс и очистка базы данных:**

Для полной очистки базы данных (удаление всех данных и volumes):

```bash
docker-compose down

docker-compose down -v

docker-compose up -d
```

4. **Запустите приложение:**

В режиме разработки (с автоперезагрузкой):

```bash
npm run start:dev
```

Приложение будет доступно по адресу: `http://localhost:3000`

## Разработка

### Запуск в режиме разработки

```bash
npm run start:dev
```

### Сборка проекта

```bash
npm run build
```

### Линтинг

```bash
npm run lint
```