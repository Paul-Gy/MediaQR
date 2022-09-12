import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MissingView from '../views/MissingView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/errors/ghost',
      name: 'ghost',
      component: () => import('../views/GhostError.vue'),
    },
    {
      path: '/:id/pdf',
      name: 'pdf',
      component: () => import('../views/AutoPDF.vue'),
    },
    {
      path: '/:id/editor',
      name: 'editor',
      component: () => import('../views/EditorView.vue'),
    },
    {
      path: '/:id/stats',
      name: 'stats',
      component: () => import('../views/StatsView.vue'),
    },
    {
      path: '/:path(.*)',
      name: '404',
      component: MissingView,
    },
  ],
})

export default router
