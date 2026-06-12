import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Question } from '@/types/question'
import { QuestionService, createQuestionService } from '@/services/questionService'
import { useSettingStore } from './settingStore'

export const useQuestionStore = defineStore('question', () => {
  // 状态
  const currentQuestion = ref<Question | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const questionService = ref<QuestionService | null>(null)
  const serviceInitialized = ref(false)

  // 计算属性
  const hasQuestion = computed(() => currentQuestion.value !== null)

  // 初始化服务（确保设置已加载）
  async function ensureService() {
    const settingStore = useSettingStore()
    await settingStore.initSettings()
    questionService.value = createQuestionService()
    serviceInitialized.value = true
  }

  // 方法
  async function drawQuestion(category: string, depth?: number, tone?: string): Promise<Question | null> {
    isLoading.value = true
    error.value = null

    try {
      await ensureService()

      // 获取当前模式
      const settingStore = useSettingStore()
      const mode = settingStore.userSetting.currentMode || 'icebreaker'
      const finalDepth = depth ?? settingStore.userSetting.defaultDepth ?? 1
      const finalTone = tone ?? settingStore.userSetting.defaultTone ?? 'light'

      console.log('[Store] 开始抽卡, mode:', mode, 'category:', category, 'depth:', finalDepth, 'tone:', finalTone)
      const question = await questionService.value!.generateQuestion(mode, category, finalDepth, finalTone)

      if (question) {
        console.log('[Store] 抽到问题:', question.text, 'source:', question.source, 'mode:', question.mode)
        currentQuestion.value = question
        return question
      } else {
        error.value = 'Running out of questions in this category. Try another one.'
        return null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取问题失败'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function toggleFavorite(questionId: string): Promise<boolean> {
    await ensureService()

    const result = await questionService.value!.toggleFavorite(questionId)

    // 更新当前问题
    if (currentQuestion.value?.id === questionId) {
      currentQuestion.value = { ...currentQuestion.value, favorite: result }
    }

    return result
  }

  async function hideQuestion(question: Question): Promise<void> {
    await ensureService()

    await questionService.value!.hideQuestion(question.hash)

    // 如果隐藏的是当前问题，清除当前问题
    if (currentQuestion.value?.id === question.id) {
      currentQuestion.value = null
    }
  }

  async function copyQuestion(text: string): Promise<boolean> {
    await ensureService()

    return await questionService.value!.copyQuestion(text)
  }

  async function shareQuestion(text: string): Promise<boolean> {
    await ensureService()

    return await questionService.value!.shareQuestion(text)
  }

  function clearError() {
    error.value = null
  }

  return {
    currentQuestion,
    isLoading,
    error,
    hasQuestion,
    drawQuestion,
    toggleFavorite,
    hideQuestion,
    copyQuestion,
    shareQuestion,
    clearError,
    ensureService,
  }
})
