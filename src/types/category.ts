import type { ModeId } from './mode'

// 分类接口
export interface Category {
  id: string
  mode: ModeId
  name: string
  description: string
  icon?: string
  color?: string
  sortOrder: number
  // 生成方向（用于LLM Prompt）
  generationGuide?: string
}

// 预定义的分类ID
export type CategoryId = 
  | 'random'
  | 'if_you_could'
  | 'would_you_rather'
  | 'experiences'
  | 'life'
  | 'deep'
  | 'intimacy_random'
  | 'past'
  | 'about_you'
  | 'intimacy_life'
  | 'relationship'
  | 'intimacy'
