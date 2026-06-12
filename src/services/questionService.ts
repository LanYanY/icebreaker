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
 * 负责问题生成主流程（仅 LLM）
 */
export class QuestionService {
  private llmService: LLMService | null
  private dedupService: DedupService
  private storageService: StorageService

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
   * 生成问题（仅 LLM）
   */
  async generateQuestion(
    mode: ModeId,
    category: string,
    depth = 1,
    tone = 'light'
  ): Promise<Question | null> {
    // 更新去重服务
    await this.updateDedupService(mode, category)

    // 从 LLM 生成
    if (this.llmService) {
      try {
        const question = await this.generateFromLLM(mode, category, depth, tone)
        if (question) {
          return question
        }
      } catch (err) {
        console.warn('LLM generation failed:', err)
      }
    }

    return null
  }

  /**
   * 从 LLM 生成问题
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
