import type { Category } from './category'

// 模式ID类型
export type ModeId = 'icebreaker' | 'intimacy'

// 模式主题配置
export interface ModeTheme {
  primary: string
  secondary: string
  background: string
  card: string
  accent: string
}

// App模式配置
export interface AppMode {
  id: ModeId
  name: string
  icon: string
  description: string
  theme: ModeTheme
  categoryIds: string[]
}

// 模式分类循环顺序
export const MODE_CATEGORY_CYCLE_ORDER: Record<ModeId, string[]> = {
  icebreaker: ['random', 'if_you_could', 'would_you_rather', 'experiences', 'life', 'deep'],
  intimacy: ['intimacy_random', 'past', 'about_you', 'intimacy_life', 'relationship', 'intimacy'],
}

// 获取下一个分类ID（模式内循环）
export function getNextCategoryId(mode: ModeId, currentCategoryId: string): string {
  const order = MODE_CATEGORY_CYCLE_ORDER[mode]
  const index = order.indexOf(currentCategoryId)
  const nextIndex = index >= 0 ? (index + 1) % order.length : 0
  return order[nextIndex]
}

// Icebreaker模式分类
export const ICEBREAKER_CATEGORIES: Category[] = [
  {
    id: 'random',
    mode: 'icebreaker',
    name: 'Random',
    description: 'Light, random, low-pressure questions for easy conversation',
    icon: '🎲',
    color: 'var(--color-category-1)',
    sortOrder: 1,
    generationGuide: 'General everyday conversation starters — about hobbies, preferences, opinions, daily life, fun facts, food, music, movies, etc. NOT hypothetical, NOT two-choice. Just simple open-ended questions anyone can answer naturally.',
  },
  {
    id: 'if_you_could',
    mode: 'icebreaker',
    name: 'If You Could',
    description: 'Hypothetical "If you could..." questions to spark imagination',
    icon: '✨',
    color: 'var(--color-category-2)',
    sortOrder: 2,
    generationGuide: 'Questions starting with "If you could..." — imaginative, fun, thought-provoking but light. Suitable for opening up topics.',
  },
  {
    id: 'would_you_rather',
    mode: 'icebreaker',
    name: 'Would You Rather',
    description: 'Fun two-choice questions, great for groups',
    icon: '⚖️',
    color: 'var(--color-category-3)',
    sortOrder: 3,
    generationGuide: 'Two-choice preference questions. Fun, engaging, suitable for group play and quick answers.',
  },
  {
    id: 'experiences',
    mode: 'icebreaker',
    name: 'Experiences',
    description: 'Share stories, travel, and memorable moments',
    icon: '📖',
    color: 'var(--color-category-4)',
    sortOrder: 4,
    generationGuide: 'Questions about experiences, memories, stories, travel, growth, and memorable moments. Encourage storytelling but avoid trauma or overly private topics.',
  },
  {
    id: 'life',
    mode: 'icebreaker',
    name: 'Life',
    description: 'Life choices, values, and what matters to you',
    icon: '🌿',
    color: 'var(--color-category-5)',
    sortOrder: 5,
    generationGuide: 'Questions about life, values, choices, self-understanding, and future hopes. Some depth but not too heavy.',
  },
  {
    id: 'deep',
    mode: 'icebreaker',
    name: 'Deep',
    description: 'Deeper conversations about feelings and inner thoughts',
    icon: '🔍',
    color: 'var(--color-category-6)',
    sortOrder: 6,
    generationGuide: 'Deeper questions about feelings, self-awareness, relationships, growth, and choices. Suitable for closer conversations.',
  },
]

