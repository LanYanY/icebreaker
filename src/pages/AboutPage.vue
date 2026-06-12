<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { App } from '@capacitor/app'
import { useUpdateStore } from '@/stores/updateStore'
import { downloadAndInstallApk } from '@/services/apkInstallService'
import UpdateDialog from '@/components/UpdateDialog.vue'

const updateStore = useUpdateStore()
const appVersion = ref('1.0.0')
const showUpdateDialog = ref(false)
const isDownloading = ref(false)
const downloadProgress = ref(0)
const toastMessage = ref('')
const showToast = ref(false)

onMounted(async () => {
  try {
    const info = await App.getInfo()
    appVersion.value = info.version || '1.0.0'
    updateStore.setCurrentVersion(appVersion.value)
    // 加载持久化状态
    await updateStore.loadState()
  } catch {
    // web fallback
    appVersion.value = '1.0.0'
  }
})

/** 检查更新 */
async function handleCheckUpdate() {
  await updateStore.checkUpdate(false)

  if (updateStore.hasUpdate && updateStore.updateInfo) {
    showUpdateDialog.value = true
  } else {
    showToastMsg('已是最新版本 ✓')
  }
}

/** 下载并安装更新 */
async function handleDownload() {
  if (!updateStore.updateInfo?.downloadUrl) return

  isDownloading.value = true
  downloadProgress.value = 0

  try {
    await downloadAndInstallApk(updateStore.updateInfo.downloadUrl, (status) => {
      if (status.type === 'downloading') {
        downloadProgress.value = status.progress || 0
      } else if (status.type === 'installing') {
        showToastMsg('正在打开安装器...')
      }
    })
    showUpdateDialog.value = false
  } catch (err) {
    console.warn('[About] Download/install failed:', err)
    showToastMsg('下载失败，请稍后重试')
  } finally {
    isDownloading.value = false
  }
}

/** 忽略更新 */
async function handleDismiss() {
  await updateStore.dismissUpdate()
  showUpdateDialog.value = false
}

function showToastMsg(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 2000)
}
</script>

<template>
  <div class="about-page">
    <header class="page-header">
      <h1 class="page-title">关于</h1>
    </header>

    <div class="about-content">
      <!-- App Info -->
      <div class="about-card app-info">
        <div class="app-icon">🎴</div>
        <h2 class="app-name">开场白</h2>
        <p class="app-slogan">一张卡，打开一个话题</p>
        <div class="version-row">
          <span class="app-version">v{{ appVersion }}</span>
          <span class="version-dot">·</span>
          <button
            class="update-btn"
            :class="{ 'has-update': updateStore.hasUpdate }"
            :disabled="updateStore.isChecking"
            @click="handleCheckUpdate"
          >
            <span v-if="updateStore.isChecking" class="update-spinner"></span>
            <template v-else-if="updateStore.hasUpdate && updateStore.updateInfo">
              🆕 v{{ updateStore.updateInfo.version }}
            </template>
            <template v-else>
              检查更新
            </template>
          </button>
        </div>
      </div>

      <!-- Description -->
      <div class="about-card">
        <h3 class="card-title">关于应用</h3>
        <p class="card-text">
          开场白是一款个人自用的破冰话题卡牌应用。通过抽卡的形式，帮助你在社交场合中自然地开启对话。
          支持 AI 生成和离线题库两种模式，涵盖多种话题分类，从轻松闲聊到深度交流。
        </p>
      </div>

      <!-- Features -->
      <div class="about-card">
        <h3 class="card-title">功能特点</h3>
        <ul class="feature-list">
          <li>🎲 6 大话题分类，覆盖不同场景</li>
          <li>🤖 AI 智能生成，千变万化不重复</li>
          <li>📚 120+ 离线题库，无需联网即可使用</li>
          <li>🔄 分类循环模式，自动轮换话题</li>
          <li>📤 分享精美卡片图片</li>
          <li>🌙 深色模式支持</li>
          <li>🔔 版本更新检测</li>
        </ul>
      </div>

      <!-- Tech Stack -->
      <div class="about-card">
        <h3 class="card-title">技术栈</h3>
        <div class="tech-tags">
          <span class="tech-tag">Vue 3</span>
          <span class="tech-tag">TypeScript</span>
          <span class="tech-tag">Vite</span>
          <span class="tech-tag">Capacitor</span>
          <span class="tech-tag">Pinia</span>
          <span class="tech-tag">Dexie.js</span>
        </div>
      </div>

      <!-- Rights -->
      <div class="about-card">
        <h3 class="card-title">权利信息</h3>
        <p class="card-text">
          本应用为个人自用工具，不收集任何用户数据。
          所有问题内容由 AI 生成或来自离线题库，仅供娱乐参考。
          用户配置的 API Key 仅存储在本地设备，不会上传至任何服务器。
        </p>
      </div>

      <!-- Copyright -->
      <div class="copyright">
        <p>© 2026 开场白 Opening Line</p>
        <p class="copyright-sub">Personal Use Only · Made with ❤️</p>
      </div>
    </div>

    <!-- 更新对话框 -->
    <UpdateDialog
      :show="showUpdateDialog"
      :update-info="updateStore.updateInfo"
      :current-version="appVersion"
      :is-downloading="isDownloading"
      :download-progress="downloadProgress"
      @download="handleDownload"
      @dismiss="handleDismiss"
      @close="showUpdateDialog = false"
    />

    <!-- Toast -->
    <teleport to="body">
      <transition name="fade">
        <div v-if="showToast" class="toast-message">{{ toastMessage }}</div>
      </transition>
    </teleport>
  </div>
</template>

<style scoped>
.about-page {
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
}

.about-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.about-card {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border-light);
}

.app-info {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
}

.app-icon {
  font-size: 56px;
  margin-bottom: var(--spacing-md);
}

.app-name {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.app-slogan {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-md);
}

.version-row {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.app-version {
  font-size: var(--font-size-xs);
  color: var(--color-accent-primary);
  background-color: rgba(232, 160, 191, 0.1);
  padding: 4px 12px;
  border-radius: var(--radius-full);
}

.version-dot {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}

/* 更新按钮 */
.update-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-text-secondary);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  transition: all var(--duration-fast) ease;
}

.update-btn:active {
  transform: scale(0.96);
}

.update-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.update-btn.has-update {
  color: var(--color-accent-primary);
  border-color: var(--color-accent-primary);
  background-color: rgba(232, 160, 191, 0.1);
  font-weight: 600;
}

/* 加载动画 */
.update-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.card-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.card-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border-light);
}

.feature-list li:last-child {
  border-bottom: none;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.tech-tag {
  font-size: var(--font-size-xs);
  color: var(--color-accent-primary);
  background-color: rgba(232, 160, 191, 0.1);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-weight: 500;
}

.copyright {
  text-align: center;
  padding: var(--spacing-xl) 0;
}

.copyright p {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.copyright-sub {
  font-size: var(--font-size-xs) !important;
  margin-top: var(--spacing-xs);
  opacity: 0.6;
}

/* Toast */
.toast-message {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--color-text-primary);
  color: var(--color-bg-primary);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-full);
  z-index: 1001;
  box-shadow: var(--shadow-lg);
}
</style>
