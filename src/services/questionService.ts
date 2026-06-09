import type { Question, QuestionText } from '@/types/question'
import { normalizeQuestionText } from '@/types/question'
import type { ModeId } from '@/types/mode'
import { isValidMode } from '@/types/mode'
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
      // 加载 icebreaker 离线题库
      const response = await fetch('/offline_questions.json')
      const icebreakerQuestions = await response.json()
      
      // 加载 intimacy 离线题库（如果存在）
      let intimacyQuestions: any[] = []
      try {
        const intResponse = await fetch('/offline_questions_intimacy.json')
        intimacyQuestions = await intResponse.json()
      } catch {
        // intimacy 题库不存在，忽略
      }
      
      // 合并所有离线题库
      this.offlineQuestions = [...icebreakerQuestions, ...intimacyQuestions]
    } catch (err) {
      console.error('Failed to load offline questions:', err)
    }
  }

  /**
   * 生成问题
   */
  async generateQuestion(
    mode: ModeId,
    category: string,
    useOffline = false,
    depth = 1,
    tone = 'light'
  ): Promise<Question | null> {
    // 更新去重服务
    await this.updateDedupService(mode, category)

    // 尝试从LLM生成
    if (!useOffline && this.llmService) {
      try {
        const question = await this.generateFromLLM(mode, category, depth, tone)
        if (question) {
          return question
        }
      } catch (err) {
        console.warn('LLM generation failed, switching to offline:', err)
      }
    }

    // 使用离线题库
    return await this.generateFromOffline(mode, category)
  }

  /**
   * 从LLM生成问题
   */
  private async generateFromLLM(
    mode: ModeId,
    category: string,
    depth: number,
    tone: string
  ): Promise<Question | null> {
    if (!this.llmService) {
      return null
    }

    const recentQuestions = await this.storageService.getRecentQuestions(mode, category, 20)

    const params: LLMRequestParams = {
      mode,
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

        // 标准化 question 为 QuestionText 格式
        const questionText: QuestionText = normalizeQuestionText(response.question)
        const enText = questionText.en

        // 验证 mode
        const responseMode = isValidMode(response.mode) ? response.mode : mode

        // 用英文文本去重
        if (this.dedupService.isDuplicate(enText)) {
          continue
        }

        // 创建问题对象
        const question: Question = {
          id: generateId(),
          mode: responseMode,
          text: { ...questionText },
          category: response.category || category,
          depth: response.depth || depth,
          tone: response.tone || tone,
          tags: [...response.tags],
          source: 'llm',
          hash: generateHash(enText),
          createdAt: Date.now(),
          favorite: false
        }

        // 保存到数据库
        await this.storageService.saveQuestion(question)

        return question
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        console.warn(`LLM request failed (${i + 1}/${maxRetries}):`, lastError.message)
      }
    }

    throw lastError || new Error('LLM generation failed')
  }

  /**
   * 从离线题库生成问题
   */
  private async generateFromOffline(
    mode: ModeId,
    category: string
  ): Promise<Question | null> {
    // 筛选当前模式和分类的离线问题
    const categoryQuestions = this.offlineQuestions.filter(q => {
      const qMode = isValidMode(q.mode) ? q.mode : 'icebreaker'
      return qMode === mode && q.category === category
    })

    if (categoryQuestions.length === 0) {
      console.warn(`No offline questions for mode:${mode} category:${category}`)
      return null
    }

    // 随机打乱顺序
    const shuffled = [...categoryQuestions].sort(() => Math.random() - 0.5)

    // 尝试找到一个不重复的问题
    for (const offlineQ of shuffled) {
      // 标准化为 QuestionText 格式
      const questionText: QuestionText = normalizeQuestionText(offlineQ.question)
      const enText = questionText.en
      const hash = generateHash(enText)

      // 用英文文本去重
      if (this.dedupService.isDuplicate(enText)) {
        continue
      }

      // 找到有效问题
      const question: Question = {
        id: generateId(),
        mode: isValidMode(offlineQ.mode) ? offlineQ.mode : 'icebreaker',
        text: { ...questionText },
        category: offlineQ.category,
        depth: offlineQ.depth,
        tone: offlineQ.tone,
        tags: [...offlineQ.tags],
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
  private async updateDedupService(mode: ModeId, category: string): Promise<void> {
    const recentQuestions = await this.storageService.getRecentQuestions(mode, category, 50)
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
          title: '开场白',
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
