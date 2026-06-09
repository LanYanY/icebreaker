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
    const { mode, category, depth, tone, recentQuestions } = params
    
    // 分类生成方向映射
    const categoryGuides: Record<string, string> = {
      // Icebreaker categories
      'random': 'General everyday conversation starters — about hobbies, preferences, opinions, daily life, fun facts, food, music, movies, etc. NOT hypothetical, NOT two-choice. Just simple open-ended questions anyone can answer naturally.',
      'if_you_could': 'Hypothetical questions in an "If you could..." style — imaginative, fun, thought-provoking but light.',
      'would_you_rather': 'Two-choice preference questions in "Would you rather..." style — fun, engaging, suitable for quick answers.',
      'experiences': 'Questions about experiences, memories, stories, travel, growth, and memorable moments.',
      'life': 'Questions about life, values, choices, self-understanding, and future hopes.',
      'deep': 'Deeper questions about feelings, self-awareness, relationships, growth, and choices.',
      
      // Intimacy categories
      'intimacy_random': 'Warm, gentle, low-pressure questions for couples, close friends, or people who already know each other. The question should feel easy to answer and help create closeness without becoming too serious.',
      'past': 'Questions about memories, childhood, growing up, past experiences, meaningful moments, and things that shaped the person. Encourage storytelling, but avoid trauma, family pain, or overly private memories.',
      'about_you': 'Questions that help someone share who they are, how they think, what they notice, what they enjoy, and what makes them feel understood. Keep it personal but not invasive.',
      'intimacy_life': 'Questions about life, values, dreams, routines, hopes, priorities, and the kind of life someone wants to build. The question may have depth but should remain warm and comfortable.',
      'relationship': 'Questions about connection, care, trust, communication, appreciation, emotional support, and how two people relate to each other. Keep the tone gentle, respectful, and suitable for close conversation.',
      'intimacy': 'Gentle questions about emotional closeness, vulnerability, affection, feeling safe, feeling understood, and meaningful connection. Do not make the question sexual, explicit, invasive, embarrassing, or overly heavy.',
    }
    
    const categoryGuide = categoryGuides[category] || 'Light, random, low-pressure questions for easy and natural conversation starters'
    
    // 模式特定指令
    const modeName = mode === 'intimacy' ? 'Intimacy' : 'Icebreaker'
    let modeInstructions = ''
    if (mode === 'intimacy') {
      modeInstructions = `
mode-specific rules for Intimacy mode:
- Keep the question warm, gentle, emotionally close, and respectful.
- The question should feel safe and comfortable to answer.
- Focus on emotional intimacy, trust, affection, vulnerability, and connection.
- Do NOT generate sexual, explicit, invasive, embarrassing, or overly heavy questions.
- The tone should be like a warm, caring conversation between people who care about each other.`
    }
    
    let prompt = `You are a conversation question card generator for the "${modeName}" mode.

Generate one conversation-starter question based on the following criteria.

mode: ${mode}
category: ${category}
depth: ${depth}
tone: ${tone}

generation direction: ${categoryGuide}
${modeInstructions}

rules:
1. The question should be short, natural, and easy to say out loud.
2. Do not make it too formal or stiff.
3. Avoid topics like politics, religion, income, illness, sexual experiences, or family trauma.
4. Do not generate anything offensive, embarrassing, judgmental, or overly personal.
5. Return ONLY valid JSON, no explanation.
6. The question must be bilingual: English in question.en, Chinese in question.zh.
7. The English version is the primary question.
8. The Chinese version should be natural, conversational Chinese (not stiff translation).
9. Tags should be lowercase English, 2-5 tags.
10. depth: 1 = light, 2 = medium, 3 = deep.
11. tone: match the requested tone.
12. mode must be exactly "${mode}".
13. category must be exactly "${category}".
14. For random (icebreaker mode), do NOT use "If you could...", "Would you rather...", or "What if..." structures. Use simple direct questions like "What...", "Do you...", "Have you ever...", "What's your favorite...", "Do you prefer..." etc.`

    // 添加最近历史用于去重（非空时才添加）
    if (recentQuestions && recentQuestions.length > 0) {
      prompt += `\n\nrecent questions (avoid generating similar ones):\n${recentQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    }

    prompt += `\n\nReturn format:\n{\n  "mode": "${mode}",\n  "question": { "en": "...", "zh": "..." },\n  "category": "${category}",\n  "depth": ${depth},\n  "tone": "${tone}",\n  "tags": ["...", "..."]\n}`

    return prompt
  }

  /**
   * 调用API
   */
  private async callAPI(prompt: string): Promise<string> {
    const { baseUrl, model, temperature, maxTokens, timeoutMs } = this.config

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: maxTokens,
        thinking: { type: 'disabled' }
      }),
      signal: AbortSignal.timeout(timeoutMs)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid API response format')
    }

    return data.choices[0].message?.content || ''
  }

  /**
   * 解析响应
   */
  private parseResponse(response: string): LLMResponse {
    try {
      const tryParse = (jsonStr: string): LLMResponse => {
        const parsed = JSON.parse(jsonStr)
        
        // 验证必要字段
        if (!parsed.question) {
          throw new Error('Missing question field')
        }
        
        return {
          mode: parsed.mode || 'icebreaker',
          question: parsed.question,
          category: parsed.category || '',
          depth: parsed.depth || 1,
          tone: parsed.tone || 'light',
          tags: Array.isArray(parsed.tags) ? parsed.tags : []
        }
      }

      // 直接尝试解析
      try {
        return tryParse(response.trim())
      } catch {
        // 尝试提取JSON
        const objectMatch = response.match(/\{[\s\S]*\}/)
        if (objectMatch) {
          try {
            return tryParse(objectMatch[0])
          } catch {
            // continue
          }
        }

        throw new Error('无法解析API响应')
      }
    } catch (err) {
      throw new Error(`Parse error: ${err instanceof Error ? err.message : String(err)}`)
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
