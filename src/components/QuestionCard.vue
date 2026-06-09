<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import type { Question } from '@/types/question'
import { getQuestionText, hasChineseText } from '@/types/question'
import { useCategoryStore } from '@/stores/categoryStore'
import { shareCardImage, saveCardToGallery } from '@/services/shareImageService'
import ShareQuestionCard from './ShareQuestionCard.vue'
import Toast from './Toast.vue'

const props = defineProps<{
  question: Question
}>()

const emit = defineEmits<{
  favorite: [id: string]
  copy: [text: string]
  share: [text: string]
  hide: [question: Question]
}>()

const categoryStore = useCategoryStore()

// 翻译状态
const displayLang = ref<'en' | 'zh'>('en')

// 分享相关状态
const showShareSheet = ref(false)
const isGenerating = ref(false)
const shareCardContainerRef = ref<HTMLDivElement | null>(null)
const toastVisible = ref(false)
const toastMsg = ref('')
const toastType = ref<'success' | 'error' | 'info'>('success')

// 切换问题时重置为英文
watch(
  () => props.question.id,
  () => {
    displayLang.value = 'en'
    showShareSheet.value = false
  }
)

const categoryName = computed(() => 
  categoryStore.getCategoryName(props.question.category)
)

const categoryColor = computed(() => {
  const category = categoryStore.getCategoryById(props.question.category)
  return category?.color || 'var(--color-accent-primary)'
})

const depthLabel = computed(() => {
  const labels: Record<number, string> = {
    1: 'Light',
    2: 'Medium',
    3: 'Deep'
  }
  return labels[props.question.depth] || 'Light'
})

const toneLabel = computed(() => {
  const labels: Record<string, string> = {
    light: 'Light',
    formal: 'Formal',
    humorous: 'Humorous',
    warm: 'Warm'
  }
  return labels[props.question.tone] || 'Light'
})

const currentText = computed(() => {
  return getQuestionText(props.question, displayLang.value)
})

const canTranslate = computed(() => {
  return hasChineseText(props.question)
})

function toggleLanguage() {
  if (!canTranslate.value) return
  displayLang.value = displayLang.value === 'en' ? 'zh' : 'en'
}

function handleFavorite() {
  emit('favorite', props.question.id)
}

function handleCopy() {
  emit('copy', currentText.value)
}

function handleShare() {
  showShareSheet.value = true
}

function handleHide() {
  emit('hide', props.question)
}

function showToastMsg(message: string, type: 'success' | 'error' | 'info' = 'success') {
  toastMsg.value = message
  toastType.value = type
  toastVisible.value = true
}

/** Get the hidden share card DOM element */
function getShareCardElement(): HTMLElement | null {
  const container = shareCardContainerRef.value
  if (!container) return null
  return container.querySelector('.share-card') as HTMLElement | null
}

/** 分享图片 */
async function handleShareImage() {
  console.log('[Share] handleShareImage called')
  showShareSheet.value = false
  isGenerating.value = true

  try {
    await nextTick()
    const el = getShareCardElement()
    console.log('[Share] share card element:', el)
    if (!el) throw new Error('Share card element not found')

    console.log('[Share] calling shareCardImage...')
    await shareCardImage(el)
    console.log('[Share] share success')
    showToastMsg('已打开分享面板', 'success')
  } catch (err) {
    console.error('[Share] share failed:', err)
    showToastMsg('分享失败，请稍后再试', 'error')
  } finally {
    isGenerating.value = false
  }
}

/** 保存到相册 */
async function handleSaveImage() {
  showShareSheet.value = false
  isGenerating.value = true

  try {
    await nextTick()
    const el = getShareCardElement()
    if (!el) throw new Error('Share card element not found')

    await saveCardToGallery(el)
    showToastMsg('已保存到相册', 'success')
  } catch (err) {
    console.error('[Share] save failed:', err)
    showToastMsg('保存失败，请检查权限设置', 'error')
  } finally {
    isGenerating.value = false
  }
}
</script>

