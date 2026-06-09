<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Question } from '@/types/question'
import { getQuestionText, hasChineseText } from '@/types/question'
import { getQuestionMode } from '@/types/mode'
import { useCategoryStore } from '@/stores/categoryStore'
import * as db from '@/db'

const categoryStore = useCategoryStore()

const favorites = ref<Question[]>([])
const selectedCategory = ref<string>('all')
const isLoading = ref(false)
const displayLangMap = ref<Record<string, 'en' | 'zh'>>({})

// 按当前模式过滤
const filteredFavorites = computed(() => {
  const mode = categoryStore.currentMode
  const modeFavorites = favorites.value.filter((q: Question) => getQuestionMode(q) === mode)
  if (selectedCategory.value === 'all') {
    return modeFavorites
  }
  return modeFavorites.filter((q: Question) => q.category === selectedCategory.value)
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

function getText(question: Question): string {
  const lang = displayLangMap.value[question.id] || 'en'
  return getQuestionText(question, lang)
}

function toggleLang(id: string) {
  const current = displayLangMap.value[id] || 'en'
  displayLangMap.value[id] = current === 'en' ? 'zh' : 'en'
}

function getLang(id: string): 'en' | 'zh' {
  return displayLangMap.value[id] || 'en'
}

function canTranslate(question: Question): boolean {
  return hasChineseText(question)
}

async function handleToggleFavorite(id: string) {
  await db.toggleFavorite(id)
  await loadFavorites()
}

async function handleCopy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
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
  <div class="favorites-page">
    <header class="page-header">
      <h1 class="page-title">Favorites</h1>
      <p class="page-subtitle">Your saved icebreaker questions</p>
    </header>
    
    <!-- 分类过滤 -->
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
        <p class="loading-text">Loading...</p>
      </div>
      
      <!-- 空状态 -->
      <div v-else-if="filteredFavorites.length === 0" class="empty-state">
        <div class="empty-icon">💝</div>
        <p class="empty-text">No favorites yet</p>
        <p class="empty-hint">Tap the heart icon on a question card to save it here</p>
      </div>
      
      <!-- 收藏卡片列表 -->
      <div v-else class="favorites-grid">
        <div 
          v-for="question in filteredFavorites"
          :key="question.id"
          class="favorite-card"
        >
          <div class="card-header">
            <span class="category-tag">{{ categoryStore.getCategoryName(question.category) }}</span>
            <span class="source-tag" v-if="question.source === 'llm'">AI</span>
          </div>
          
          <p class="question-text">{{ getText(question) }}</p>
          
          <div class="card-footer">
            <button
              v-if="canTranslate(question)"
              class="translate-btn"
              :class="{ active: getLang(question.id) === 'zh' }"
              @click="toggleLang(question.id)"
            >
              {{ getLang(question.id) === 'en' ? '译' : 'EN' }}
            </button>
            <div class="action-buttons">
              <button class="action-btn" @click="handleToggleFavorite(question.id)">
                ❤️
              </button>
              <button class="action-btn" @click="handleCopy(getText(question))">
                📋
              </button>
              <button class="action-btn" @click="handleShare(getText(question))">
                📤
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.favorites-page {
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
  animation: spin 0.8s linear infinite;
  margin-bottom: var(--spacing-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.category-tag {
  font-size: var(--font-size-sm);
  color: var(--color-accent-primary);
  background-color: rgba(232, 160, 191, 0.1);
  padding: 4px 12px;
  border-radius: var(--radius-full);
}

.source-tag {
  font-size: var(--font-size-xs);
  color: var(--color-accent-primary);
  background-color: rgba(232, 160, 191, 0.1);
  padding: 2px 8px;
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
  align-items: center;
  justify-content: space-between;
}

.translate-btn {
  padding: 6px 14px;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: 500;
  transition: all var(--duration-fast) ease;
}

.translate-btn:active {
  transform: scale(0.95);
}

.translate-btn.active {
  background-color: rgba(169, 199, 232, 0.15);
  border-color: var(--color-accent-secondary);
  color: var(--color-accent-secondary);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-sm);
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
