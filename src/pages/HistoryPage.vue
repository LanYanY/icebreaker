<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Question } from '@/types/question'
import { getQuestionText, hasChineseText } from '@/types/question'
import { getQuestionMode } from '@/types/mode'
import { useCategoryStore } from '@/stores/categoryStore'
import * as db from '@/db'

const categoryStore = useCategoryStore()

const history = ref<Question[]>([])
const selectedCategory = ref<string>('all')
const isLoading = ref(false)
const displayLangMap = ref<Record<string, 'en' | 'zh'>>({})

// 按当前模式过滤
const filteredHistory = computed(() => {
  const mode = categoryStore.currentMode
  const modeHistory = history.value.filter((q: Question) => getQuestionMode(q) === mode)
  if (selectedCategory.value === 'all') {
    return modeHistory
  }
  return modeHistory.filter((q: Question) => q.category === selectedCategory.value)
})

onMounted(async () => {
  await loadHistory()
})

async function loadHistory() {
  isLoading.value = true
  try {
    history.value = await db.getAllQuestions()
  } catch (err) {
    console.error('加载历史失败:', err)
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
  await loadHistory()
}

async function handleDeleteQuestion(id: string) {
  await db.deleteQuestion(id)
  await loadHistory()
}

async function handleClearHistory() {
  if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
    await db.clearAllHistory()
    await loadHistory()
  }
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

function handleFilterByCategory(categoryId: string) {
  selectedCategory.value = categoryId
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return `Today ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.getDate() === yesterday.getDate() && 
      date.getMonth() === yesterday.getMonth() && 
      date.getFullYear() === yesterday.getFullYear()) {
    return `Yesterday ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="history-page">
    <header class="page-header">
      <h1 class="page-title">History</h1>
      <p class="page-subtitle">All your drawn questions</p>
    </header>
    
    <!-- 操作栏 -->
    <div class="action-bar">
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
      
      <button 
        v-if="history.length > 0"
        class="clear-button"
        @click="handleClearHistory"
      >
        Clear All
      </button>
    </div>
    
    <!-- 历史列表 -->
    <div class="history-list">
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading...</p>
      </div>
      
      <div v-else-if="filteredHistory.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p class="empty-text">No history yet</p>
        <p class="empty-hint">Draw some question cards to see them here</p>
      </div>
      
      <div v-else class="history-grid">
        <div 
          v-for="question in filteredHistory"
          :key="question.id"
          class="history-card"
        >
          <div class="card-header">
            <span class="category-tag">{{ categoryStore.getCategoryName(question.category) }}</span>
            <div class="header-right">
              <span class="source-tag" v-if="question.source === 'llm'">AI</span>
              <span class="time-tag">{{ formatDate(question.createdAt) }}</span>
            </div>
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
              <button 
                class="action-btn"
                :class="{ active: question.favorite }"
                @click="handleToggleFavorite(question.id)"
              >
                {{ question.favorite ? '❤️' : '🤍' }}
              </button>
              <button class="action-btn" @click="handleCopy(getText(question))">
                📋
              </button>
              <button class="action-btn delete-btn" @click="handleDeleteQuestion(question.id)">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-page {
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

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-light);
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.category-filter {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
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

.clear-button {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: transparent;
  border: 1px solid var(--color-error);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: var(--color-error);
  transition: all var(--duration-fast) ease;
}

.clear-button:active {
  transform: scale(0.95);
  background-color: rgba(244, 67, 54, 0.1);
}

.history-list {
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

.history-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.history-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  position: relative;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
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

.time-tag {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.question-text {
  font-size: var(--font-size-base);
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
  padding: var(--spacing-sm);
  background-color: var(--color-border-light);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  transition: all var(--duration-fast) ease;
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:active {
  transform: scale(0.95);
  background-color: var(--color-border);
}

.action-btn.active {
  color: var(--color-accent-primary);
}

.delete-btn {
  opacity: 0.6;
}

.delete-btn:active {
  opacity: 1;
}
</style>
