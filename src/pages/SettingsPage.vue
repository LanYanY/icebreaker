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

// 响应式同步 formData —— 当 store 数据从数据库加载完成后更新表单
watch(() => settingStore.userSetting.defaultCategory, (val) => {
  formData.value.defaultCategory = val
})
watch(() => settingStore.userSetting.defaultDepth, (val) => {
  formData.value.defaultDepth = val
})
watch(() => settingStore.userSetting.defaultTone, (val) => {
  formData.value.defaultTone = val
})
watch(() => settingStore.userSetting.theme, (val) => {
  formData.value.theme = val
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
    </header>

    <!-- 通用设置 -->
    <section class="settings-card">
      <div class="card-header">
        <span class="card-icon">⚙️</span>
        <h2 class="card-title">General</h2>
      </div>

      <div class="card-body">
        <!-- 默认分类 -->
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-name">Default Category</span>
            <span class="setting-desc">Category used when drawing cards</span>
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
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-name">Default Depth</span>
            <span class="setting-desc">How deep the questions should be</span>
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
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-name">Default Tone</span>
            <span class="setting-desc">The style of the questions</span>
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
      </div>
    </section>

    <!-- 外观设置 -->
    <section class="settings-card">
      <div class="card-header">
        <span class="card-icon">🎨</span>
        <h2 class="card-title">Appearance</h2>
      </div>

      <div class="card-body">
        <!-- 主题切换 -->
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-name">Theme</span>
            <span class="setting-desc">App appearance mode</span>
          </div>
          <div class="theme-switcher">
            <button
              class="theme-btn"
              :class="{ active: formData.theme === 'light' }"
              @click="handleSaveSetting('theme', 'light'); formData.theme = 'light'"
            >
              <span class="theme-icon">☀️</span>
              <span class="theme-label">Light</span>
            </button>
            <button
              class="theme-btn"
              :class="{ active: formData.theme === 'auto' }"
              @click="handleSaveSetting('theme', 'auto'); formData.theme = 'auto'"
            >
              <span class="theme-icon">🔄</span>
              <span class="theme-label">Auto</span>
            </button>
            <button
              class="theme-btn"
              :class="{ active: formData.theme === 'dark' }"
              @click="handleSaveSetting('theme', 'dark'); formData.theme = 'dark'"
            >
              <span class="theme-icon">🌙</span>
              <span class="theme-label">Dark</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- AI 设置 -->
    <section class="settings-card">
      <div class="card-header">
        <span class="card-icon">🤖</span>
        <h2 class="card-title">AI Settings</h2>
      </div>

      <div class="card-body">
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
        <div v-if="currentProvider !== 'custom' && currentPreset?.models.length" class="setting-row">
          <div class="setting-info">
            <span class="setting-name">Model</span>
            <span class="setting-desc">Select the AI model to use</span>
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
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-name">API Base URL</span>
              <span class="setting-desc">OpenAI-compatible API endpoint</span>
            </div>
            <input
              type="text"
              v-model="formData.baseUrl"
              class="setting-input"
              placeholder="https://api.example.com/v1"
              @blur="handleSaveLLMConfig('baseUrl', formData.baseUrl)"
            >
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-name">Model Name</span>
              <span class="setting-desc">The model ID to use</span>
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
        <div class="setting-row api-key-row">
          <div class="setting-info">
            <span class="setting-name">API Key</span>
            <span class="setting-desc">{{ currentPreset?.apiKeyPlaceholder || 'Enter your API key' }}</span>
          </div>
          <div v-if="settingStore.hasApiKey()" class="api-key-status">
            <span class="status-badge">✓ Configured</span>
            <button class="status-clear" @click="handleClearApiKey">Clear</button>
          </div>
          <div v-else class="api-key-input-group">
            <input
              :type="showApiKey ? 'text' : 'password'"
              v-model="apiKeyInput"
              class="setting-input api-key-field"
              :placeholder="currentPreset?.apiKeyPlaceholder || 'sk-xxx...'"
            >
            <button class="api-key-toggle" @click="showApiKey = !showApiKey">
              {{ showApiKey ? '🙈' : '👁️' }}
            </button>
            <button class="api-key-save" @click="handleSaveApiKey">Save</button>
          </div>
        </div>

        <!-- 高级设置折叠 -->
        <button class="advanced-toggle" @click="showAdvanced = !showAdvanced">
          <span class="advanced-label">Advanced Settings</span>
          <span class="advanced-arrow" :class="{ open: showAdvanced }">›</span>
        </button>

        <transition name="slide-down">
          <div v-if="showAdvanced" class="advanced-settings">
            <!-- Temperature -->
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">Temperature</span>
                <span class="setting-desc">Controls randomness (0–2)</span>
              </div>
              <input
                type="number"
                v-model.number="formData.temperature"
                class="setting-input small"
                min="0"
                max="2"
                step="0.1"
                @blur="handleSaveLLMConfig('temperature', formData.temperature)"
              >
            </div>

            <!-- Max Tokens -->
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">Max Tokens</span>
                <span class="setting-desc">Maximum tokens to generate</span>
              </div>
              <input
                type="number"
                v-model.number="formData.maxTokens"
                class="setting-input small"
                min="50"
                max="500"
                @blur="handleSaveLLMConfig('maxTokens', formData.maxTokens)"
              >
            </div>

            <!-- 请求超时 -->
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">Request Timeout</span>
                <span class="setting-desc">API request timeout (ms)</span>
              </div>
              <input
                type="number"
                v-model.number="formData.timeoutMs"
                class="setting-input small"
                min="5000"
                max="30000"
                step="1000"
                @blur="handleSaveLLMConfig('timeoutMs', formData.timeoutMs)"
              >
            </div>

            <!-- 最大重试次数 -->
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">Max Retries</span>
                <span class="setting-desc">Number of retries on API failure</span>
              </div>
              <input
                type="number"
                v-model.number="formData.maxRetries"
                class="setting-input small"
                min="0"
                max="5"
                @blur="handleSaveLLMConfig('maxRetries', formData.maxRetries)"
              >
            </div>
          </div>
        </transition>
      </div>
    </section>

    <!-- 更多设置 -->
    <section class="settings-card">
      <div class="card-header">
        <span class="card-icon">🔧</span>
        <h2 class="card-title">More</h2>
      </div>

      <div class="card-body">
        <!-- 优先使用离线题库 -->
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-name">Offline Mode First</span>
            <span class="setting-desc">Use local question bank even if API is configured</span>
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
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-name">Send History to LLM</span>
            <span class="setting-desc">Send recent questions for deduplication</span>
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

        <!-- 关于页面入口 -->
        <router-link to="/about" class="setting-row about-row">
          <div class="setting-info">
            <span class="setting-name">About</span>
            <span class="setting-desc">Version, features, and credits</span>
          </div>
          <span class="about-arrow">›</span>
        </router-link>
      </div>
    </section>

    <!-- 数据管理 -->
    <section class="settings-card">
      <div class="card-header">
        <span class="card-icon">🗑️</span>
        <h2 class="card-title">Data Management</h2>
      </div>

      <div class="card-body">
        <div class="data-grid">
          <button class="data-btn" @click="showClearDialog('history')">
            <span class="data-btn-icon">📋</span>
            <span class="data-btn-text">Clear History</span>
          </button>
          <button class="data-btn" @click="showClearDialog('favorites')">
            <span class="data-btn-icon">❤️</span>
            <span class="data-btn-text">Clear Favorites</span>
          </button>
          <button class="data-btn" @click="showClearDialog('apiKey')">
            <span class="data-btn-icon">🔑</span>
            <span class="data-btn-text">Clear API Key</span>
          </button>
          <button class="data-btn danger" @click="handleResetSettings">
            <span class="data-btn-icon">🔄</span>
            <span class="data-btn-text">Reset to Defaults</span>
          </button>
        </div>
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
  padding-bottom: 100px;
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
}

/* ===== 卡片容器 ===== */
.settings-card {
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-xl);
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-light);
}

