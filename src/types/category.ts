// 分类接口
export interface Category {
  id: string
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
  | 'random'           // Random
  | 'if_you_could'     // If You Could
  | 'would_you_rather' // Would You Rather
  | 'experiences'      // Experiences
  | 'life'             // Life
  | 'deep'             // Deep

// 默认分类配置
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'random',
    name: 'Random',
    description: '轻松、随机、不费力的问题，适合自然开场',
    icon: '🎲',
    color: 'var(--color-category-1)',
    sortOrder: 1,
    generationGuide: '轻松、随机、低压力、适合自然开场的问题'
  },
  {
    id: 'if_you_could',
    name: 'If You Could',
    description: '用假设问题打开想象力，轻松又容易聊开',
    icon: '✨',
    color: 'var(--color-category-2)',
    sortOrder: 2,
    generationGuide: '以"如果你可以……"为核心的假设类问题，轻松、有想象空间，适合发散聊天'
  },
  {
    id: 'would_you_rather',
    name: 'Would You Rather',
    description: '轻松二选一，适合快速回答和多人互动',
    icon: '⚖️',
    color: 'var(--color-category-3)',
    sortOrder: 3,
    generationGuide: '二选一偏好题，适合多人玩、快速回答、轻松互动'
  },
  {
    id: 'experiences',
    name: 'Experiences',
    description: '聊聊过去的经历、难忘的瞬间和有故事感的回忆',
    icon: '📖',
    color: 'var(--color-category-4)',
    sortOrder: 4,
    generationGuide: '围绕经历、回忆、故事、旅行、成长片段和难忘瞬间的问题，鼓励分享故事，但不要触碰创伤或过度隐私'
  },
  {
    id: 'life',
    name: 'Life',
    description: '聊聊生活状态、人生选择、价值观和真正重视的东西',
    icon: '🌿',
    color: 'var(--color-category-5)',
    sortOrder: 5,
    generationGuide: '围绕人生、价值观、生活状态、自我理解和未来期待的问题，有一定深度但不要太沉重'
  },
  {
    id: 'deep',
    name: 'Deep',
    description: '适合认真一点的交流，聊想法、感受和内心深处的东西',
    icon: '🔍',
    color: 'var(--color-category-6)',
    sortOrder: 6,
    generationGuide: '更深入的问题，围绕内心感受、自我认知、关系、成长和选择展开，适合熟一点之后聊，但不要像审问'
  }
]
