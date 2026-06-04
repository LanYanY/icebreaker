// LLM提供商类型
export type LLMProvider = 'deepseek' | 'openai' | 'zhipu' | 'qwen' | 'custom'

// LLM提供商预设
export interface LLMProviderPreset {
  id: LLMProvider
  name: string
  icon: string
  baseUrl: string
  models: Array<{ id: string; name: string }>
  defaultModel: string
  description: string
  apiKeyPlaceholder: string
  apiKeyUrl: string
}

// 内置提供商预设列表
export const LLM_PROVIDER_PRESETS: LLMProviderPreset[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '🔮',
    baseUrl: 'https://api.deepseek.com',
    models: [
      { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash（推荐）' },
      { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro（增强）' }
    ],
    defaultModel: 'deepseek-v4-flash',
    description: '国产大模型，性价比高，中文能力强',
    apiKeyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys'
  },
  {
    id: 'zhipu',
    name: '智谱清言',
    icon: '🧠',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: [
      { id: 'glm-4-flash', name: 'GLM-4 Flash（快速）' },
      { id: 'glm-4', name: 'GLM-4（标准）' },
      { id: 'glm-4-plus', name: 'GLM-4 Plus（增强）' }
    ],
    defaultModel: 'glm-4-flash',
    description: '智谱AI出品，中文理解能力强',
    apiKeyPlaceholder: 'xxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxx',
    apiKeyUrl: 'https://open.bigmodel.cn/usercenter/apikeys'
  },
  {
    id: 'qwen',
    name: '通义千问',
    icon: '🌟',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      { id: 'qwen-turbo', name: 'Qwen Turbo（快速）' },
      { id: 'qwen-plus', name: 'Qwen Plus（推荐）' },
      { id: 'qwen-max', name: 'Qwen Max（最强）' }
    ],
    defaultModel: 'qwen-turbo',
    description: '阿里云出品，多语言支持好',
    apiKeyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
    apiKeyUrl: 'https://dashscope.console.aliyun.com/apiKey'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🤖',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini（推荐）' },
      { id: 'gpt-4o', name: 'GPT-4o（标准）' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo（快速）' }
    ],
    defaultModel: 'gpt-4o-mini',
    description: 'OpenAI出品，需要科学上网',
    apiKeyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
    apiKeyUrl: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'custom',
    name: '自定义',
    icon: '⚙️',
    baseUrl: '',
    models: [],
    defaultModel: '',
    description: '使用自定义的OpenAI兼容API',
    apiKeyPlaceholder: '输入你的API Key',
    apiKeyUrl: ''
  }
]

// LLM配置接口
export interface LLMConfig {
  provider: LLMProvider
  baseUrl: string
  model: string
  temperature: number
  maxTokens: number
  timeoutMs: number
  maxRetries: number
}

// 默认LLM配置
export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'deepseek',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-v4-flash',
  temperature: 0.8,
  maxTokens: 200,
  timeoutMs: 15000,
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
