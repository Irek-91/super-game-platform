<template>
  <div class="create-game">
    <div class="container">
      <h1 class="title">Игра Алмазы</h1>
      
      <div class="tabs">
        <button
          @click="activeTab = 'create'"
          :class="['tab', { active: activeTab === 'create' }]"
        >
          Создать игру
        </button>
        <button
          @click="activeTab = 'join'"
          :class="['tab', { active: activeTab === 'join' }]"
        >
          Подключиться к игре
        </button>
      </div>

      <!-- Создание игры -->
      <div v-if="activeTab === 'create'" class="tab-content">
        <p class="subtitle">Создайте новую игру</p>

        <form @submit.prevent="handleCreateGame" class="form">
        <div class="form-group">
          <label for="fieldSize">Размер поля:</label>
          <input
            id="fieldSize"
            v-model.number="fieldSize"
            type="number"
            min="2"
            max="5"
            required
            class="input"
          />
          <small>От 2 до 5</small>
        </div>

        <div class="form-group">
          <label for="diamondsCount">Количество алмазов:</label>
          <input
            id="diamondsCount"
            v-model.number="diamondsCount"
            type="number"
            min="1"
            required
            class="input"
          />
          <small>Нечётное число, не больше размера поля × размер поля</small>
        </div>

        <button
          type="submit"
          :disabled="isLoading || !isValid"
          class="btn btn-primary"
        >
          {{ isLoading ? 'Создание...' : 'Создать игру' }}
        </button>

        <div v-if="error" class="error">{{ error }}</div>
      </form>

      <div v-if="gameCreated" class="game-created">
        <h2>Игра создана!</h2>
        <p class="game-id">ID игры: <strong>{{ gameId }}</strong></p>
        
        <div class="links-section">
          <h3>Ссылки для подключения:</h3>
          
          <div class="link-item">
            <label>Игрок 1:</label>
            <div class="link-display">
              <input
                :value="getJoinLink(gameId || '', tokens?.p1 || '', 1)"
                readonly
                class="link-input"
                :id="'link-p1'"
              />
              <button @click="copyLink('link-p1')" class="btn-copy" title="Копировать ссылку">
                📋
              </button>
            </div>
            <a :href="getJoinLink(gameId || '', tokens?.p1 || '', 1)" target="_blank" class="join-link">
              Открыть в новой вкладке
            </a>
          </div>
          
          <div class="link-item">
            <label>Игрок 2:</label>
            <div class="link-display">
              <input
                :value="getJoinLink(gameId || '', tokens?.p2 || '', 2)"
                readonly
                class="link-input"
                :id="'link-p2'"
              />
              <button @click="copyLink('link-p2')" class="btn-copy" title="Копировать ссылку">
                📋
              </button>
            </div>
            <a :href="getJoinLink(gameId || '', tokens?.p2 || '', 2)" target="_blank" class="join-link">
              Открыть в новой вкладке
            </a>
          </div>
        </div>

        <div class="info-box">
          <p>💡 <strong>Как играть:</strong></p>
          <ol>
            <li>Скопируйте ссылку для Игрока 1 и откройте её в одном браузере/вкладке</li>
            <li>Скопируйте ссылку для Игрока 2 и откройте её в другом браузере/вкладке</li>
            <li>Когда оба игрока подключены, игра начнётся автоматически</li>
          </ol>
        </div>
      </div>
      </div>

      <!-- Подключение к игре -->
      <div v-if="activeTab === 'join'" class="tab-content">
        <p class="subtitle">Подключитесь к существующей игре</p>

        <form @submit.prevent="handleJoinGame" class="form">
          <div class="form-group">
            <label for="join-url">Ссылка на игру:</label>
            <input
              id="join-url"
              v-model="joinUrl"
              type="text"
              required
              class="input"
              placeholder="Вставьте ссылку на игру"
            />
            <small>Вставьте полную ссылку на игру, например: http://localhost:5173/game/xxx?token=yyy&slot=1</small>
          </div>

          <button
            type="submit"
            :disabled="isJoining || !joinUrl"
            class="btn btn-primary"
          >
            {{ isJoining ? 'Подключение...' : 'Подключиться' }}
          </button>

          <div v-if="joinError" class="error">{{ joinError }}</div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game.store';

const router = useRouter();
const gameStore = useGameStore();

const activeTab = ref<'create' | 'join'>('create');
const fieldSize = ref(5);
const diamondsCount = ref(11);
const isLoading = ref(false);
const error = ref<string | null>(null);
const gameCreated = ref(false);
const gameId = ref<string | null>(null);
const tokens = ref<{ p1: string; p2: string } | null>(null);

// Join form
const joinUrl = ref('');
const isJoining = ref(false);
const joinError = ref<string | null>(null);

const isValid = computed(() => {
  return (
    fieldSize.value >= 2 &&
    fieldSize.value <= 5 &&
    diamondsCount.value >= 1 &&
    diamondsCount.value <= fieldSize.value * fieldSize.value &&
    diamondsCount.value % 2 === 1
  );
});

async function handleCreateGame() {
  if (!isValid.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    const response = await gameStore.createGame(fieldSize.value, diamondsCount.value);
    gameId.value = response.gameId;
    tokens.value = {
      p1: response.players.p1.token,
      p2: response.players.p2.token,
    };
    gameCreated.value = true;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Ошибка при создании игры';
  } finally {
    isLoading.value = false;
  }
}

