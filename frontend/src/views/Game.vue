<template>
  <div class="game">
    <div class="container">
      <div class="header">
        <h1>Игра Алмазы</h1>
        <button @click="handleDisconnect" class="btn-exit">Выход</button>
      </div>

      <div v-if="error" class="error-banner">{{ error }}</div>

      <div v-if="!gameState" class="loading">
        <p>Подключение к игре...</p>
      </div>

      <div v-else class="game-content">
        <!-- Статус панель -->
        <div class="status-panel">
          <div class="status-item">
            <span class="label">Статус:</span>
            <span class="value">{{ getStatusText(gameStatus) }}</span>
          </div>
          <div class="status-item">
            <span class="label">Ход:</span>
            <span class="value" :class="{ 'your-turn': isMyTurn }">
              {{ currentTurn === 1 ? 'Игрок 1' : 'Игрок 2' }}
              <span v-if="isMyTurn"> (Вы)</span>
            </span>
          </div>
          <div class="status-item">
            <span class="label">Алмазы:</span>
            <span class="value">{{ foundDiamonds }} / {{ totalDiamonds }}</span>
          </div>
          <div class="status-item">
            <span class="label">Счёт:</span>
            <span class="value">
              P1: {{ scores.p1 }} | P2: {{ scores.p2 }}
            </span>
          </div>
          <div class="status-item">
            <span class="label">Вы:</span>
            <span class="value">Игрок {{ playerSlot }}</span>
          </div>
        </div>

        <!-- Игровая доска -->
        <Board
          :board="board"
          :is-my-turn="isMyTurn"
          :game-status="gameStatus"
          @cell-click="handleCellClick"
        />

        <!-- Игроки -->
        <div v-if="gameState" class="players-info">
          <div class="player" :class="{ connected: gameState.players.p1.connected }">
            <span>Игрок 1</span>
            <span class="status-indicator">
              {{ gameState.players.p1.connected ? '🟢' : '🔴' }}
            </span>
          </div>
          <div class="player" :class="{ connected: gameState.players.p2.connected }">
            <span>Игрок 2</span>
            <span class="status-indicator">
              {{ gameState.players.p2.connected ? '🟢' : '🔴' }}
            </span>
          </div>
        </div>

        <!-- Сообщение о завершении игры -->
        <div v-if="gameStatus === GameStatus.FINISHED && gameState" class="game-over">
          <h2>Игра окончена!</h2>
          <p v-if="gameState.scores.p1 > gameState.scores.p2">
            Победил Игрок 1!
          </p>
          <p v-else-if="gameState.scores.p2 > gameState.scores.p1">
            Победил Игрок 2!
          </p>
          <p v-else>Ничья!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game.store';
import Board from '@/components/Board.vue';
import { GameStatus } from '@/types/game.types';

const route = useRoute();
const router = useRouter();
const gameStore = useGameStore();

const {
  gameState,
  gameStatus,
  isMyTurn,
  currentTurn,
  foundDiamonds,
  totalDiamonds,
  scores,
  board,
  playerSlot,
  error,
} = storeToRefs(gameStore);

function getStatusText(status: GameStatus | string | null): string {
  switch (status) {
    case GameStatus.WAITING:
      return 'Ожидание игроков';
    case GameStatus.ACTIVE:
      return 'Игра идёт';
    case GameStatus.FINISHED:
      return 'Игра окончена';
    default:
      return 'Неизвестно';
  }
}

function handleCellClick(x: number, y: number) {
  try {
    gameStore.openCell(x, y);
  } catch (err: any) {
    // Ошибка обрабатывается в store
  }
}

function handleDisconnect() {
  gameStore.disconnect();
  router.push('/');
}

onMounted(() => {
  const gameId = route.params.id as string;
  const urlToken = route.query.token as string;
  const urlSlot = route.query.slot as string;

  // Если есть токен в URL, подключаемся автоматически
  if (gameId && urlToken && urlSlot && !gameStore.gameId) {
    gameStore.setPlayerInfo(gameId, urlToken, parseInt(urlSlot));
    gameStore.connectWebSocket();
  } else if (!gameStore.gameId && gameId) {
    // Если нет токена, но есть gameId - редирект на главную
    router.push('/');
  }
});

onUnmounted(() => {
  // Не отключаемся при размонтировании, чтобы можно было вернуться
});
</script>

<style scoped>
.game {
  min-height: 100vh;
  padding: 20px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header h1 {
  font-size: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.btn-exit {
  padding: 8px 16px;
  background: #f44336;
  color: white;
  border-radius: 6px;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-exit:hover {
  background: #d32f2f;
}

.error-banner {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
}

.loading {
  text-align: center;
  padding: 40px;
  color: white;
  font-size: 1.2rem;
}

.game-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.status-panel {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-item .label {
  font-size: 0.875rem;
  color: #666;
  font-weight: 600;
}

.status-item .value {
  font-size: 1.125rem;
  color: #333;
  font-weight: 600;
}

.status-item .value.your-turn {
  color: #667eea;
}

.players-info {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.player {
  background: white;
  padding: 12px 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.player.connected {
  border: 2px solid #4caf50;
}

.status-indicator {
  font-size: 1.2rem;
}

.game-over {
  background: white;
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.game-over h2 {
  font-size: 1.5rem;
  margin-bottom: 12px;
  color: #333;
}

.game-over p {
  font-size: 1.125rem;
  color: #666;
}
</style>
