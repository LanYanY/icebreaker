import { normalizeText, generateHash } from '@/utils/hash'
import { calculateSimilarity, isTooSimilar } from '@/utils/ngram'
import { getQuestionText } from '@/types/question'
import type { Question } from '@/types/question'

/**
 * 去重服务
 * 负责检测和过滤重复或相似的问题
 */
export class DedupService {
  private recentQuestions: string[] = []
  private hiddenHashes: Set<string> = new Set()
  private similarityThreshold: number

  constructor(
    recentQuestions: string[] = [],
    hiddenHashes: Set<string> = new Set(),
    similarityThreshold = 0.85
  ) {
    this.recentQuestions = recentQuestions
    this.hiddenHashes = hiddenHashes
    this.similarityThreshold = similarityThreshold
  }

  /**
   * 检查问题是否重复
   * @returns 如果问题重复返回true
   */
  isDuplicate(text: string): boolean {
    const normalized = normalizeText(text)
    const hash = generateHash(normalized)

    // 检查是否在隐藏列表中
    if (this.hiddenHashes.has(hash)) {
      console.log('[Dedup] 在隐藏列表中:', text)
      return true
    }

    // 检查是否与最近问题相似
    if (isTooSimilar(text, this.recentQuestions, this.similarityThreshold)) {
      console.log('[Dedup] 与最近问题相似:', text, '最近问题数:', this.recentQuestions.length)
      return true
    }

    return false
  }

  /**
   * 计算两个文本的相似度
   */
  calculateSimilarity(text1: string, text2: string): number {
    return calculateSimilarity(text1, text2)
  }

  /**
   * 更新最近问题列表
   */
  updateRecentQuestions(questions: (string | Question)[]) {
    this.recentQuestions = questions.map(q => {
      if (typeof q === 'string') return q
      return getQuestionText(q, 'en')
    })
  }

  /**
   * 更新隐藏hash列表
   */
  updateHiddenHashes(hashes: Set<string>) {
    this.hiddenHashes = hashes
  }

  /**
   * 设置相似度阈值
   */
  setSimilarityThreshold(threshold: number) {
    this.similarityThreshold = threshold
  }
}

/**
 * 创建去重服务实例
 */
export function createDedupService(
  recentQuestions: string[] = [],
  hiddenHashes: Set<string> = new Set()
): DedupService {
  return new DedupService(recentQuestions, hiddenHashes)
}
