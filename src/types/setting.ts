// 用户设置接口
export interface UserSetting {
  defaultCategory: string
  defaultDepth: number
  defaultTone: string
  useOfflineFirst: boolean
  allowHistoryForDedup: boolean
  theme: 'light' | 'dark' | 'system'
}

// 默认用户设置
export const DEFAULT_USER_SETTING: UserSetting = {
  defaultCategory: 'light',
  defaultDepth: 1,
  defaultTone: '轻松',
  useOfflineFirst: false,
  allowHistoryForDedup: true,
  theme: 'light'
}
