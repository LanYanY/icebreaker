<script setup lang="ts">
import { computed } from 'vue'
import type { Question } from '@/types/question'
import { getQuestionText } from '@/types/question'
import { useCategoryStore } from '@/stores/categoryStore'
import { getQuestionMode, getModeById } from '@/types/mode'

const props = defineProps<{
  question: Question
}>()

const categoryStore = useCategoryStore()

const categoryName = computed(() => {
  return categoryStore.getCategoryName(props.question.category)
})

const categoryIcon = computed(() => {
  return categoryStore.getCategoryIcon(props.question.category)
})

// 模式主题色
const modeId = computed(() => getQuestionMode(props.question))

const modeTheme = computed(() => {
  const mode = getModeById(modeId.value)
  return mode?.theme || { primary: '#8DBDEB', secondary: '#D8EAFB', background: '#F4F9FF', card: '#FFFFFF', accent: '#A9C7E8' }
})

const modeName = computed(() => {
  const mode = getModeById(modeId.value)
  return mode?.name || 'Icebreaker'
})

const questionEn = computed(() => getQuestionText(props.question, 'en'))
const questionZh = computed(() => getQuestionText(props.question, 'zh'))
const hasZh = computed(() => !!questionZh.value)
</script>

<template>
  <div class="share-card-wrapper">
    <div
      class="share-card"
      :style="{
        '--card-primary': modeTheme.primary,
        '--card-secondary': modeTheme.secondary,
        '--card-background': modeTheme.background,
        '--card-accent': modeTheme.accent,
      }"
    >
      <!-- 装饰圆 -->
      <div class="share-card__circle share-card__circle--1"></div>
      <div class="share-card__circle share-card__circle--2"></div>

      <!-- 顶部品牌 -->
      <div class="share-card__header">
        <span class="share-card__brand">开场白 Opening Line</span>
      </div>

      <!-- 分类标签 -->
      <div class="share-card__category">
        <span class="share-card__category-icon">{{ categoryIcon }}</span>
        <span class="share-card__category-name">{{ categoryName }}</span>
      </div>

      <!-- 问题英文（大字） -->
      <div class="share-card__en">
        {{ questionEn }}
      </div>

      <!-- 问题中文（小字） -->
      <div v-if="hasZh" class="share-card__zh">
        {{ questionZh }}
      </div>

      <!-- 分割线 -->
      <div class="share-card__divider"></div>

      <!-- 底部品牌 -->
      <div class="share-card__brand-footer">
        <span class="share-card__brand-name">开场白 · {{ modeName }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.share-card-wrapper {
  position: fixed;
  left: -9999px;
  top: 0;
  z-index: -1;
}

.share-card {
  width: 540px;
  height: 675px;
  background: linear-gradient(160deg, var(--card-background, #FFF6FA) 0%, var(--card-secondary, #F8D8E8) 50%, var(--card-background, #FFF6FA) 100%);
  border-radius: 24px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "HarmonyOS Sans", "Microsoft YaHei", sans-serif;
}

.share-card__circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.15;
}

.share-card__circle--1 {
  width: 200px;
  height: 200px;
  background: var(--card-primary, #E8A0BF);
  top: -40px;
  right: -40px;
}

.share-card__circle--2 {
  width: 120px;
  height: 120px;
  background: var(--card-accent, #F2B8C6);
  bottom: 60px;
  left: -30px;
}

.share-card__header {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}

.share-card__brand {
  font-size: 14px;
  font-weight: 500;
  color: #B8A8C0;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.share-card__category {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(232, 160, 191, 0.12);
  border: 1px solid rgba(232, 160, 191, 0.2);
  border-radius: 100px;
  align-self: flex-start;
  margin-bottom: 0;
}

.share-card__category-icon {
  font-size: 16px;
}

.share-card__category-name {
  font-size: 14px;
  font-weight: 500;
  color: #9A7B8E;
  letter-spacing: 0.5px;
}

.share-card__en {
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 32px;
  font-weight: 600;
  color: #2D2B3A;
  line-height: 1.45;
  letter-spacing: -0.3px;
  margin-top: 24px;
}

.share-card__zh {
  font-size: 20px;
  font-weight: 400;
  color: #8A8698;
  line-height: 1.6;
  margin-top: 16px;
  letter-spacing: 0.3px;
}

.share-card__divider {
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, var(--card-primary, #E8A0BF), var(--card-accent, #D4A0D0));
  border-radius: 2px;
  margin: 20px 0 16px;
  opacity: 0.6;
}

.share-card__brand-footer {
  display: flex;
  justify-content: center;
}

.share-card__brand-name {
  font-size: 13px;
  font-weight: 500;
  color: #C0B8C8;
  letter-spacing: 1px;
}
</style>
