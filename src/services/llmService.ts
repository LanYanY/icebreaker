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
      'random': 'General everyday conversation starters — about hobbies, preferences, opinions, daily life, fun facts, food, music, movies, etc. NOT hypothetical, NOT two-choice. Just simple open-ended questions anyone can answer naturally.',
      'if_you_could': 'Hypothetical questions in an "If you could..." style, imaginative, light, and easy to expand on',
      'would_you_rather': 'Clear two-choice "Would you rather..." questions, light, fun, low-pressure, and suitable for groups',
      'experiences': 'Questions about experiences, memories, stories, travel, growth moments, and meaningful small events',
      'life': 'Questions about life, values, lifestyle, self-understanding, future hopes, and what matters to someone',
      'deep': 'Deeper but gentle questions about inner feelings, self-awareness, relationships, growth, and choices'
    }
    
    const categoryGuide = categoryGuides[category] || 'Light, random, low-pressure questions for easy and natural conversation starters'
    
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
4. Do not generate anything offensive, embarrassing, judgmental, or overly personal.
5. Return ONLY valid JSON, no explanation.
6. The question should be in English.
7. The "category" field in the JSON must be the category id: ${category}
8. The "tone" field in the JSON must match the requested tone: ${tone}
9. The "tags" field should contain 2 to 4 short lowercase English tags.
10. Do not repeat or closely rephrase any recent questions.
11. If recent questions are empty, ignore the recent questions section.
12. Keep the question suitable for casual real-life conversation.
13. Do not make the question sound like therapy, an interview, or a personality test.
14. For "if_you_could", prefer an "If you could..." style question.
15. For "would_you_rather", use a clear "Would you rather..." two-choice structure.
16. For "random", do NOT use "If you could...", "Would you rather...", or "What if..." structures. Use simple direct questions like "What...", "Do you...", "Have you ever...", "What's your favorite...", "Do you prefer..." etc.`

    // 添加最近历史用于去重（非空时才添加）
    if (recentQuestions && recentQuestions.length > 0) {
      prompt += `\n\nrecent questions (avoid generating similar ones):\n${recentQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    }

    prompt += `\n\nreturn format:
{
  "question": "...",
  "category": "${category}",
  "depth": ${depth},
  "tone": "${tone}",
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
