import * as db from '@/db'
import type { Question } from '@/types/question'

/**
 * 存储服务
 * 负责本地数据读写
 */
export class StorageService {
  /**
   * 保存问题
   */
  async saveQuestion(question: Question): Promise<string> {
    return await db.addQuestion(question)
  }

  /**
   * 获取问题
   */
  async getQuestion(id: string): Promise<Question | undefined> {
    return await db.getQuestionById(id)
  }

  /**
   * 获取最近问题
   */
  async getRecentQuestions(category: string, limit = 50): Promise<string[]> {
    return await db.getRecentQuestions(category, limit)
  }

  /**
   * 获取所有问题
   */
  async getAllQuestions(): Promise<Question[]> {
    return await db.getAllQuestions()
  }

  /**
   * 获取收藏问题
   */
  async getFavoriteQuestions(): Promise<Question[]> {
    return await db.getFavoriteQuestions()
  }

  /**
   * 切换收藏状态
   */
  async toggleFavorite(id: string): Promise<boolean> {
    return await db.toggleFavorite(id)
  }

  /**
   * 隐藏问题
   */
  async hideQuestion(hash: string): Promise<void> {
    await db.hideQuestion(hash)
  }

  /**
   * 获取隐藏的hash列表
   */
  async getHiddenHashes(): Promise<Set<string>> {
    return await db.getHiddenHashes()
  }

  /**
   * 删除问题
   */
  async deleteQuestion(id: string): Promise<void> {
    await db.deleteQuestion(id)
  }

  /**
   * 清空历史记录
   */
  async clearHistory(): Promise<void> {
    await db.clearAllHistory()
  }

  /**
   * 清空收藏
   */
  async clearFavorites(): Promise<void> {
    await db.clearAllFavorites()
  }

  /**
   * 获取设置
   */
  async getSetting(key: string): Promise<string | undefined> {
    return await db.getSetting(key)
  }

  /**
   * 保存设置
   */
  async setSetting(key: string, value: string): Promise<void> {
    await db.setSetting(key, value)
  }

  /**
   * 删除设置
   */
  async deleteSetting(key: string): Promise<void> {
    await db.deleteSetting(key)
  }
}

/**
 * 创建存储服务实例
 */
export function createStorageService(): StorageService {
  return new StorageService()
}
