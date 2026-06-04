import type { Question } from '@/types/question'
import type { LLMRequestParams } from '@/types/llm'
import { LLMService, createLLMService } from './llmService'
import { DedupService, createDedupService } from './dedupService'
import { StorageService, createStorageService } from './storageService'
import { generateId, generateHash } from '@/utils/hash'

/**
 * 问题服务
 * 负责问题生成主流程
 */
export class QuestionService {
  private llmService: LLMService | null
  private dedupService: DedupService
  private storageService: StorageService
  private offlineQuestions: any[] = []

  constructor(
    llmService: LLMService | null,
    dedupService: DedupService,
    storageService: StorageService
  ) {
    this.llmService = llmService
    this.dedupService = dedupService
    this.storageService = storageService
  }

  /**
   * 加载离线题库
   */
  async loadOfflineQuestions(): Promise<void> {
    try {
      const response = await fetch('/offline_questions.json')
      this.offlineQuestions = await response.json()
    } catch (err) {
      console.error('加载离线题库失败:', err)
    }
  }

  /**
   * 生成问题
   */
  async generateQuestion(
    category: string,
    useOffline = false,
    depth = 1,
    tone = '轻松'
  ): Promise<Question | null> {
    // 更新去重服务
    await this.updateDedupService(category)

    // 尝试从LLM生成
    if (!useOffline && this.llmService) {
      try {
        const question = await this.generateFromLLM(category, depth, tone)
        if (question) {
          return question
        }
      } catch (err) {
        console.error('LLM生成失败，切换到离线题库:', err)
      }
    }

    // 使用离线题库
    return await this.generateFromOffline(category)
  }

  /**
   * 从LLM生成问题
   */
  private async generateFromLLM(
    category: string,
    depth: number,
    tone: string
  ): Promise<Question | null> {
    if (!this.llmService) {
      return null
    }

    const recentQuestions = await this.storageService.getRecentQuestions(category, 20)

    const params: LLMRequestParams = {
      category,
      depth,
      tone,
      recentQuestions
    }

    let lastError: Error | null = null
    const maxRetries = 2

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await this.llmService.generateQuestion(params)

        // 检查是否重复
        if (this.dedupService.isDuplicate(response.question)) {
          continue
        }

        // 创建问题对象
        const question: Question = {
          id: generateId(),
          text: response.question,
          category: response.category || category,
          depth: response.depth || depth,
          tone: response.tone || tone,
          tags: response.tags || [],
          source: 'llm',
          hash: generateHash(response.question),
          createdAt: Date.now(),
          favorite: false
        }

        // 保存到数据库
        await this.storageService.saveQuestion(question)

        return question
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        console.warn(`LLM请求失败 (${i + 1}/${maxRetries}):`, lastError.message)
      }
    }

    throw lastError || new Error('LLM生成失败')
  }

  /**
   * 从离线题库生成问题
   */
  private async generateFromOffline(category: string): Promise<Question | null> {
    // 确保离线题库已加载
    if (this.offlineQuestions.length === 0) {
      await this.loadOfflineQuestions()
    }

    // 筛选当前分类的问题
    const categoryQuestions = this.offlineQuestions.filter(q => q.category === category)

    if (categoryQuestions.length === 0) {
      return null
    }

    // 随机打乱顺序
    const shuffled = [...categoryQuestions].sort(() => Math.random() - 0.5)

    // 尝试找到一个不重复的问题
    for (const offlineQ of shuffled) {
      const hash = generateHash(offlineQ.text)

      // 检查是否在隐藏列表中
      if (this.dedupService.isDuplicate(offlineQ.text)) {
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

      // 保存到数据库
      await this.storageService.saveQuestion(question)

      return question
    }

    return null
  }

  /**
   * 更新去重服务
   */
  private async updateDedupService(category: string): Promise<void> {
    const recentQuestions = await this.storageService.getRecentQuestions(category, 50)
    const hiddenHashes = await this.storageService.getHiddenHashes()

    this.dedupService.updateRecentQuestions(recentQuestions)
    this.dedupService.updateHiddenHashes(hiddenHashes)
  }

  /**
   * 切换收藏状态
   */
  async toggleFavorite(id: string): Promise<boolean> {
    return await this.storageService.toggleFavorite(id)
  }

  /**
   * 隐藏问题
   */
  async hideQuestion(hash: string): Promise<void> {
    await this.storageService.hideQuestion(hash)
  }

  /**
   * 复制问题
   */
  async copyQuestion(text: string): Promise<boolean> {
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

  /**
   * 分享问题
   */
  async shareQuestion(text: string): Promise<boolean> {
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
}

/**
 * 创建问题服务实例
 */
export function createQuestionService(): QuestionService {
  const llmService = createLLMService()
  const dedupService = createDedupService()
  const storageService = createStorageService()

  return new QuestionService(llmService, dedupService, storageService)
}
