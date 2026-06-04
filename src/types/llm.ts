// LLM配置接口
export interface LLMConfig {
  baseUrl: string
  model: string
  temperature: number
  maxTokens: number
  timeoutMs: number
  maxRetries: number
}

// 默认LLM配置
export const DEFAULT_LLM_CONFIG: LLMConfig = {
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-3.5-turbo',
  temperature: 0.8,
  maxTokens: 200,
  timeoutMs: 10000,
  maxRetries: 2
}

// LLM请求参数
export interface LLMRequestParams {
  category: string
  depth: number
  tone: string
  recentQuestions?: string[]
}

// LLM响应格式
export interface LLMResponse {
  question: string
  category: string
  depth: number
  tone: string
  tags: string[]
}