.card-icon {
  font-size: 18px;
}

.card-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text-primary);
}

.card-body {
  padding: 0 var(--spacing-lg);
}

/* ===== 设置行 ===== */
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--color-border-light);
  min-height: 56px;
}

.setting-row:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
  min-width: 0;
}

.setting-name {
  display: block;
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.setting-desc {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  line-height: 1.3;
}

/* ===== 表单控件 ===== */
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
  flex-shrink: 0;
  transition: border-color var(--duration-fast) ease;
}

.setting-input {
  width: 140px;
}

.setting-input.small {
  width: 80px;
  text-align: center;
}

.setting-select:focus,
.setting-input:focus {
  border-color: var(--color-accent-primary);
  outline: none;
}

/* ===== 开关 ===== */
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

input:checked + .switch-slider {
  background-color: var(--color-accent-primary);
}

input:checked + .switch-slider:before {
  transform: translateX(20px);
}

/* ===== 主题切换器 ===== */
.theme-switcher {
  display: flex;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.theme-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-primary);
  border: 2px solid var(--color-border);
  transition: all var(--duration-fast) ease;
}

.theme-btn:active {
  transform: scale(0.95);
}

.theme-btn.active {
  border-color: var(--color-accent-primary);
  background-color: rgba(232, 160, 191, 0.1);
}