function joinAsPlayer(slot: number) {
  if (!gameId.value || !tokens.value) return;

  const token = slot === 1 ? tokens.value.p1 : tokens.value.p2;
  gameStore.setPlayerInfo(gameId.value, token, slot);
  gameStore.connectWebSocket();
  router.push(`/game/${gameId.value}`);
}

function parseGameUrl(url: string): { gameId: string; token: string; slot: number } | null {
  try {
    // Пытаемся распарсить URL
    let urlObj: URL;
    try {
      urlObj = new URL(url);
    } catch {
      // Если не полный URL, пробуем как относительный путь
      urlObj = new URL(url, window.location.origin);
    }

    // Извлекаем gameId из пути /game/{gameId}
    const pathMatch = urlObj.pathname.match(/\/game\/([^\/]+)/);
    if (!pathMatch) {
      return null;
    }

    const gameId = pathMatch[1];
    const token = urlObj.searchParams.get('token');
    const slot = urlObj.searchParams.get('slot');

    if (!token || !slot) {
      return null;
    }

    return {
      gameId,
      token,
      slot: parseInt(slot, 10),
    };
  } catch (err) {
    return null;
  }
}

async function handleJoinGame() {
  if (!joinUrl.value) return;

  isJoining.value = true;
  joinError.value = null;

  try {
    // Парсим URL
    const parsed = parseGameUrl(joinUrl.value);
    if (!parsed) {
      joinError.value = 'Неверный формат ссылки. Используйте ссылку вида: /game/{gameId}?token=...&slot=...';
      isJoining.value = false;
      return;
    }

    const { gameId, token, slot } = parsed;

    // Устанавливаем информацию об игроке
    gameStore.setPlayerInfo(gameId, token, slot);
    gameStore.connectWebSocket();
    
    // Переходим на страницу игры - там произойдёт подключение
    router.push(`/game/${gameId}?token=${token}&slot=${slot}`);
  } catch (err: any) {
    joinError.value = err.message || 'Ошибка при подключении к игре';
    isJoining.value = false;
  }
}

async function copyLink(inputId: string) {
  const input = document.getElementById(inputId) as HTMLInputElement;
  if (!input) return;

  try {
    // Используем современный Clipboard API
    await navigator.clipboard.writeText(input.value);
    
    // Показываем визуальную обратную связь
    const button = input.nextElementSibling as HTMLButtonElement;
    if (button) {
      const originalText = button.textContent;
      button.textContent = '✓';
      button.style.background = '#4caf50';
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
      }, 1000);
    }
  } catch (err) {
    // Fallback для старых браузеров
    input.select();
    document.execCommand('copy');
    
    const button = input.nextElementSibling as HTMLButtonElement;
    if (button) {
      const originalText = button.textContent;
      button.textContent = '✓';
      button.style.background = '#4caf50';
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
      }, 1000);
    }
  }
}

function getJoinLink(gameId: string, token: string, slot: number): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/game/${gameId}?token=${token}&slot=${slot}`;
}

// Автоматическое подключение через URL обрабатывается в Game.vue
</script>

<style scoped>
.create-game {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.container {
  background: white;
  border-radius: 16px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 32px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #333;
}

.input {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.input:focus {
  border-color: #667eea;
}

.form-group small {
  color: #666;
  font-size: 0.875rem;
}

.btn {
  padding: 14px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.error {
  padding: 12px;
  background: #fee;
  color: #c33;
  border-radius: 8px;
  text-align: center;
}

.game-created {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 2px solid #e0e0e0;
}

.game-created h2 {
  margin-bottom: 16px;
  color: #333;
}

.game-created p {
  margin-bottom: 8px;
  color: #666;
}

.player-selection {
  margin-top: 24px;
}

.player-selection p {
  margin-bottom: 16px;
  font-weight: 600;
}

.buttons {
  display: flex;
  gap: 12px;
}

.buttons .btn {
  flex: 1;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e0e0e0;
}

.tab {
  flex: 1;
  padding: 12px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 16px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  color: #333;
}

.tab.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.tab-content {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.game-id {
  text-align: center;
  margin-bottom: 24px;
  padding: 12px;
  background: #f0f0f0;
  border-radius: 8px;
}

.links-section {
  margin-top: 24px;
}

.links-section h3 {
  margin-bottom: 16px;
  color: #333;
  font-size: 1.125rem;
}

.link-item {
  margin-bottom: 20px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
}

.link-item label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
  font-size: 0.95rem;
}

.link-display {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.link-input {
  flex: 1;
  padding: 10px 12px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: #333;
  cursor: text;
  word-break: break-all;
}

.link-input:focus {
  border-color: #667eea;
  outline: none;
}

.btn-copy {
  padding: 10px 14px;
  background: #667eea;
  color: white;
  border-radius: 6px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-copy:hover {
  background: #5568d3;
  transform: scale(1.05);
}

.join-link {
  display: inline-block;
  padding: 10px 20px;
  background: #4caf50;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: background 0.2s;
  font-size: 0.9rem;
}

.join-link:hover {
  background: #45a049;
}

.info-box {
  margin-top: 24px;
  padding: 16px;
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  border-radius: 6px;
}

.info-box p {
  margin-bottom: 8px;
  color: #1976d2;
}

.info-box ol {
  margin-left: 20px;
  color: #555;
  line-height: 1.6;
}

.info-box li {
  margin-bottom: 4px;
}
</style>
