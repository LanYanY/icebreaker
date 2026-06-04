import type { LLMConfig, LLMRequestParams, LLMResponse } from '@/types/llm'
import { useSettingStore } from '@/stores/settingStore'

/**
 * LLM服务
 * 负责调用用户配置的LLM API生成问题
 */
export class LLMService {
  private config: LLMConfig
  private apiKey: string

  constructor(config: LLMConfig, apiKey: string) {
    this.config = config
    this.apiKey = apiKey
  }

  /**
   * 生成问题
   */
  async generateQuestion(params: LLMRequestParams): Promise<LLMResponse> {
    const prompt = this.buildPrompt(params)
    
    const response = await this.callAPI(prompt)
    const parsed = this.parseResponse(response)
    
    return parsed
  }

  /**
   * 构建Prompt
   */
  private buildPrompt(params: LLMRequestParams): string {
    const { category, depth, tone, recentQuestions } = params
    
    // 分类生成方向映射
    const categoryGuides: Record<string, string> = {
      'random': '轻松、随机、低压力、适合自然开场的问题',
      'if_you_could': '以\"If you could...\"开头或类似结构的假设类问题，轻松、有想象空间，适合发散聊天',
      'would_you_rather': '\"Would you rather...\"结构的二选一偏好题，适合多人玩、快速回答、轻松互动。问题应轻松、有趣、没有压力',
      'experiences': '围绕经历、回忆、故事、旅行、成长片段和难忘瞬间的问题，鼓励分享故事，但不要触碰创伤或过度隐私',
      'life': '围绕人生、价值观、生活状态、自我理解和未来期待的问题，有一定深度但不要太沉重',
      'deep': '更深入的问题，围绕内心感受、自我认知、关系、成长和选择展开，适合熟一点之后聊，但不要像审问'
    }
    
    const categoryGuide = categoryGuides[category] || '适合聊天使用的开场问题'
    
    let prompt = `You are an icebreaker question card generator.

Generate one conversation-starter question based on the following criteria.

category: ${category}
depth: ${depth}
tone: ${tone}

generation direction: ${categoryGuide}

rules:
1. The question should be short, natural, and easy to say out loud.
2. Do not make it too formal or stiff.
3. Avoid topics like politics, religion, income, illness, sexual experiences, or family trauma.
4. Do not generate anything offensive, embarrassing, or overly personal.
5. Return ONLY valid JSON, no explanation.
6. The question should be in English.
7. The "category" field in the JSON must be the category id: ${category}`

    // 添加最近历史用于去重
    if (recentQuestions && recentQuestions.length > 0) {
      prompt += `\n\nrecent questions (avoid generating similar ones):\n${recentQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    }

    prompt += `\n\nreturn format:
{
  "question": "...",
  "category": "${category}",
  "depth": ${depth},
  "tone": "...",
  "tags": ["...", "..."]
}`

    return prompt
  }

  /**
   * 调用API
   */
  private async callAPI(prompt: string): Promise<string> {
    const url = `${this.config.baseUrl}/chat/completions`
    console.log('LLM请求URL:', url, '模型:', this.config.model)
    
    const body: Record<string, unknown> = {
      model: this.config.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      // DeepSeek V4 默认启用思考模式，生成短文本时禁用以节省 token
      thinking: { type: 'disabled' }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API请求失败: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      console.log('LLM响应:', JSON.stringify(data).substring(0, 500))
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('API返回格式错误')
      }

      return data.choices[0].message.content
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('API请求超时')
      }
      
      throw error
    }
  }

  /**
   * 解析响应
   */
  private parseResponse(response: string): LLMResponse {
    try {
      // 尝试直接解析JSON
      return JSON.parse(response)
    } catch {
      // 尝试提取JSON代码块
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1].trim())
        } catch {
          // 继续尝试其他方式
        }
      }

      // 尝试提取第一个JSON对象
      const objectMatch = response.match(/\{[\s\S]*\}/)
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0])
        } catch {
          // 继续尝试其他方式
        }
      }

      throw new Error('无法解析API响应')
    }
  }
}

/**
 * 创建LLM服务实例
 */
export function createLLMService(): LLMService | null {
  const settingStore = useSettingStore()
  
  if (!settingStore.hasApiKey()) {
    return null
  }

  return new LLMService(
    settingStore.llmConfig,
    settingStore.apiKey
  )
}
