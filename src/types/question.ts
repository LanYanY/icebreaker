// 问题来源类型
export type QuestionSource = 'llm' | 'offline'

// 问题接口
export interface Question {
  id: string
  text: string
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
  text: string
  category: string
  depth: number
  tone: string
  tags: string[]
  source: QuestionSource
}
