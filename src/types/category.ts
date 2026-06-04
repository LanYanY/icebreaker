// 分类接口
export interface Category {
  id: string
  name: string
  description: string
  icon?: string
  color?: string
  sortOrder: number
}

// 预定义的分类ID
export type CategoryId = 
  | 'light'      // 轻松开场
  | 'creative'   // 有趣脑洞
  | 'deep'       // 深入了解
  | 'emotion'    // 关系与情感
  | 'lifestyle'  // 生活偏好
  | 'team'       // 团队互动

// 默认分类配置
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'light',
    name: '轻松开场',
    description: '适合初次见面、朋友闲聊、日常开场',
    icon: '☕',
    color: 'var(--color-category-1)',
    sortOrder: 1
  },
  {
    id: 'creative',
    name: '有趣脑洞',
    description: '适合聚会、游戏、活跃气氛',
    icon: '💡',
    color: 'var(--color-category-2)',
    sortOrder: 2
  },
  {
    id: 'deep',
    name: '深入了解',
    description: '适合朋友之间、熟人之间进一步交流',
    icon: '🔍',
    color: 'var(--color-category-3)',
    sortOrder: 3
  },
  {
    id: 'emotion',
    name: '关系与情感',
    description: '适合约会、亲密关系、朋友之间的情感交流',
    icon: '💕',
    color: 'var(--color-category-4)',
    sortOrder: 4
  },
  {
    id: 'lifestyle',
    name: '生活偏好',
    description: '适合了解一个人的兴趣、习惯、审美和生活方式',
    icon: '🌿',
    color: 'var(--color-category-5)',
    sortOrder: 5
  },
  {
    id: 'team',
    name: '团队互动',
    description: '适合团队建设、小组活动、同学或同事互动',
    icon: '👥',
    color: 'var(--color-category-6)',
    sortOrder: 6
  }
]