<template>
  <div class="question-card">
    <!-- 分类标签 -->
    <div class="card-header">
      <span 
        class="category-tag"
        :style="{ backgroundColor: categoryColor }"
      >
        {{ categoryName }}
      </span>
      <span class="depth-tag">{{ depthLabel }}</span>
      <span class="tone-tag">🎵 {{ toneLabel }}</span>
      <span v-if="question.source === 'llm'" class="source-tag">AI</span>
    </div>

    <!-- 问题内容 -->
    <div class="card-body">
      <p class="question-text">{{ currentText }}</p>
    </div>

    <!-- 底部操作栏 -->
    <div class="card-footer">
      <!-- 翻译按钮 -->
      <button
        v-if="canTranslate"
        class="translate-btn"
        :class="{ active: displayLang === 'zh' }"
        @click="toggleLanguage"
      >
        {{ displayLang === 'en' ? '译' : 'EN' }}
      </button>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="action-btn" @click="handleFavorite">
          <span class="btn-icon">{{ question.favorite ? '❤️' : '🤍' }}</span>
        </button>
        <button class="action-btn" @click="handleCopy">
          <span class="btn-icon">📋</span>
        </button>
        <button class="action-btn" @click="handleShare">
          <span class="btn-icon">📤</span>
        </button>
        <button class="action-btn hide-btn" @click="handleHide">
          <span class="btn-icon">🙈</span>
        </button>
      </div>
    </div>

    <!-- 隐藏的分享卡片渲染区 -->
    <div ref="shareCardContainerRef" class="share-card-container">
      <ShareQuestionCard ref="shareCardRef" :question="question" />
    </div>

    <!-- 分享操作菜单 -->
    <transition name="fade">
      <div v-if="showShareSheet" class="share-overlay" @click="showShareSheet = false">
        <div class="share-sheet" @click.stop>
          <p class="share-sheet__title">分享卡片图片</p>
          <button class="share-sheet__btn" @click="handleShareImage" :disabled="isGenerating">
            <span class="share-sheet__icon">📤</span>
            <div class="share-sheet__btn-text">
              <span class="share-sheet__btn-label">分享图片</span>
              <span class="share-sheet__btn-desc">发送给朋友或社交平台</span>
            </div>
          </button>
          <button class="share-sheet__btn" @click="handleSaveImage" :disabled="isGenerating">
            <span class="share-sheet__icon">💾</span>
            <div class="share-sheet__btn-text">
              <span class="share-sheet__btn-label">保存到相册</span>
              <span class="share-sheet__btn-desc">保存图片到本地图库</span>
            </div>
          </button>
          <button class="share-sheet__cancel" @click="showShareSheet = false" :disabled="isGenerating">
            取消
          </button>
        </div>
      </div>
    </transition>

    <!-- Toast -->
    <Toast :show="toastVisible" :message="toastMsg" :type="toastType" @close="toastVisible = false" />
  </div>
</template>

<style scoped>
.question-card {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-2xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border-light);
  position: relative;
  overflow: hidden;
  min-height: 300px;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.category-tag {
  font-size: var(--font-size-sm);
  color: white;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-weight: 500;
}

.depth-tag {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
}

.tone-tag {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
}

.source-tag {
  margin-left: auto;
  font-size: var(--font-size-xs);
  color: var(--color-accent-primary);
  background-color: rgba(232, 160, 191, 0.1);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: 500;
}

.card-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg) 0;
}

.question-text {
  font-size: var(--font-size-2xl);
  line-height: 1.6;
  color: var(--color-text-primary);
  text-align: center;
  font-weight: 500;
  word-break: break-word;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
  margin-top: auto;
}

/* 翻译按钮 */
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

/* 操作按钮组 */
.action-buttons {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  transition: all var(--duration-fast) ease;
}

.action-btn:active {
  transform: scale(0.9);
  background-color: var(--color-border-light);
}

.btn-icon {
  font-size: 18px;
  line-height: 1;
}

.hide-btn {
  opacity: 0.6;
}

.hide-btn:active {
  opacity: 1;
}

/* 隐藏的分享卡片容器 */
.share-card-container {
  position: absolute;
  left: -9999px;
  top: -9999px;
  z-index: -1;
  pointer-events: none;
}

/* 分享操作菜单 */
.share-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: var(--spacing-lg);
}

.share-sheet {
  background: var(--color-bg-card);
  border-radius: var(--radius-2xl);
  padding: var(--spacing-lg);
  width: 100%;
  max-width: 360px;
  box-shadow: var(--shadow-xl);
}

.share-sheet__title {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.share-sheet__btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  width: 100%;
  padding: var(--spacing-md);
  background: none;
  border: none;
  border-radius: var(--radius-lg);
  transition: background-color var(--duration-fast) ease;
}

.share-sheet__btn:active:not(:disabled) {
  background-color: var(--color-border-light);
}

.share-sheet__btn:disabled {
  opacity: 0.5;
}

.share-sheet__icon {
  font-size: 24px;
}

.share-sheet__btn-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.share-sheet__btn-label {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: 500;
}

.share-sheet__btn-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.share-sheet__cancel {
  display: block;
  width: 100%;
  margin-top: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  font-weight: 500;
  transition: background-color var(--duration-fast) ease;
}

.share-sheet__cancel:active:not(:disabled) {
  background-color: var(--color-border);
}

.share-sheet__cancel:disabled {
  opacity: 0.5;
}

/* fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
