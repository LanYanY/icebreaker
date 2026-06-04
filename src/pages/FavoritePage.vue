<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Question } from '@/types/question'
import { useCategoryStore } from '@/stores/categoryStore'
import * as db from '@/db'

const categoryStore = useCategoryStore()

const favorites = ref<Question[]>([])
const selectedCategory = ref<string>('all')
const isLoading = ref(false)

const filteredFavorites = computed(() => {
  if (selectedCategory.value === 'all') {
    return favorites.value
  }
  return favorites.value.filter((q: Question) => q.category === selectedCategory.value)
})

onMounted(async () => {
  await loadFavorites()
})

async function loadFavorites() {
  isLoading.value = true
  try {
    favorites.value = await db.getFavoriteQuestions()
  } catch (err) {
    console.error('加载收藏失败:', err)
  } finally {
    isLoading.value = false
  }
}

async function handleToggleFavorite(id: string) {
  await db.toggleFavorite(id)
  await loadFavorites()
}

async function handleCopy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    // TODO: 显示Toast提示
  } catch {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}

async function handleShare(text: string) {
  if (navigator.share) {
    try {
      await navigator.share({
        title: '开场白',
        text: text
      })
    } catch {
      // 用户取消分享
    }
  }
}

function handleFilterByCategory(categoryId: string) {
  selectedCategory.value = categoryId
}
</script>

<template>
  <div class="favorite-page">
    <!-- 页面标题 -->
    <header class="page-header">
      <h1 class="page-title">Favorites</h1>
      <p class="page-subtitle">Questions you have saved</p>
    </header>
    
    <!-- 分类筛选 -->
    <div class="category-filter">
      <button
        class="filter-button"
        :class="{ active: selectedCategory === 'all' }"
        @click="handleFilterByCategory('all')"
      >
        All
      </button>
      <button
        v-for="category in categoryStore.sortedCategories"
        :key="category.id"
        class="filter-button"
        :class="{ active: selectedCategory === category.id }"
        @click="handleFilterByCategory(category.id)"
      >
        {{ category.icon }} {{ category.name }}
      </button>
    </div>
    
    <!-- 收藏列表 -->
    <div class="favorites-list">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p class="loading-text">加载中...</p>
      </div>
      
      <!-- 空状态 -->
      <div v-else-if="filteredFavorites.length === 0" class="empty-state">
        <div class="empty-icon">❤️</div>
        <p class="empty-text">No favorites yet</p>
        <p class="empty-hint">Tap the heart icon to save questions you like</p>
      </div>
      
      <!-- 收藏卡片列表 -->
      <div v-else class="favorites-grid">
        <div
          v-for="question in filteredFavorites"
          :key="question.id"
          class="favorite-card"
        >
          <div class="card-header">
            <span class="category-tag">
              {{ categoryStore.getCategoryName(question.category) }}
            </span>
          </div>
          
          <p class="question-text">{{ question.text }}</p>
          
          <div class="card-footer">
            <button
              class="action-btn"
              @click="handleToggleFavorite(question.id)"
            >
              ❤️ Unfavorite
            </button>
            <button
              class="action-btn"
              @click="handleCopy(question.text)"
            >
              📋 Copy
            </button>
            <button
              class="action-btn"
              @click="handleShare(question.text)"
            >
              📤 Share
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.favorite-page {
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

.category-filter {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-light);
}

.filter-button {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  transition: all var(--duration-fast) ease;
  white-space: nowrap;
}

.filter-button:active {
  transform: scale(0.95);
}

.filter-button.active {
  background-color: var(--color-accent-primary);
  border-color: var(--color-accent-primary);
  color: white;
}

.favorites-list {
  min-height: 300px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-md);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: var(--font-size-base);
  color: var(--color-text-tertiary);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: var(--spacing-md);
}

.empty-text {
  font-size: var(--font-size-lg);
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.empty-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.favorites-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.favorite-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
}

.card-header {
  margin-bottom: var(--spacing-md);
}

.category-tag {
  font-size: var(--font-size-sm);
  color: var(--color-accent-primary);
  background-color: rgba(232, 160, 191, 0.1);
  padding: 4px 12px;
  border-radius: var(--radius-full);
}

.question-text {
  font-size: var(--font-size-lg);
  line-height: 1.6;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
}

.card-footer {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.action-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-border-light);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  transition: all var(--duration-fast) ease;
}

.action-btn:active {
  transform: scale(0.95);
  background-color: var(--color-border);
}
</style>
