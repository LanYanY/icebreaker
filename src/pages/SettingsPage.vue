<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSettingStore } from '@/stores/settingStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { LLM_PROVIDER_PRESETS } from '@/types/llm'
import type { LLMProvider } from '@/types/llm'

const settingStore = useSettingStore()
const categoryStore = useCategoryStore()

// 应用主题
function applyTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme)
}

// 监听主题变化
watch(() => settingStore.userSetting.theme, (newTheme) => {
  applyTheme(newTheme)
})

onMounted(() => {
  applyTheme(settingStore.userSetting.theme)
})

const showAdvanced = ref(false)
const showClearConfirm = ref(false)
const clearType = ref<'history' | 'favorites' | 'apiKey' | 'all'>('all')

// 表单数据
const formData = ref({
  defaultCategory: settingStore.userSetting.defaultCategory,
  defaultDepth: settingStore.userSetting.defaultDepth,
  defaultTone: settingStore.userSetting.defaultTone,
  useOfflineFirst: settingStore.userSetting.useOfflineFirst,
  allowHistoryForDedup: settingStore.userSetting.allowHistoryForDedup,
  theme: settingStore.userSetting.theme,
  baseUrl: settingStore.llmConfig.baseUrl,
  model: settingStore.llmConfig.model,
  temperature: settingStore.llmConfig.temperature,
  maxTokens: settingStore.llmConfig.maxTokens,
  timeoutMs: settingStore.llmConfig.timeoutMs,
  maxRetries: settingStore.llmConfig.maxRetries
})

const apiKeyInput = ref('')
const showApiKey = ref(false)

// 当前选中的提供商
const currentProvider = computed(() => settingStore.llmConfig.provider || 'deepseek')

// 当前提供商的预设
const currentPreset = computed(() => LLM_PROVIDER_PRESETS.find(p => p.id === currentProvider.value))

// 切换提供商
async function handleSwitchProvider(provider: LLMProvider) {
  await settingStore.switchProvider(provider)
  // 更新表单数据
  formData.value.baseUrl = settingStore.llmConfig.baseUrl
  formData.value.model = settingStore.llmConfig.model
}

// 保存设置
async function handleSaveSetting(key: string, value: any) {
  await settingStore.saveUserSetting({ [key]: value })
}

// 保存LLM配置
async function handleSaveLLMConfig(key: string, value: any) {
  await settingStore.saveLLMConfig({ [key]: value })
}

// 保存API Key
async function handleSaveApiKey() {
  if (apiKeyInput.value.trim()) {
    await settingStore.saveApiKey(apiKeyInput.value.trim())
    apiKeyInput.value = ''
  }
}

// 清除API Key
async function handleClearApiKey() {
  await settingStore.clearApiKey()
}

// 清空数据
async function handleClearData() {
  if (clearType.value === 'apiKey') {
    await settingStore.clearApiKey()
  }
  // TODO: 实现清空历史记录和收藏
  showClearConfirm.value = false
}

// 恢复默认设置
async function handleResetSettings() {
  if (confirm('Are you sure you want to reset to default settings?')) {
    await settingStore.resetAllSettings()
    // 重置表单
    formData.value = {
      defaultCategory: settingStore.userSetting.defaultCategory,
      defaultDepth: settingStore.userSetting.defaultDepth,
      defaultTone: settingStore.userSetting.defaultTone,
      useOfflineFirst: settingStore.userSetting.useOfflineFirst,
      allowHistoryForDedup: settingStore.userSetting.allowHistoryForDedup,
      theme: settingStore.userSetting.theme,
      baseUrl: settingStore.llmConfig.baseUrl,
      model: settingStore.llmConfig.model,
      temperature: settingStore.llmConfig.temperature,
      maxTokens: settingStore.llmConfig.maxTokens,
      timeoutMs: settingStore.llmConfig.timeoutMs,
      maxRetries: settingStore.llmConfig.maxRetries
    }
  }
}

function showClearDialog(type: 'history' | 'favorites' | 'apiKey' | 'all') {
  clearType.value = type
  showClearConfirm.value = true
}
</script>

