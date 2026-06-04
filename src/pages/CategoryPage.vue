<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCategoryStore } from '@/stores/categoryStore'

const router = useRouter()
const categoryStore = useCategoryStore()

function handleSelectCategory(categoryId: string) {
  categoryStore.setCurrentCategory(categoryId)
  router.push('/')
}
</script>

<template>
  <div class="category-page">
    <!-- 页面标题 -->
    <header class="page-header">
      <h1 class="page-title">话题分类</h1>
      <p class="page-subtitle">选择适合当前场景的话题</p>
    </header>
    
    <!-- 分类列表 -->
    <div class="category-grid">
      <button
        v-for="category in categoryStore.sortedCategories"
        :key="category.id"
        class="category-card"
        @click="handleSelectCategory(category.id)"
      >
        <div class="card-icon">{{ category.icon }}</div>
        <div class="card-content">
          <h3 class="card-title">{{ category.name }}</h3>
          <p class="card-desc">{{ category.description }}</p>
        </div>
        <div class="card-arrow">→</div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.category-page {
  padding: var(--spacing-lg);
  min-height: 100%;
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.category-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.category-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  text-align: left;
  transition: all var(--duration-fast) ease;
}

.category-card:active {
  transform: scale(0.98);
  background-color: var(--color-border-light);
}

.card-icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-border-light);
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.card-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-arrow {
  font-size: var(--font-size-lg);
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}
</style>
