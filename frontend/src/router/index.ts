import { createRouter, createWebHistory } from 'vue-router';
import CreateGame from '@/views/CreateGame.vue';
import Game from '@/views/Game.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'create',
      component: CreateGame,
    },
    {
      path: '/game/:id',
      name: 'game',
      component: Game,
    },
  ],
});

export default router;