<template>
  <div class="settings-page">
    <!-- 页面标题 -->
    <header class="page-header">
      <h1 class="page-title">Settings</h1>
      <p class="page-subtitle">Configure your icebreaker cards</p>
    </header>
    
    <!-- 普通设置 -->
    <section class="settings-section">
      <h2 class="section-title">General</h2>
      
      <!-- 默认分类 -->
      <div class="setting-item">
        <div class="setting-label">
          <span class="label-text">Default Category</span>
          <span class="label-desc">Category used when drawing cards</span>
        </div>
        <select
          v-model="formData.defaultCategory"
          class="setting-select"
          @change="handleSaveSetting('defaultCategory', formData.defaultCategory)"
        >
          <option
            v-for="category in categoryStore.sortedCategories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.icon }} {{ category.name }}
          </option>
        </select>
      </div>
      
      <!-- 默认深度 -->
      <div class="setting-item">
        <div class="setting-label">
          <span class="label-text">Default Depth</span>
          <span class="label-desc">How deep the questions should be</span>
        </div>
        <select
          v-model="formData.defaultDepth"
          class="setting-select"
          @change="handleSaveSetting('defaultDepth', formData.defaultDepth)"
        >
          <option :value="1">Light</option>
          <option :value="2">Medium</option>
          <option :value="3">Deep</option>
        </select>
      </div>
      
      <!-- 默认语气 -->
      <div class="setting-item">
        <div class="setting-label">
          <span class="label-text">Default Tone</span>
          <span class="label-desc">The style of the questions</span>
        </div>
        <select
          v-model="formData.defaultTone"
          class="setting-select"
          @change="handleSaveSetting('defaultTone', formData.defaultTone)"
        >
          <option value="light">Light</option>
          <option value="formal">Formal</option>
          <option value="humorous">Humorous</option>
          <option value="warm">Warm</option>
        </select>
      </div>
      
      <!-- 主题切换 -->
      <div class="setting-item">
        <div class="setting-label">
          <span class="label-text">Theme</span>
          <span class="label-desc">App appearance mode</span>
        </div>
        <div class="theme-switcher">
          <button
            class="theme-btn"
            :class="{ active: formData.theme === 'light' }"
            @click="handleSaveSetting('theme', 'light'); formData.theme = 'light'"
          >☀️</button>
          <button
            class="theme-btn"
            :class="{ active: formData.theme === 'auto' }"
            @click="handleSaveSetting('theme', 'auto'); formData.theme = 'auto'"
          >🔄</button>
          <button
            class="theme-btn"
            :class="{ active: formData.theme === 'dark' }"
            @click="handleSaveSetting('theme', 'dark'); formData.theme = 'dark'"
          >🌙</button>
        </div>
      </div>
      
      <!-- 优先使用离线题库 -->
      <div class="setting-item">
        <div class="setting-label">
          <span class="label-text">Offline Mode First</span>
          <span class="label-desc">Use local question bank even if API is configured</span>
        </div>
        <label class="setting-switch">
          <input
            type="checkbox"
            v-model="formData.useOfflineFirst"
            @change="handleSaveSetting('useOfflineFirst', formData.useOfflineFirst)"
          >
          <span class="switch-slider"></span>
        </label>
      </div>
      
      <!-- 允许发送历史给LLM -->
      <div class="setting-item">
        <div class="setting-label">
          <span class="label-text">Send History to LLM</span>
          <span class="label-desc">Send recent questions to LLM for deduplication</span>
        </div>
        <label class="setting-switch">
          <input
            type="checkbox"
            v-model="formData.allowHistoryForDedup"
            @change="handleSaveSetting('allowHistoryForDedup', formData.allowHistoryForDedup)"
          >
          <span class="switch-slider"></span>
        </label>
      </div>
    </section>
    
    <!-- AI 设置 -->
    <section class="settings-section">
      <h2 class="section-title">🤖 AI Settings</h2>
      
      <!-- AI 提供商选择 -->
      <div class="provider-section">
        <div class="provider-grid">
          <button
            v-for="preset in LLM_PROVIDER_PRESETS"
            :key="preset.id"
            class="provider-card"
            :class="{ active: currentProvider === preset.id }"
            @click="handleSwitchProvider(preset.id)"
          >
            <span class="provider-icon">{{ preset.icon }}</span>
            <span class="provider-name">{{ preset.name }}</span>
            <span v-if="currentProvider === preset.id" class="provider-check">✓</span>
          </button>
        </div>
        
        <!-- 提供商描述 -->
        <div v-if="currentPreset" class="provider-info">
          <p class="provider-desc">{{ currentPreset.description }}</p>
          <a
            v-if="currentPreset.apiKeyUrl"
            :href="currentPreset.apiKeyUrl"
            target="_blank"
            class="api-key-link"
          >
            Get API Key →
          </a>
        </div>
      </div>
      
      <!-- 模型选择（仅非自定义提供商显示） -->
      <div v-if="currentProvider !== 'custom' && currentPreset?.models.length" class="setting-item">
        <div class="setting-label">
          <span class="label-text">Model</span>
          <span class="label-desc">Select the AI model to use</span>
        </div>
        <select
          v-model="formData.model"
          class="setting-select"
          @change="handleSaveLLMConfig('model', formData.model)"
        >
          <option
            v-for="model in currentPreset?.models"
            :key="model.id"
            :value="model.id"
          >
            {{ model.name }}
          </option>
        </select>
      </div>
      
      <!-- 自定义 API 配置（仅自定义提供商显示） -->
      <template v-if="currentProvider === 'custom'">
        <div class="setting-item">
          <div class="setting-label">
            <span class="label-text">API Base URL</span>
            <span class="label-desc">OpenAI-compatible API endpoint</span>
          </div>
          <input
            type="text"
            v-model="formData.baseUrl"
            class="setting-input"
            placeholder="https://api.example.com/v1"
            @blur="handleSaveLLMConfig('baseUrl', formData.baseUrl)"
          >
        </div>
        
        <div class="setting-item">
          <div class="setting-label">
            <span class="label-text">Model Name</span>
            <span class="label-desc">The model ID to use</span>
          </div>
          <input
            type="text"
            v-model="formData.model"
            class="setting-input"
            placeholder="gpt-4o-mini"
            @blur="handleSaveLLMConfig('model', formData.model)"
          >
        </div>
      </template>
      
      <!-- API Key -->
      <div class="setting-item api-key-item">
        <div class="setting-label">
          <span class="label-text">API Key</span>
          <span class="label-desc">{{ currentPreset?.apiKeyPlaceholder || 'Enter your API key' }}</span>
        </div>
        <div class="api-key-input-group">
          <input
            :type="showApiKey ? 'text' : 'password'"
            v-model="apiKeyInput"
            class="setting-input"
            :placeholder="currentPreset?.apiKeyPlaceholder || 'sk-xxx...'"
          >
          <button
            class="api-key-toggle"
            @click="showApiKey = !showApiKey"
          >
            {{ showApiKey ? '🙈' : '👁️' }}
          </button>
          <button
            class="api-key-save"
            @click="handleSaveApiKey"
          >
            Save
          </button>
        </div>
        <div v-if="settingStore.hasApiKey()" class="api-key-status">
          <span class="status-text">✓ Configured</span>
          <button
            class="clear-key-button"
            @click="handleClearApiKey"
          >
            Clear
          </button>
        </div>
      </div>
    </section>
    
    <!-- 高级设置 -->
    <section class="settings-section">
      <button
        class="section-toggle"
        @click="showAdvanced = !showAdvanced"
      >
        <h2 class="section-title">Advanced Settings</h2>
        <span class="toggle-arrow">{{ showAdvanced ? '▲' : '▼' }}</span>
      </button>
      
      <transition name="fade">
        <div v-if="showAdvanced" class="advanced-settings">
          <!-- Temperature -->
          <div class="setting-item">
            <div class="setting-label">
              <span class="label-text">Temperature</span>
              <span class="label-desc">Controls randomness (0-2)</span>
            </div>
            <input
              type="number"
              v-model.number="formData.temperature"
              class="setting-input"
              min="0"
              max="2"
              step="0.1"
              @blur="handleSaveLLMConfig('temperature', formData.temperature)"
            >
          </div>
          
          <!-- Max Tokens -->
          <div class="setting-item">
            <div class="setting-label">
              <span class="label-text">Max Tokens</span>
              <span class="label-desc">Maximum tokens to generate</span>
            </div>
            <input
              type="number"
              v-model.number="formData.maxTokens"
              class="setting-input"
              min="50"
              max="500"
              @blur="handleSaveLLMConfig('maxTokens', formData.maxTokens)"
            >
          </div>
          
          <!-- 请求超时 -->
          <div class="setting-item">
            <div class="setting-label">
              <span class="label-text">Request Timeout</span>
              <span class="label-desc">API request timeout in milliseconds</span>
            </div>
            <input
              type="number"
              v-model.number="formData.timeoutMs"
              class="setting-input"
              min="5000"
              max="30000"
              step="1000"
              @blur="handleSaveLLMConfig('timeoutMs', formData.timeoutMs)"
            >
          </div>
          
          <!-- 最大重试次数 -->
          <div class="setting-item">
            <div class="setting-label">
              <span class="label-text">Max Retries</span>
              <span class="label-desc">Number of retries on API failure</span>
            </div>
            <input
              type="number"
              v-model.number="formData.maxRetries"
              class="setting-input"
              min="0"
              max="5"
              @blur="handleSaveLLMConfig('maxRetries', formData.maxRetries)"
            >
          </div>
        </div>
      </transition>
    </section>
    
    <!-- 数据管理 -->
    <section class="settings-section">
      <h2 class="section-title">Data Management</h2>
      
      <div class="data-actions">
        <button
          class="action-button"
          @click="showClearDialog('history')"
        >
          Clear History
        </button>
        
        <button
          class="action-button"
          @click="showClearDialog('favorites')"
        >
          Clear Favorites
        </button>
        
        <button
          class="action-button"
          @click="showClearDialog('apiKey')"
        >
          Clear API Key
        </button>
        
        <button
          class="action-button danger"
          @click="handleResetSettings"
        >
          Reset to Defaults
        </button>
      </div>
    </section>
    
    <!-- 清空确认对话框 -->
    <teleport to="body">
      <div v-if="showClearConfirm" class="modal-overlay">
        <div class="modal-content">
          <h3 class="modal-title">确认清空</h3>
          <p class="modal-text">
            Are you sure you want to clear {{ clearType === 'history' ? 'history' : clearType === 'favorites' ? 'favorites' : clearType === 'apiKey' ? 'API key' : 'all data' }}? This cannot be undone.
          </p>
          <div class="modal-actions">
            <button
              class="modal-button cancel"
              @click="showClearConfirm = false"
            >
              Cancel
            </button>
            <button
              class="modal-button confirm"
              @click="handleClearData"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<style scoped>
