import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Question } from '@/types/question'
import * as db from '@/db'
import { generateId, generateHash } from '@/utils/hash'
import { isTooSimilar } from '@/utils/ngram'

export const useQuestionStore = defineStore('question', () => {
  // 状态
  const currentQuestion = ref<Question | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const offlineQuestions = ref<any[]>([])
  
  // 计算属性
  const hasQuestion = computed(() => currentQuestion.value !== null)
  
  // 加载离线题库
  async function loadOfflineQuestions() {
    try {
      const response = await fetch('/offline_questions.json')
      offlineQuestions.value = await response.json()
    } catch (err) {
      console.error('加载离线题库失败:', err)
    }
  }
  
  // 方法
  async function drawQuestion(category: string, useOffline = false): Promise<Question | null> {
    isLoading.value = true
    error.value = null
    
    try {
      // 确保离线题库已加载
      if (offlineQuestions.value.length === 0) {
        await loadOfflineQuestions()
      }
      
      // 获取最近的问题用于去重
      const recentQuestions = await db.getRecentQuestions(category, 50)
      const hiddenHashes = await db.getHiddenHashes()
      
      // 尝试获取新问题
      let question: Question | null = null
      
      if (!useOffline) {
        // TODO: 尝试从LLM获取问题
        // 暂时使用离线题库
        question = await getOfflineQuestion(category, recentQuestions, hiddenHashes)
      } else {
        question = await getOfflineQuestion(category, recentQuestions, hiddenHashes)
      }
      
      if (question) {
        // 保存到数据库
        await db.addQuestion(question)
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
  
  async function getOfflineQuestion(
    category: string, 
    recentQuestions: string[],
    hiddenHashes: Set<string>
  ): Promise<Question | null> {
    // 从离线题库中筛选当前分类的问题
    const categoryQuestions = offlineQuestions.value.filter(q => q.category === category)
    
    if (categoryQuestions.length === 0) {
      return null
    }
    
    // 随机打乱顺序
    const shuffled = [...categoryQuestions].sort(() => Math.random() - 0.5)
    
    // 尝试找到一个不重复的问题
    for (const offlineQ of shuffled) {
      const hash = generateHash(offlineQ.text)
      
      // 检查是否在隐藏列表中
      if (hiddenHashes.has(hash)) {
        continue
      }
      
      // 检查是否与最近问题相似
      if (isTooSimilar(offlineQ.text, recentQuestions)) {
        continue
      }
      
      // 找到有效问题
      const question: Question = {
        id: generateId(),
        text: offlineQ.text,
        category: offlineQ.category,
        depth: offlineQ.depth,
        tone: offlineQ.tone,
        tags: offlineQ.tags,
        source: 'offline',
        hash: hash,
        createdAt: Date.now(),
        favorite: false
      }
      
      return question
    }
    
    return null
  }
  
  async function toggleFavorite(questionId: string): Promise<boolean> {
    const result = await db.toggleFavorite(questionId)
    
    // 更新当前问题
    if (currentQuestion.value?.id === questionId) {
      currentQuestion.value = { ...currentQuestion.value, favorite: result }
    }
    
    return result
  }
  
  async function hideQuestion(question: Question): Promise<void> {
    await db.hideQuestion(question.hash)
    
    // 如果隐藏的是当前问题，清除当前问题
    if (currentQuestion.value?.id === question.id) {
      currentQuestion.value = null
    }
  }
  
  async function copyQuestion(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
      return true
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
      return true
    }
  }
  
  async function shareQuestion(text: string): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '破冰话题',
          text: text
        })
        return true
      } catch {
        return false
      }
    }
    return false
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
    loadOfflineQuestions
  }
})
