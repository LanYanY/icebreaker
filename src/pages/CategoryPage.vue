<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Question } from '@/types/question'
import { getQuestionText, hasChineseText } from '@/types/question'
import { getQuestionMode } from '@/types/mode'
import { useCategoryStore } from '@/stores/categoryStore'
import * as db from '@/db'

const categoryStore = useCategoryStore()

const questions = ref<Question[]>([])
const selectedCategory = ref<string>('all')
const isLoading = ref(false)
const displayLangMap = ref<Record<string, 'en' | 'zh'>>({})
const showDeleteConfirm = ref(false)
const questionToDelete = ref<Question | null>(null)

// 按当前模式过滤，再按分类过滤
const filteredQuestions = computed(() => {
  const mode = categoryStore.currentMode
  const modeQuestions = questions.value.filter((q: Question) => getQuestionMode(q) === mode)
  if (selectedCategory.value === 'all') {
    return modeQuestions
  }
  return modeQuestions.filter((q: Question) => q.category === selectedCategory.value)
})

// 各分类的题目数量（当前模式下）
const categoryCounts = computed(() => {
  const mode = categoryStore.currentMode
  const modeQuestions = questions.value.filter((q: Question) => getQuestionMode(q) === mode)
  const counts: Record<string, number> = { all: modeQuestions.length }
  for (const q of modeQuestions) {
    counts[q.category] = (counts[q.category] || 0) + 1
  }
  return counts
})

onMounted(async () => {
  await loadQuestions()
})

async function loadQuestions() {
  isLoading.value = true
  try {
    questions.value = await db.getAllQuestions()
  } catch (err) {
    console.error('加载题库失败:', err)
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
  await loadQuestions()
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
      await navigator.share({ title: '开场白', text })
    } catch {
      // 用户取消
    }
  }
}

function confirmDelete(question: Question) {
  questionToDelete.value = question
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (questionToDelete.value) {
    await db.deleteQuestion(questionToDelete.value.id)
    await loadQuestions()
  }
  showDeleteConfirm.value = false
  questionToDelete.value = null
}

function cancelDelete() {
  showDeleteConfirm.value = false
  questionToDelete.value = null
}

function handleFilterByCategory(categoryId: string) {
  selectedCategory.value = categoryId
}
</script>

<template>
  <div class="bank-page">
    <header class="page-header">
      <h1 class="page-title">题库</h1>
      <p class="page-subtitle">
        <template v-if="!isLoading">
          {{ filteredQuestions.length }} 个问题
        </template>
        <template v-else>加载中...</template>
      </p>
    </header>

    <!-- 分类过滤 -->
    <div class="category-filter">
      <button
        class="filter-pill"
        :class="{ active: selectedCategory === 'all' }"
        @click="handleFilterByCategory('all')"
      >
        全部 <span class="pill-count">{{ categoryCounts.all || 0 }}</span>
      </button>
      <button
        v-for="category in categoryStore.sortedCategories"
        :key="category.id"
        class="filter-pill"
        :class="{ active: selectedCategory === category.id }"
        @click="handleFilterByCategory(category.id)"
      >
        {{ category.icon }} {{ category.name }}
        <span class="pill-count">{{ categoryCounts[category.id] || 0 }}</span>
      </button>
    </div>

    <!-- 问题列表 -->
    <div class="question-list">
      <!-- 加载 -->
      <div v-if="isLoading" class="state-box">
        <div class="loading-spinner"></div>
        <p class="state-text">加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="filteredQuestions.length === 0" class="state-box">
        <div class="empty-icon">📚</div>
        <p class="state-title">暂无问题</p>
        <p class="state-hint">抽卡后的问题会自动出现在这里</p>
      </div>

      <!-- 问题卡片 -->
      <div v-else class="question-grid">
        <div
          v-for="question in filteredQuestions"
          :key="question.id"
          class="question-card"
        >
          <!-- 头部：分类 + 来源 -->
          <div class="card-header">
            <span class="category-tag">{{ categoryStore.getCategoryName(question.category) }}</span>
            <div class="header-right">
              <span class="source-tag ai">AI</span>
            </div>
          </div>

          <!-- 问题文本 -->
          <p class="question-text">{{ getText(question) }}</p>

          <!-- 底部：翻译 + 操作 -->
          <div class="card-footer">
            <button
              v-if="canTranslate(question)"
              class="translate-btn"
              :class="{ active: getLang(question.id) === 'zh' }"
              @click="toggleLang(question.id)"
            >
              {{ getLang(question.id) === 'en' ? '译' : 'EN' }}
            </button>
            <div v-else></div>

            <div class="action-buttons">
              <button
                class="action-btn"
                :class="{ favorited: question.favorite }"
                @click="handleToggleFavorite(question.id)"
              >
                {{ question.favorite ? '❤️' : '🤍' }}
              </button>
              <button class="action-btn" @click="handleCopy(getText(question))">
                📋
              </button>
              <button class="action-btn" @click="handleShare(getText(question))">
                📤
              </button>
              <button class="action-btn delete-btn" @click="confirmDelete(question)">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <Teleport to="body">
      <transition name="modal">
        <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="cancelDelete">
          <div class="modal-content">
            <h3 class="modal-title">确认删除</h3>
            <p class="modal-text">确定要删除这个问题吗？此操作无法撤销。</p>
            <div class="modal-actions">
              <button class="modal-button cancel" @click="cancelDelete">取消</button>
              <button class="modal-button confirm" @click="handleDelete">删除</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
.bank-page {
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

/* 分类过滤 */
.category-filter {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-light);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.category-filter::-webkit-scrollbar {
  display: none;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
  transition: all var(--duration-fast) ease;
}

.filter-pill:active {
  transform: scale(0.95);
}

.filter-pill.active {
  background-color: var(--color-accent-primary);
  border-color: var(--color-accent-primary);
  color: white;
}

.pill-count {
  font-size: 11px;
  opacity: 0.7;
}

/* 问题列表 */
.question-list {
  min-height: 300px;
}

.state-box {
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

.state-text {
  font-size: var(--font-size-base);
  color: var(--color-text-tertiary);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: var(--spacing-md);
}

.state-title {
  font-size: var(--font-size-lg);
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.state-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.question-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.question-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
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
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.source-tag.ai {
  color: var(--color-accent-primary);
  background-color: rgba(232, 160, 191, 0.1);
}

.source-tag.offline {
  color: var(--color-accent-secondary);
  background-color: rgba(169, 199, 232, 0.1);
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

.action-btn.favorited {
  color: var(--color-accent-primary);
}

.delete-btn {
  opacity: 0.6;
}

.delete-btn:active {
  opacity: 1;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-lg);
}

.modal-content {
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  max-width: 320px;
  width: 100%;
  box-shadow: var(--shadow-xl);
}

.modal-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.modal-text {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
}

.modal-button {
  flex: 1;
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: 500;
  transition: all var(--duration-fast) ease;
}

.modal-button.cancel {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

.modal-button.confirm {
  background-color: var(--color-error);
  border: 1px solid var(--color-error);
  color: white;
}

.modal-button:active {
  transform: scale(0.98);
}

.modal-enter-active,
.modal-leave-active {
  transition: all var(--duration-normal) ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
