import type { ModeId } from './mode'

// 用户设置接口
export interface UserSetting {
  currentMode: ModeId
  defaultCategory: string
  defaultDepth: number
  defaultTone: string
  useOfflineFirst: boolean
  allowHistoryForDedup: boolean
  theme: 'light' | 'dark' | 'auto'
}

// 默认用户设置
export const DEFAULT_USER_SETTING: UserSetting = {
  currentMode: 'icebreaker',
  defaultCategory: 'random',
  defaultDepth: 1,
  defaultTone: 'light',
  useOfflineFirst: false,
  allowHistoryForDedup: true,
  theme: 'auto'
}
