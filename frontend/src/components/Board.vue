<template>
  <div class="board-container">
    <div
      class="board"
      :style="{
        gridTemplateColumns: `repeat(${board.length}, 1fr)`,
      }"
    >
      <template v-for="(row, y) in board" :key="y">
        <div
          v-for="(cell, x) in row"
          :key="`${x}-${y}`"
          class="cell"
        :class="{
          closed: cell.s === CellState.CLOSED,
          opened: cell.s === CellState.OPENED,
          clickable: cell.s === CellState.CLOSED && isMyTurn && gameStatus === GameStatus.ACTIVE,
          'not-my-turn': cell.s === CellState.CLOSED && !isMyTurn,
        }"
        @click="handleCellClick(x, y)"
      >
        <div v-if="cell.s === CellState.CLOSED" class="cell-closed">
          <span class="cell-icon">?</span>
        </div>
        <div v-else-if="cell.s === CellState.OPENED && cell.t === CellType.NUMBER" class="cell-number">
          {{ cell.v === 0 ? '' : cell.v }}
        </div>
        <div v-else-if="cell.s === CellState.OPENED && cell.t === CellType.DIAMOND" class="cell-diamond">
          💎
        </div>
      </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Board } from '@/types/game.types';
import { GameStatus, CellState, CellType } from '@/types/game.types';

interface Props {
  board: Board;
  isMyTurn: boolean;
  gameStatus: GameStatus | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  cellClick: [x: number, y: number];
}>();

function handleCellClick(x: number, y: number) {
  if (
    props.board[y]?.[x]?.s === CellState.CLOSED &&
    props.isMyTurn &&
    props.gameStatus === GameStatus.ACTIVE
  ) {
    emit('cellClick', x, y);
  }
}
</script>

<style scoped>
.board-container {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.board {
  display: grid;
  gap: 4px;
  background: #333;
  padding: 4px;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.cell {
  aspect-ratio: 1;
  min-width: 50px;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-weight: bold;
  font-size: 1.25rem;
  transition: all 0.2s;
  user-select: none;
}

.cell-closed {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  cursor: pointer;
}

.cell-closed:hover {
  transform: scale(0.95);
  opacity: 0.9;
}

.cell.clickable .cell-closed {
  cursor: pointer;
}

.cell.not-my-turn .cell-closed {
  cursor: not-allowed;
  opacity: 0.6;
}

.cell-icon {
  color: white;
  font-size: 1.5rem;
}

.cell-number {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #333;
  border-radius: 4px;
}

.cell-diamond {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff9c4;
  border-radius: 4px;
  font-size: 2rem;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.cell.opened {
  cursor: default;
}

/* Адаптивность */
@media (max-width: 600px) {
  .cell {
    min-width: 40px;
    min-height: 40px;
    font-size: 1rem;
  }

  .cell-icon {
    font-size: 1.2rem;
  }

  .cell-diamond {
    font-size: 1.5rem;
  }
}
</style>
