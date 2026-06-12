<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useQuestionStore } from '@/stores/questionStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useSettingStore } from '@/stores/settingStore'
import { APP_MODES, isValidMode } from '@/types/mode'
import type { ModeId } from '@/types/mode'
import QuestionCard from '@/components/QuestionCard.vue'
import Toast from '@/components/Toast.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { Question } from '@/types/question'

const questionStore = useQuestionStore()
const categoryStore = useCategoryStore()
const settingStore = useSettingStore()

const showCategoryPicker = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info'>('success')
const showHideConfirm = ref(false)
const questionToHide = ref<Question | null>(null)

// 应用模式主题
function applyMode(mode: string) {
  const validMode = isValidMode(mode) ? mode : 'icebreaker'
  document.documentElement.setAttribute('data-mode', validMode)
}

onMounted(async () => {
  // 应用当前模式主题
  applyMode(settingStore.userSetting.currentMode)
  // 同步 defaultCategory 到 categoryStore
  const savedCategory = settingStore.userSetting.defaultCategory
  if (savedCategory) {
    categoryStore.setCurrentCategory(savedCategory)
  }
})

// 监听模式变化
watch(() => settingStore.userSetting.currentMode, (newMode) => {
  applyMode(newMode)
})

// 切换模式
function handleSwitchMode(mode: ModeId) {
  if (mode === categoryStore.currentMode) return
  settingStore.saveUserSetting({ currentMode: mode })
  categoryStore.switchMode(mode)
}

async function handleDrawQuestion() {
  await questionStore.drawQuestion(
    categoryStore.currentCategoryId,
    settingStore.userSetting.defaultDepth,
    settingStore.userSetting.defaultTone
  )
  // 循环模式：抽卡成功后自动推进到下一个分类
  if (questionStore.currentQuestion) {
    categoryStore.advanceCategory()
  }
}

function handleSelectCategory(categoryId: string) {
  categoryStore.setCurrentCategory(categoryId)
  showCategoryPicker.value = false
}

function handleFavorite(id: string) {
  questionStore.toggleFavorite(id)
  showToastMessage('Added to favorites', 'success')
}

function handleCopy(text: string) {
  questionStore.copyQuestion(text)
  showToastMessage('Copied to clipboard', 'success')
}

function handleShare(text: string) {
  questionStore.shareQuestion(text)
}

function handleHide(question: Question) {
  questionToHide.value = question
  showHideConfirm.value = true
}

function confirmHide() {
  if (questionToHide.value) {
    questionStore.hideQuestion(questionToHide.value)
    showToastMessage('Question hidden', 'info')
  }
  showHideConfirm.value = false
  questionToHide.value = null
}

function cancelHide() {
  showHideConfirm.value = false
  questionToHide.value = null
}

function showToastMessage(message: string, type: 'success' | 'error' | 'info' = 'success') {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
}

function handleToastClose() {
  showToast.value = false
}


</script>

<template>
  <div class="home-page">
    <!-- 顶部标题 + 模式切换 -->
    <header class="page-header">
      <h1 class="app-title">开场白</h1>
      <p class="app-subtitle">一张卡，打开一个话题</p>
      
      <!-- 模式切换器 -->
      <div class="mode-switcher">
        <button
          v-for="mode in APP_MODES"
          :key="mode.id"
          class="mode-tab"
          :class="{ active: categoryStore.currentMode === mode.id }"
          @click="handleSwitchMode(mode.id)"
        >
          <span class="mode-icon">{{ mode.icon }}</span>
          <span class="mode-name">{{ mode.name }}</span>
        </button>
      </div>
    </header>
    
    <!-- 分类选择器 + 循环模式 -->
    <div class="category-selector">
      <div class="category-row">
        <button 
          class="category-button"
          @click="showCategoryPicker = !showCategoryPicker"
        >
          <span class="category-icon">{{ categoryStore.currentCategory?.icon }}</span>
          <span class="category-name">{{ categoryStore.currentCategory?.name }}</span>
          <span class="category-arrow">▼</span>
        </button>
        <button
          class="cycle-toggle"
          :class="{ active: categoryStore.cycleMode }"
          :aria-label="categoryStore.cycleMode ? 'Category cycle mode on' : 'Category cycle mode off'"
          @click="categoryStore.toggleCycleMode()"
        >
          🔁
        </button>
      </div>
      <!-- 循环模式提示 -->
      <p v-if="categoryStore.cycleMode" class="cycle-hint">
        Next: {{ categoryStore.getCategoryName(categoryStore.nextCategoryId) }}
      </p>
      
      <!-- 分类下拉菜单 -->
      <transition name="fade">
        <div v-if="showCategoryPicker" class="category-dropdown">
          <button
            v-for="category in categoryStore.sortedCategories"
            :key="category.id"
            class="category-option"
            :class="{ active: category.id === categoryStore.currentCategoryId }"
            @click="handleSelectCategory(category.id)"
          >
            <span class="option-icon">{{ category.icon }}</span>
            <div class="option-info">
              <span class="option-name">{{ category.name }}</span>
              <span class="option-desc">{{ category.description }}</span>
            </div>
          </button>
        </div>
      </transition>
    </div>
    
    <!-- 问题卡片区域 -->
    <div class="card-area">
      <!-- 加载状态 -->
      <div v-if="questionStore.isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p class="loading-text">正在为你生成问题...</p>
      </div>
      
      <!-- 错误状态 -->
      <div v-else-if="questionStore.error" class="error-state">
        <p class="error-text">{{ questionStore.error }}</p>
        <button class="retry-button" @click="handleDrawQuestion">
          重试
        </button>
      </div>
      
      <!-- 空状态 -->
      <div v-else-if="!questionStore.hasQuestion" class="empty-state">
        <div class="empty-icon">🎴</div>
        <p class="empty-text">点击下方按钮，抽取第一张卡牌</p>
      </div>
      
      <!-- 问题卡片 -->
      <QuestionCard
        v-else
        :question="questionStore.currentQuestion!"
        @favorite="handleFavorite"
        @copy="handleCopy"
        @share="handleShare"
        @hide="handleHide"
      />
    </div>
    
    <!-- 抽卡按钮 -->
    <div class="draw-button-area">
      <button 
        class="draw-button"
        :disabled="questionStore.isLoading"
        @click="handleDrawQuestion"
      >
        <span class="draw-icon">🎴</span>
        <span class="draw-text">抽一张</span>
      </button>
    </div>
    
    <!-- Toast提示 -->
    <Toast
      :show="showToast"
      :message="toastMessage"
      :type="toastType"
      @close="handleToastClose"
    />
    
    <!-- 确认对话框 -->
    <ConfirmDialog
      :show="showHideConfirm"
      title="Hide Question"
      message="Are you sure you want to hide this question? You can restore it from history."
      confirm-text="Hide"
      cancel-text="Cancel"
      @confirm="confirmHide"
      @cancel="cancelHide"
    />
  </div>
