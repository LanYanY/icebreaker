import type { ModeId } from './mode'

// 问题来源类型
export type QuestionSource = 'llm' | 'offline'

// 双语问题文本
export type QuestionText = {
  en: string
  zh: string
}

// 问题接口
export interface Question {
  id: string
  mode: ModeId
  text: QuestionText
  category: string
  depth: number
  tone: string
  tags: string[]
  source: QuestionSource
  hash: string
  createdAt: number
  favorite: boolean
  hidden?: boolean
}

// 创建问题的参数
export interface CreateQuestionParams {
  mode: ModeId
  text: QuestionText
  category: string
  depth: number
  tone: string
  tags: string[]
  source: QuestionSource
}

/**
 * 获取问题文本（兼容旧数据）
 * 旧数据中 text 是字符串，新数据中 text 是 { en, zh }
 */
export function getQuestionText(question: Question, lang: 'en' | 'zh'): string {
  if (typeof question.text === 'string') {
    return question.text
  }
  if (question.text?.[lang]) {
    return question.text[lang]
  }
  return question.text?.en || question.text?.zh || ''
}

/**
 * 检查问题是否有中文翻译
 */
export function hasChineseText(question: Question): boolean {
  if (typeof question.text === 'string') {
    return false
  }
  return !!question.text?.zh
}

/**
 * 将旧格式字符串文本转为双语格式
 */
export function normalizeQuestionText(text: any): QuestionText {
  if (typeof text === 'string') {
    return { en: text, zh: '' }
  }
  if (text && typeof text === 'object') {
    return {
      en: text.en || text.zh || '',
      zh: text.zh || ''
    }
  }
  return { en: '', zh: '' }
}