// Intimacy模式分类
export const INTIMACY_CATEGORIES: Category[] = [
  {
    id: 'intimacy_random',
    mode: 'intimacy',
    name: 'Random',
    description: 'Warm, easy questions for gentle closeness',
    icon: '🎲',
    color: 'var(--color-category-1)',
    sortOrder: 1,
    generationGuide: 'Warm, gentle, low-pressure questions for couples, close friends, or people who already know each other. The question should feel easy to answer and help create closeness without becoming too serious.',
  },
  {
    id: 'past',
    mode: 'intimacy',
    name: 'Past',
    description: 'Questions about memories, growing up, and meaningful moments',
    icon: '🕰️',
    color: 'var(--color-category-2)',
    sortOrder: 2,
    generationGuide: 'Questions about memories, childhood, growing up, past experiences, meaningful moments, and things that shaped the person. Encourage storytelling, but avoid trauma, family pain, or overly private memories.',
  },
  {
    id: 'about_you',
    mode: 'intimacy',
    name: 'About You',
    description: 'Questions that help someone share who they are',
    icon: '🌷',
    color: 'var(--color-category-3)',
    sortOrder: 3,
    generationGuide: 'Questions that help someone share who they are, how they think, what they notice, what they enjoy, and what makes them feel understood. Keep it personal but not invasive.',
  },
  {
    id: 'intimacy_life',
    mode: 'intimacy',
    name: 'Life',
    description: 'Questions about life, values, dreams, and what matters',
    icon: '🌿',
    color: 'var(--color-category-4)',
    sortOrder: 4,
    generationGuide: 'Questions about life, values, dreams, routines, hopes, priorities, and the kind of life someone wants to build. The question may have depth but should remain warm and comfortable.',
  },
  {
    id: 'relationship',
    mode: 'intimacy',
    name: 'Relationship',
    description: 'Questions about connection, care, trust, and how two people relate',
    icon: '💞',
    color: 'var(--color-category-5)',
    sortOrder: 5,
    generationGuide: 'Questions about connection, care, trust, communication, appreciation, emotional support, and how two people relate to each other. Keep the tone gentle, respectful, and suitable for close conversation.',
  },
  {
    id: 'intimacy',
    mode: 'intimacy',
    name: 'Intimacy',
    description: 'Gentle questions about closeness, vulnerability, and emotional connection',
    icon: '💗',
    color: 'var(--color-category-6)',
    sortOrder: 6,
    generationGuide: 'Gentle questions about emotional closeness, vulnerability, affection, feeling safe, feeling understood, and meaningful connection. Do not make the question sexual, explicit, invasive, embarrassing, or overly heavy.',
  },
]

// 所有模式配置
export const APP_MODES: AppMode[] = [
  {
    id: 'icebreaker',
    name: 'Icebreaker',
    icon: '🧊',
    description: 'Light and easy conversation starters',
    theme: {
      primary: '#8DBDEB',
      secondary: '#D8EAFB',
      background: '#F4F9FF',
      card: '#FFFFFF',
      accent: '#A9C7E8',
    },
    categoryIds: ICEBREAKER_CATEGORIES.map(c => c.id),
  },
  {
    id: 'intimacy',
    name: 'Intimacy',
    icon: '💕',
    description: 'Warm questions for closer, more personal conversations',
    theme: {
      primary: '#E8A0BF',
      secondary: '#F8D8E8',
      background: '#FFF6FA',
      card: '#FFFFFF',
      accent: '#F2B8C6',
    },
    categoryIds: INTIMACY_CATEGORIES.map(c => c.id),
  },
]

// 所有分类（合并）
export const ALL_CATEGORIES: Category[] = [...ICEBREAKER_CATEGORIES, ...INTIMACY_CATEGORIES]

// 工具函数
export function getModeById(id: ModeId): AppMode | undefined {
  return APP_MODES.find(m => m.id === id)
}

export function getCategoriesForMode(mode: ModeId): Category[] {
  return ALL_CATEGORIES.filter(c => c.mode === mode)
}

export function isValidMode(mode: any): mode is ModeId {
  return mode === 'icebreaker' || mode === 'intimacy'
}

/**
 * 获取问题的模式（兼容旧数据）
 */
export function getQuestionMode(question: { mode?: ModeId }): ModeId {
  return isValidMode(question.mode) ? question.mode! : 'icebreaker'
}
