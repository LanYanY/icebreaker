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
    
    let prompt = `你是一个开场白卡牌生成器。

请根据以下条件生成 1 个适合聊天使用的开场问题。

分类：${category}
深度：${depth}
语气：${tone}

要求：
1. 问题必须简短自然，适合直接说出口；
2. 不要太正式；
3. 不要涉及隐私、收入、政治、宗教、疾病、性经历等敏感内容；
4. 不要生成攻击性、冒犯性或让人尴尬的问题；
5. 只返回 JSON，不要输出解释文字。`

    // 添加最近历史用于去重
    if (recentQuestions && recentQuestions.length > 0) {
      prompt += `\n\n最近已出现的问题（请避免生成相似的问题）：
${recentQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    }

    prompt += `\n\n返回格式：
{
  "question": "...",
  "category": "...",
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
