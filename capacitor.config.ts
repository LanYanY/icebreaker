import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.example.icebreaker',
  appName: '开场白',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Clipboard: {
      // 配置剪贴板插件
    },
    Share: {
      // 配置分享插件
    },
    Network: {
      // 配置网络检测插件
    },
    Preferences: {
      // 配置偏好存储插件
    }
  }
}

export default config
