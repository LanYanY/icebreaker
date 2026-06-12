<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCategoryStore } from '@/stores/categoryStore'
import { useQuestionStore } from '@/stores/questionStore'
import { useSettingStore } from '@/stores/settingStore'
import QuestionCard from '@/components/QuestionCard.vue'
import type { Question } from '@/types/question'

const categoryStore = useCategoryStore()
const questionStore = useQuestionStore()
const settingStore = useSettingStore()

// 离线题库计数
const offlineCounts = ref<Record<string, number>>({})

// 当前抽到的问题
const drawnQuestion = ref<Question | null>(null)
const isDrawing = ref(false)

onMounted(async () => {
  await loadOfflineCounts()
})

/** 加载离线题库统计 */
async function loadOfflineCounts() {
  try {
    const counts: Record<string, number> = {}

    // 加载 icebreaker 题库
    const ibRes = await fetch('/offline_questions.json')
    const ibQuestions = await ibRes.json()
    ibQuestions.forEach((q: any) => {
      const cat = q.category || 'random'
      counts[cat] = (counts[cat] || 0) + 1
    })

    // 加载 intimacy 题库
    try {
      const intRes = await fetch('/offline_questions_intimacy.json')
      const intQuestions = await intRes.json()
      intQuestions.forEach((q: any) => {
        const cat = q.category || 'intimacy_random'
        counts[cat] = (counts[cat] || 0) + 1
      })
    } catch {
      // intimacy 题库不存在
    }

    offlineCounts.value = counts
  } catch {
    // 静默失败
  }
}

/** 获取分类的离线题数 */
function getOfflineCount(categoryId: string): number {
  return offlineCounts.value[categoryId] || 0
}

/** 直接从分类抽卡 */
async function handleDrawFromCategory(categoryId: string) {
  if (isDrawing.value) return

  isDrawing.value = true
  drawnQuestion.value = null

  try {
    // 设置当前分类
    categoryStore.setCurrentCategory(categoryId)

    const useOffline = settingStore.userSetting.useOfflineFirst || !settingStore.hasApiKey()
    const question = await questionStore.drawQuestion(
      categoryId,
      useOffline,
      settingStore.userSetting.defaultDepth,
      settingStore.userSetting.defaultTone
    )

    if (question) {
      drawnQuestion.value = question
    }
  } finally {
    isDrawing.value = false
  }
}

/** 关闭问题卡片 */
function handleCloseCard() {
  drawnQuestion.value = null
}
</script>

<template>
  <div class="category-page">
    <!-- 页面标题 -->
    <header class="page-header">
      <h1 class="page-title">Categories</h1>
      <p class="page-subtitle">Choose a category and draw a question</p>
    </header>

    <!-- 分类列表 -->
    <div class="category-grid">
      <div
        v-for="category in categoryStore.sortedCategories"
        :key="category.id"
        class="category-card"
        :class="{ active: categoryStore.currentCategoryId === category.id }"
      >
        <!-- 左侧：图标 + 信息 -->
        <div class="card-main">
          <div class="card-icon" :style="{ backgroundColor: category.color + '20' }">
            {{ category.icon }}
          </div>
          <div class="card-content">
            <div class="card-title-row">
              <h3 class="card-title">{{ category.name }}</h3>
              <span v-if="categoryStore.currentCategoryId === category.id" class="current-badge">当前</span>
            </div>
            <p class="card-desc">{{ category.description }}</p>
            <span class="card-count">{{ getOfflineCount(category.id) }} 题可用</span>
          </div>
        </div>

        <!-- 右侧：抽卡按钮 -->
        <button
          class="draw-btn"
          :disabled="isDrawing"
          @click="handleDrawFromCategory(category.id)"
        >
          <span v-if="isDrawing && categoryStore.currentCategoryId === category.id" class="draw-spinner"></span>
          <span v-else>🎲</span>
        </button>
      </div>
    </div>

    <!-- 问题卡片浮层 -->
    <Teleport to="body">
      <transition name="modal">
        <div v-if="drawnQuestion" class="question-overlay" @click.self="handleCloseCard">
          <div class="question-modal">
            <QuestionCard
              :question="drawnQuestion"
              @close="handleCloseCard"
            />
          </div>
        </div>
      </transition>
    </Teleport>
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
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-xl);
  transition: all var(--duration-fast) ease;
}

.category-card.active {
  border-color: var(--color-accent-primary);
  background-color: rgba(232, 160, 191, 0.05);
}

.card-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
  min-width: 0;
}

.card-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: 2px;
}

.card-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text-primary);
}

.current-badge {
  font-size: 10px;
  font-weight: 500;
  color: var(--color-accent-primary);
  background-color: rgba(232, 160, 191, 0.15);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.card-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 4px;
}

.card-count {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

/* 抽卡按钮 */
.draw-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  flex-shrink: 0;
  transition: all var(--duration-fast) ease;
}

.draw-btn:active:not(:disabled) {
  transform: scale(0.92);
  background-color: var(--color-accent-primary);
}

.draw-btn:disabled {
  opacity: 0.5;
}

/* 加载动画 */
.draw-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 问题卡片浮层 */
.question-overlay {
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

.question-modal {
  width: 100%;
  max-width: 400px;
}

/* 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all var(--duration-normal) ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