.settings-page {
  padding: var(--spacing-lg);
  min-height: 100%;
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.settings-section {
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  border: 1px solid var(--color-border-light);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
}

.section-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  text-align: left;
  padding: 0;
  margin-bottom: var(--spacing-lg);
}

.toggle-arrow {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--color-border-light);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  flex: 1;
  min-width: 0;
}

.label-text {
  display: block;
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.label-desc {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.setting-select,
.setting-input {
  width: 120px;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  text-align: right;
}

.setting-input {
  width: 160px;
}

.setting-select:focus,
.setting-input:focus {
  border-color: var(--color-accent-primary);
  outline: none;
}

.setting-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 28px;
  flex-shrink: 0;
}

.setting-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-border);
  transition: var(--duration-normal);
  border-radius: var(--radius-full);
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: var(--duration-normal);
  border-radius: 50%;
}

input:checked + .switch-slider {
  background-color: var(--color-accent-primary);
}

input:checked + .switch-slider:before {
  transform: translateX(20px);
}

/* 提供商选择样式 */
.provider-section {
  margin-bottom: var(--spacing-lg);
}

.provider-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.provider-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background-color: var(--color-bg-primary);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: all var(--duration-fast) ease;
  position: relative;
}

.provider-card:active {
  transform: scale(0.95);
}

