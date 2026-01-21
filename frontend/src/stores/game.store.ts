import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  GameState,
  GameOver,
  WsError,
  CreateGameResponse,
} from '@/types/game.types';
import { GameStatus } from '@/types/game.types';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export const useGameStore = defineStore('game', () => {
  // State
  const gameId = ref<string | null>(null);
  const playerToken = ref<string | null>(null);
  const playerSlot = ref<number | null>(null);
  const gameState = ref<GameState | null>(null);
  const socket = ref<Socket | null>(null);
  const error = ref<string | null>(null);
  const isLoading = ref(false);

  // Computed
  const isMyTurn = computed(() => {
    if (!gameState.value || !playerSlot.value) return false;
    return gameState.value.turn === playerSlot.value;
  });

  const isConnected = computed(() => {
    return socket.value?.connected || false;
  });

  const board = computed(() => {
    return gameState.value?.board || [];
  });

  const scores = computed(() => {
    return gameState.value?.scores || { p1: 0, p2: 0 };
  });

  const currentTurn = computed(() => {
    return gameState.value?.turn || null;
  });

  const foundDiamonds = computed(() => {
    return gameState.value?.found || 0;
  });

  const totalDiamonds = computed(() => {
    return gameState.value?.diamondsCount || 0;
  });

  const gameStatus = computed(() => {
    return gameState.value?.status || null;
  });

  // Actions
  async function createGame(fieldSize: number, diamondsCount: number): Promise<CreateGameResponse> {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await axios.post<CreateGameResponse>(`${API_URL}/games`, {
        fieldSize: fieldSize,
        diamondsCount: diamondsCount,
      });
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка при создании игры';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function setPlayerInfo(
    gameIdValue: string,
    token: string,
    slot: number,
  ) {
    gameId.value = gameIdValue;
    playerToken.value = token;
    playerSlot.value = slot;
  }

  function connectWebSocket() {
    if (!gameId.value || !playerToken.value) {
      throw new Error('Game ID and token are required');
    }

    if (socket.value?.connected) {
      socket.value.disconnect();
    }

    socket.value = io(`${WS_URL}/ws`, {
      transports: ['websocket'],
    });

    socket.value.on('connect', () => {
      joinGame();
    });

    // Если уже подключен (синхронное подключение)
    if (socket.value.connected) {
      joinGame();
    }

    socket.value.on('state', (state: GameState) => {
      gameState.value = state;
      error.value = null;
      // Обновляем playerSlot из ответа сервера, если он был неизвестен
      if (state.youAre && !playerSlot.value) {
        playerSlot.value = state.youAre;
      }
    });

    socket.value.on('move_result', () => {
      // State will be updated via 'state' event
    });

      socket.value.on('game_over', (result: GameOver) => {
        if (gameState.value) {
          gameState.value.status = GameStatus.FINISHED;
          gameState.value.scores = result.scores;
        }
      });

    socket.value.on('error', (err: WsError) => {
      error.value = err.message;
    });
  }

  function joinGame() {
    if (!socket.value?.connected || !gameId.value || !playerToken.value) {
      return;
    }

    socket.value.emit('join', {
      gameId: gameId.value,
      token: playerToken.value,
    });
  }

  function openCell(x: number, y: number) {
    if (!socket.value?.connected || !gameId.value || !playerToken.value) {
      throw new Error('Not connected to game');
    }

    if (!isMyTurn.value) {
      throw new Error('Not your turn');
    }

    socket.value.emit('open_cell', {
      gameId: gameId.value,
      token: playerToken.value,
      x,
      y,
    });
  }

  function disconnect() {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
    }
    gameId.value = null;
    playerToken.value = null;
    playerSlot.value = null;
    gameState.value = null;
    error.value = null;
  }

  return {
    // State
    gameId,
    playerToken,
    playerSlot,
    gameState,
    socket,
    error,
    isLoading,
    // Computed
    isMyTurn,
    isConnected,
    board,
    scores,
    currentTurn,
    foundDiamonds,
    totalDiamonds,
    gameStatus,
    // Actions
    createGame,
    setPlayerInfo,
    connectWebSocket,
    joinGame,
    openCell,
    disconnect,
  };
});
