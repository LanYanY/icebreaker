import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('@/pages/CategoryPage.vue')
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('@/pages/FavoritePage.vue')
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/pages/HistoryPage.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/pages/SettingsPage.vue')
    }
  ]
})

export default router
