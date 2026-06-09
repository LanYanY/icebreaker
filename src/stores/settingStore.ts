import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserSetting } from '@/types/setting'
import { DEFAULT_USER_SETTING } from '@/types/setting'
import type { LLMConfig, LLMProvider } from '@/types/llm'
import { DEFAULT_LLM_CONFIG, LLM_PROVIDER_PRESETS } from '@/types/llm'
import * as db from '@/db'

export const useSettingStore = defineStore('setting', () => {
  // 状态
  const userSetting = ref<UserSetting>({ ...DEFAULT_USER_SETTING })
  const llmConfig = ref<LLMConfig>({ ...DEFAULT_LLM_CONFIG })
  const apiKey = ref<string>('')
  
  // 初始化设置
  async function initSettings() {
    try {
      // 从数据库加载用户设置
      const savedMode = await db.getSetting('currentMode')
      const savedCategory = await db.getSetting('defaultCategory')
      const savedDepth = await db.getSetting('defaultDepth')
      const savedTone = await db.getSetting('defaultTone')
      const savedUseOffline = await db.getSetting('useOfflineFirst')
      const savedAllowHistory = await db.getSetting('allowHistoryForDedup')
      const savedTheme = await db.getSetting('theme')
      
      if (savedMode) userSetting.value.currentMode = savedMode as UserSetting['currentMode']
      if (savedCategory) userSetting.value.defaultCategory = savedCategory
      if (savedDepth) userSetting.value.defaultDepth = parseInt(savedDepth)
      if (savedTone) userSetting.value.defaultTone = savedTone
      if (savedUseOffline) userSetting.value.useOfflineFirst = savedUseOffline === 'true'
      if (savedAllowHistory) userSetting.value.allowHistoryForDedup = savedAllowHistory === 'true'
      if (savedTheme) userSetting.value.theme = savedTheme as UserSetting['theme']
      
      // 从数据库加载LLM配置
      const savedProvider = await db.getSetting('llm_provider')
      const savedBaseUrl = await db.getSetting('llm_baseUrl')
      const savedModel = await db.getSetting('llm_model')
      const savedTemperature = await db.getSetting('llm_temperature')
      const savedMaxTokens = await db.getSetting('llm_maxTokens')
      const savedTimeoutMs = await db.getSetting('llm_timeoutMs')
      const savedMaxRetries = await db.getSetting('llm_maxRetries')
      
      if (savedProvider) llmConfig.value.provider = savedProvider as LLMProvider
      if (savedBaseUrl) llmConfig.value.baseUrl = savedBaseUrl
      if (savedModel) llmConfig.value.model = savedModel
      
      // 迁移旧的 DeepSeek 配置到新格式
      let needMigration = false
      if (llmConfig.value.baseUrl === 'https://api.deepseek.com/v1') {
        llmConfig.value.baseUrl = 'https://api.deepseek.com'
        needMigration = true
      }
      if (llmConfig.value.model === 'deepseek-chat') {
        llmConfig.value.model = 'deepseek-v4-flash'
        needMigration = true
      }
      if (llmConfig.value.model === 'deepseek-reasoner') {
        llmConfig.value.model = 'deepseek-v4-pro'
        needMigration = true
      }
      if (needMigration) {
        await db.setSetting('llm_baseUrl', llmConfig.value.baseUrl)
        await db.setSetting('llm_model', llmConfig.value.model)
        console.log('已迁移 DeepSeek 配置到新版格式')
      }
      if (savedTemperature) llmConfig.value.temperature = parseFloat(savedTemperature)
      if (savedMaxTokens) llmConfig.value.maxTokens = parseInt(savedMaxTokens)
      if (savedTimeoutMs) llmConfig.value.timeoutMs = parseInt(savedTimeoutMs)
      if (savedMaxRetries) llmConfig.value.maxRetries = parseInt(savedMaxRetries)
      
      // 从数据库加载API Key
      const savedApiKey = await db.getSetting('apiKey')
      if (savedApiKey) apiKey.value = savedApiKey
      
    } catch (err) {
      console.error('加载设置失败:', err)
    }
  }
  
  // 保存用户设置
  async function saveUserSetting(updates: Partial<UserSetting>) {
    Object.assign(userSetting.value, updates)
    
    // 保存到数据库
    for (const [key, value] of Object.entries(updates)) {
      await db.setSetting(key, String(value))
    }
  }
  
  // 保存LLM配置
  async function saveLLMConfig(updates: Partial<LLMConfig>) {
    Object.assign(llmConfig.value, updates)
    
    // 保存到数据库
    for (const [key, value] of Object.entries(updates)) {
      await db.setSetting(`llm_${key}`, String(value))
    }
  }
  
  // 切换LLM提供商
  async function switchProvider(provider: LLMProvider) {
    const preset = LLM_PROVIDER_PRESETS.find(p => p.id === provider)
    if (!preset) return
    
    llmConfig.value.provider = provider
    llmConfig.value.baseUrl = preset.baseUrl
    llmConfig.value.model = preset.defaultModel
    
    // 保存到数据库
    await db.setSetting('llm_provider', provider)
    await db.setSetting('llm_baseUrl', preset.baseUrl)
    await db.setSetting('llm_model', preset.defaultModel)
  }
  
  // 保存API Key
  async function saveApiKey(key: string) {
    apiKey.value = key
    // TODO: 使用Capacitor Secure Storage保存
    // 暂时保存到数据库
    await db.setSetting('apiKey', key)
  }
  
  // 清除API Key
  async function clearApiKey() {
    apiKey.value = ''
    // TODO: 从Capacitor Secure Storage删除
    await db.deleteSetting('apiKey')
  }
  
  // 重置所有设置
  async function resetAllSettings() {
    userSetting.value = { ...DEFAULT_USER_SETTING }
    llmConfig.value = { ...DEFAULT_LLM_CONFIG }
    apiKey.value = ''
    
    // 清除数据库中的设置
    await db.deleteSetting('currentMode')
    await db.deleteSetting('defaultCategory')
    await db.deleteSetting('defaultDepth')
    await db.deleteSetting('defaultTone')
    await db.deleteSetting('useOfflineFirst')
    await db.deleteSetting('allowHistoryForDedup')
    await db.deleteSetting('theme')
    await db.deleteSetting('llm_provider')
    await db.deleteSetting('llm_baseUrl')
    await db.deleteSetting('llm_model')
    await db.deleteSetting('llm_temperature')
    await db.deleteSetting('llm_maxTokens')
    await db.deleteSetting('llm_timeoutMs')
    await db.deleteSetting('llm_maxRetries')
    await db.deleteSetting('apiKey')
  }
  
  // 检查是否配置了API Key
  const hasApiKey = () => apiKey.value.length > 0
  
  return {
    userSetting,
    llmConfig,
    apiKey,
    initSettings,
    saveUserSetting,
    saveLLMConfig,
    switchProvider,
    saveApiKey,
    clearApiKey,
    resetAllSettings,
    hasApiKey
  }
})
