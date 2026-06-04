<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Question } from '@/types/question'
import { useCategoryStore } from '@/stores/categoryStore'
import * as db from '@/db'

const categoryStore = useCategoryStore()

const history = ref<Question[]>([])
const selectedCategory = ref<string>('all')
const isLoading = ref(false)

const filteredHistory = computed(() => {
  if (selectedCategory.value === 'all') {
    return history.value
  }
  return history.value.filter((q: Question) => q.category === selectedCategory.value)
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

async function handleToggleFavorite(id: string) {
  await db.toggleFavorite(id)
  await loadHistory()
}

async function handleDeleteQuestion(id: string) {
  await db.deleteQuestion(id)
  await loadHistory()
}

async function handleClearHistory() {
  if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
    await db.clearAllHistory()
    await loadHistory()
  }
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

function handleFilterByCategory(categoryId: string) {
  selectedCategory.value = categoryId
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 今天内
  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  
  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.getDate() === yesterday.getDate() && 
      date.getMonth() === yesterday.getMonth() && 
      date.getFullYear() === yesterday.getFullYear()) {
    return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  
  // 更早
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="history-page">
    <!-- 页面标题 -->
    <header class="page-header">
      <h1 class="page-title">历史记录</h1>
      <p class="page-subtitle">查看已出现过的问题</p>
    </header>
    
    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="category-filter">
        <button
          class="filter-button"
          :class="{ active: selectedCategory === 'all' }"
          @click="handleFilterByCategory('all')"
        >
          全部
        </button>
        <button
          v-for="category in categoryStore.sortedCategories"
          :key="category.id"
          class="filter-button"
          :class="{ active: selectedCategory === category.id }"
          @click="handleFilterByCategory(category.id)"
        >
          {{ category.icon }}
        </button>
      </div>
      
      <button
        v-if="history.length > 0"
        class="clear-button"
        @click="handleClearHistory"
      >
        清空
      </button>
    </div>
    
    <!-- 历史列表 -->
    <div class="history-list">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p class="loading-text">加载中...</p>
      </div>
      
      <!-- 空状态 -->
      <div v-else-if="filteredHistory.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p class="empty-text">还没有抽过卡</p>
        <p class="empty-hint">先去首页抽一张吧</p>
      </div>
      
      <!-- 历史卡片列表 -->
      <div v-else class="history-grid">
        <div
          v-for="question in filteredHistory"
          :key="question.id"
          class="history-card"
        >
          <div class="card-header">
            <span class="category-tag">
              {{ categoryStore.getCategoryName(question.category) }}
            </span>
            <span class="time-tag">
              {{ formatDate(question.createdAt) }}
            </span>
          </div>
          
          <p class="question-text">{{ question.text }}</p>
          
          <div class="card-footer">
            <button
              class="action-btn"
              :class="{ active: question.favorite }"
              @click="handleToggleFavorite(question.id)"
            >
              {{ question.favorite ? '❤️' : '🤍' }}
            </button>
            <button
              class="action-btn"
              @click="handleCopy(question.text)"
            >
              📋
            </button>
            <button
              class="action-btn delete-btn"
              @click="handleDeleteQuestion(question.id)"
            >
              🗑️
            </button>
          </div>
          
          <!-- 来源标签 -->
          <div class="source-tag">
            {{ question.source === 'llm' ? 'AI' : '离线' }}
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

.category-tag {
  font-size: var(--font-size-sm);
  color: var(--color-accent-primary);
  background-color: rgba(232, 160, 191, 0.1);
  padding: 4px 12px;
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

.delete-btn:hover {
  opacity: 1;
}

.source-tag {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  background-color: var(--color-border-light);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}
</style>
