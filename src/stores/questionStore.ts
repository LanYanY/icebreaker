import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Question } from '@/types/question'
import { QuestionService, createQuestionService } from '@/services/questionService'

export const useQuestionStore = defineStore('question', () => {
  // 状态
  const currentQuestion = ref<Question | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const questionService = ref<QuestionService | null>(null)

  // 计算属性
  const hasQuestion = computed(() => currentQuestion.value !== null)

  // 初始化服务
  function initService() {
    questionService.value = createQuestionService()
  }

  // 方法
  async function drawQuestion(category: string, useOffline = false): Promise<Question | null> {
    isLoading.value = true
    error.value = null

    try {
      // 确保服务已初始化
      if (!questionService.value) {
        initService()
      }

      // 确保离线题库已加载
      await questionService.value!.loadOfflineQuestions()

      const question = await questionService.value!.generateQuestion(category, useOffline)

      if (question) {
        currentQuestion.value = question
        return question
      } else {
        error.value = '这个分类的问题快抽完了，可以换个分类试试'
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
    if (!questionService.value) {
      initService()
    }

    const result = await questionService.value!.toggleFavorite(questionId)

    // 更新当前问题
    if (currentQuestion.value?.id === questionId) {
      currentQuestion.value = { ...currentQuestion.value, favorite: result }
    }

    return result
  }

  async function hideQuestion(question: Question): Promise<void> {
    if (!questionService.value) {
      initService()
    }

    await questionService.value!.hideQuestion(question.hash)

    // 如果隐藏的是当前问题，清除当前问题
    if (currentQuestion.value?.id === question.id) {
      currentQuestion.value = null
    }
  }

  async function copyQuestion(text: string): Promise<boolean> {
    if (!questionService.value) {
      initService()
    }

    return await questionService.value!.copyQuestion(text)
  }

  async function shareQuestion(text: string): Promise<boolean> {
    if (!questionService.value) {
      initService()
    }

    return await questionService.value!.shareQuestion(text)
  }

  function clearError() {
    error.value = null
  }

  async function loadOfflineQuestions() {
    if (!questionService.value) {
      initService()
    }
    await questionService.value!.loadOfflineQuestions()
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
    initService,
    loadOfflineQuestions
  }
})
