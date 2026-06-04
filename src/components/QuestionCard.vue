<script setup lang="ts">
import { computed } from 'vue'
import type { Question } from '@/types/question'
import { useCategoryStore } from '@/stores/categoryStore'

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

function handleFavorite() {
  emit('favorite', props.question.id)
}

function handleCopy() {
  emit('copy', props.question.text)
}

function handleShare() {
  emit('share', props.question.text)
}

function handleHide() {
  emit('hide', props.question)
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
    </div>
    
    <!-- 问题文本 -->
    <div class="card-body">
      <p class="question-text">{{ question.text }}</p>
    </div>
    
    <!-- 操作按钮 -->
    <div class="card-footer">
      <button 
        class="action-btn"
        :class="{ active: question.favorite }"
        @click="handleFavorite"
      >
        <span class="btn-icon">{{ question.favorite ? '❤️' : '🤍' }}</span>
        <span class="btn-text">Favorite</span>
      </button>
      
      <button class="action-btn" @click="handleCopy">
        <span class="btn-icon">📋</span>
        <span class="btn-text">Copy</span>
      </button>
      
      <button class="action-btn" @click="handleShare">
        <span class="btn-icon">📤</span>
        <span class="btn-text">Share</span>
      </button>
      
      <button class="action-btn hide-btn" @click="handleHide">
        <span class="btn-icon">👁️</span>
        <span class="btn-text">Hide</span>
      </button>
    </div>
    
    <!-- 来源标签 -->
    <div class="source-tag">
      {{ question.source === 'llm' ? 'AI' : 'Offline' }}
    </div>
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
  justify-content: space-around;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
  margin-top: auto;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  transition: all var(--duration-fast) ease;
  min-width: 60px;
}

.action-btn:active {
  transform: scale(0.95);
  background-color: var(--color-border-light);
}

.action-btn.active {
  color: var(--color-accent-primary);
}

.btn-icon {
  font-size: 20px;
  line-height: 1;
}

.btn-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.hide-btn {
  opacity: 0.6;
}

.hide-btn:hover {
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