.theme-icon {
  font-size: 16px;
}

.theme-label {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.theme-btn.active .theme-label {
  color: var(--color-accent-primary);
}

/* ===== 提供商选择 ===== */
.provider-section {
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--color-border-light);
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
  font-weight: 500;
}

.api-key-link:hover {
  text-decoration: underline;
}

/* ===== API Key ===== */
.api-key-row {
  flex-direction: column;
  align-items: stretch;
}

.api-key-input-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.api-key-field {
  flex: 1;
  width: auto;
  text-align: left;
}

.api-key-toggle {
  padding: var(--spacing-sm);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  flex-shrink: 0;
  transition: background-color var(--duration-fast) ease;
}

.api-key-toggle:active {
  background-color: var(--color-border-light);
}

.api-key-save {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-accent-primary);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: white;
  flex-shrink: 0;
  transition: opacity var(--duration-fast) ease;
}

.api-key-save:active {
  opacity: 0.8;
}

.api-key-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-sm);
}

.status-badge {
  font-size: var(--font-size-sm);
  color: var(--color-success);
  font-weight: 500;
}

.status-clear {
  font-size: var(--font-size-sm);
  color: var(--color-error);
  background: none;
  border: none;
  padding: 0;
  font-weight: 500;
}

/* ===== 高级设置 ===== */
.advanced-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--spacing-md) 0;
  border-top: 1px solid var(--color-border-light);
  margin-top: var(--spacing-sm);
}

.advanced-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.advanced-arrow {
  font-size: var(--font-size-lg);
  color: var(--color-text-tertiary);
  transition: transform var(--duration-normal) ease;
  transform: rotate(0deg);
}

.advanced-arrow.open {
  transform: rotate(90deg);
}

.advanced-settings {
  padding-bottom: var(--spacing-md);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all var(--duration-normal) ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 500px;
}

/* ===== 关于入口 ===== */
.about-row {
  text-decoration: none;
  cursor: pointer;
}

.about-row:active {
  opacity: 0.7;
}

.about-arrow {
  font-size: var(--font-size-xl);
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

/* ===== 数据管理 ===== */
.data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) 0;
}

.data-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: all var(--duration-fast) ease;
}

.data-btn:active {
  transform: scale(0.96);
  background-color: var(--color-border-light);
}

.data-btn-icon {
  font-size: 20px;
}

.data-btn-text {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-text-primary);
}

.data-btn.danger {
  border-color: var(--color-error);
}

.data-btn.danger .data-btn-text {
  color: var(--color-error);
}

.data-btn.danger:active {
  background-color: rgba(244, 67, 54, 0.08);
}

/* ===== 模态框 ===== */
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
  box-shadow: var(--shadow-xl);
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
