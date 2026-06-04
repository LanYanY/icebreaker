<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const navItems = [
  { path: '/', icon: '🎴', label: '首页' },
  { path: '/categories', icon: '📂', label: '分类' },
  { path: '/favorites', icon: '❤️', label: '收藏' },
  { path: '/history', icon: '📝', label: '历史' },
  { path: '/settings', icon: '⚙️', label: '设置' }
]

function isActive(path: string): boolean {
  return route.path === path
}

function navigateTo(path: string) {
  router.push(path)
}
</script>

<template>
  <nav class="bottom-nav">
    <button
      v-for="item in navItems"
      :key="item.path"
      class="nav-item"
      :class="{ active: isActive(item.path) }"
      @click="navigateTo(item.path)"
    >
      <span class="nav-icon">{{ item.icon }}</span>
      <span class="nav-label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  height: 76px;
  background-color: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 16px;
  z-index: 100;
  /* 适配全面屏安全区域 */
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  transition: all var(--duration-fast) ease;
  min-width: 60px;
}

.nav-item:active {
  transform: scale(0.95);
}

.nav-item.active {
  background-color: rgba(232, 160, 191, 0.1);
}

.nav-icon {
  font-size: 24px;
  line-height: 1;
}

.nav-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  line-height: 1;
}

.nav-item.active .nav-label {
  color: var(--color-accent-primary);
  font-weight: 500;
}
</style>