</template>

<style scoped>
.home-page {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.app-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.app-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

/* 模式切换器 */
.mode-switcher {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: center;
  margin-top: var(--spacing-md);
}

.mode-tab {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-tertiary);
  background-color: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  transition: all var(--duration-fast) ease;
}

.mode-tab:active {
  transform: scale(0.95);
}

.mode-tab.active {
  border-color: var(--mode-primary);
  background-color: var(--mode-secondary);
  color: var(--color-text-primary);
}

.mode-icon {
  font-size: 16px;
}

.mode-name {
  font-size: var(--font-size-sm);
}

.category-selector {
  position: relative;
  margin-bottom: var(--spacing-xl);
}

.category-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.category-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  flex: 1;
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: all var(--duration-fast) ease;
}

.cycle-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  font-size: 22px;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-tertiary);
  transition: all var(--duration-fast) ease;
  flex-shrink: 0;
}

.cycle-toggle.active {
  background-color: var(--mode-secondary);
  border-color: var(--mode-primary);
  color: var(--mode-primary);
}

.cycle-hint {
  font-size: var(--font-size-xs);
  color: var(--mode-primary);
  text-align: center;
  margin-top: var(--spacing-xs);
  opacity: 0.8;
}

.category-button:active {
  transform: scale(0.98);
  background-color: var(--color-border-light);
}

.category-icon {
  font-size: 20px;
}

.category-name {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-text-primary);
}

.category-arrow {
  font-size: 12px;
  color: var(--color-text-tertiary);
  transition: transform var(--duration-fast) ease;
}

.category-dropdown {
  position: absolute;
  top: calc(100% + var(--spacing-sm));
  left: 0;
  right: 0;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: 110;
  overflow: hidden;
}

.category-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  width: 100%;
  padding: var(--spacing-md);
  text-align: left;
  transition: background-color var(--duration-fast) ease;
}

.category-option:hover {
  background-color: var(--color-border-light);
}

.category-option.active {
  background-color: var(--mode-secondary);
}

.option-icon {
  font-size: 24px;
}

.option-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-name {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-text-primary);
}

.option-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.card-area {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl);
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--mode-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
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

.error-text {
  font-size: var(--font-size-base);
  color: var(--color-error);
}

.retry-button {
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--mode-primary);
  color: white;
  border-radius: var(--radius-full);
  font-size: var(--font-size-base);
  transition: opacity var(--duration-fast) ease;
}

.retry-button:hover {
  opacity: 0.9;
}

.empty-icon {
  font-size: 64px;
  line-height: 1;
}

.empty-text {
  font-size: var(--font-size-base);
  color: var(--color-text-tertiary);
}

.draw-button-area {
  display: flex;
  justify-content: center;
  padding-bottom: var(--spacing-lg);
}

.draw-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  width: 100%;
  max-width: 300px;
  height: 56px;
  background: linear-gradient(135deg, var(--mode-primary), var(--mode-secondary));
  color: white;
  border-radius: var(--radius-full);
  font-size: var(--font-size-lg);
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(141, 189, 235, 0.4);
  transition: all var(--duration-fast) ease;
}

.draw-button:active:not(:disabled) {
  transform: scale(0.98);
}

.draw-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.draw-icon {
  font-size: 24px;
}

.draw-text {
  font-size: var(--font-size-lg);
}
</style>