.provider-card.active {
  border-color: var(--color-accent-primary);
  background-color: rgba(232, 160, 191, 0.1);
}

.provider-icon {
  font-size: 24px;
}

.provider-name {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-text-primary);
}

.provider-check {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  background-color: var(--color-accent-primary);
  color: white;
  border-radius: 50%;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.provider-info {
  padding: var(--spacing-md);
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-lg);
}

.provider-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
}

.api-key-link {
  font-size: var(--font-size-sm);
  color: var(--color-accent-primary);
  text-decoration: none;
}

.api-key-link:hover {
  text-decoration: underline;
}

.api-key-item {
  flex-direction: column;
  align-items: flex-start;
}

.api-key-input-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  margin-top: var(--spacing-sm);
}

.api-key-input-group .setting-input {
  flex: 1;
  width: auto;
  text-align: left;
}

.api-key-toggle,
.api-key-save {
  padding: var(--spacing-sm);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  flex-shrink: 0;
}

.api-key-save {
  background-color: var(--color-accent-primary);
  border-color: var(--color-accent-primary);
  color: white;
}

.api-key-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.status-text {
  font-size: var(--font-size-sm);
  color: var(--color-success);
}

.clear-key-button {
  font-size: var(--font-size-sm);
  color: var(--color-error);
  background: none;
  border: none;
  padding: 0;
}

.advanced-settings {
  margin-top: var(--spacing-lg);
}

.data-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.action-button {
  width: 100%;
  padding: var(--spacing-md);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  transition: all var(--duration-fast) ease;
}

.action-button:active {
  transform: scale(0.98);
  background-color: var(--color-border-light);
}

.action-button.danger {
  color: var(--color-error);
  border-color: var(--color-error);
}

.action-button.danger:active {
  background-color: rgba(244, 67, 54, 0.1);
}

/* 主题切换器 */
.theme-switcher {
  display: flex;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.theme-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background-color: var(--color-bg-primary);
  border: 2px solid var(--color-border);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-fast) ease;
}

.theme-btn.active {
  border-color: var(--color-accent-primary);
  background-color: rgba(232, 160, 191, 0.15);
}

.theme-btn:active {
  transform: scale(0.9);
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-lg);
}

.modal-content {
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  max-width: 320px;
  width: 100%;
}

.modal-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.modal-text {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
}

.modal-button {
  flex: 1;
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: 500;
  transition: all var(--duration-fast) ease;
}

.modal-button.cancel {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

.modal-button.confirm {
  background-color: var(--color-error);
  border: 1px solid var(--color-error);
  color: white;
}

.modal-button:active {
  transform: scale(0.98);
}
</style>
