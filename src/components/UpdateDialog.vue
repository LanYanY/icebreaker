<script setup lang="ts">
import type { UpdateInfo } from '@/types/update'

defineProps<{
  show: boolean
  updateInfo: UpdateInfo | null
  currentVersion: string
  isDownloading?: boolean
  downloadProgress?: number
}>()

const emit = defineEmits<{
  download: []
  dismiss: []
  close: []
}>()
</script>

<template>
  <teleport to="body">
    <transition name="modal">
      <div v-if="show && updateInfo" class="modal-overlay" @click.self="!isDownloading && emit('close')">
        <div class="modal-content">
          <!-- 头部 -->
          <div class="update-header">
            <span class="update-icon">{{ isDownloading ? '📥' : '🎉' }}</span>
            <h3 class="update-title">{{ isDownloading ? '正在下载...' : '发现新版本' }}</h3>
          </div>

          <!-- 版本信息 -->
          <div v-if="!isDownloading" class="version-info">
            <span class="version-current">v{{ currentVersion }}</span>
            <span class="version-arrow">→</span>
            <span class="version-latest">v{{ updateInfo.version }}</span>
          </div>

          <!-- 下载进度 -->
          <div v-if="isDownloading" class="progress-section">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: (downloadProgress || 0) + '%' }"></div>
            </div>
            <span class="progress-text">{{ downloadProgress || 0 }}%</span>
          </div>

          <!-- Release Notes -->
          <div v-if="!isDownloading" class="release-notes">
            <p class="notes-label">更新内容</p>
            <div class="notes-content">{{ updateInfo.releaseNotes || '暂无更新说明' }}</div>
          </div>

          <!-- 来源标签 -->
          <div v-if="!isDownloading" class="source-tag">
            来源: {{ updateInfo.source === 'gitee' ? 'Gitee' : 'GitHub' }}
          </div>

          <!-- 操作按钮 -->
          <div class="modal-actions">
            <button
              v-if="!isDownloading"
              class="modal-button later"
              @click="emit('dismiss')"
            >
              稍后再说
            </button>
            <button
              v-if="!isDownloading"
              class="modal-button download"
              @click="emit('download')"
            >
              立即更新
            </button>
            <button
              v-if="isDownloading"
              class="modal-button download downloading"
              disabled
            >
              <span class="download-spinner"></span>
              下载中，请勿关闭...
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
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
  max-width: 340px;
  width: 100%;
  box-shadow: var(--shadow-xl);
}

.update-header {
  text-align: center;
  margin-bottom: var(--spacing-md);
}

.update-icon {
  font-size: 40px;
  display: block;
  margin-bottom: var(--spacing-sm);
}

.update-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
}

.version-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-lg);
}

.version-current {
  font-size: var(--font-size-base);
  color: var(--color-text-tertiary);
}

.version-arrow {
  font-size: var(--font-size-lg);
  color: var(--color-accent-primary);
}

.version-latest {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-accent-primary);
}

/* 下载进度 */
.progress-section {
  margin-bottom: var(--spacing-lg);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--spacing-sm);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-secondary));
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-align: center;
  display: block;
}

.release-notes {
  margin-bottom: var(--spacing-lg);
}

.notes-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
}

.notes-content {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
  max-height: 150px;
  overflow-y: auto;
  padding: var(--spacing-md);
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-md);
  white-space: pre-wrap;
  word-break: break-word;
}

.source-tag {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  text-align: center;
  margin-bottom: var(--spacing-lg);
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

.modal-button.later {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

.modal-button.download {
  background-color: var(--color-accent-primary);
  border: 1px solid var(--color-accent-primary);
  color: white;
}

.modal-button.downloading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  opacity: 0.8;
  cursor: not-allowed;
}

.download-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.modal-button:active:not(:disabled) {
  transform: scale(0.98);
}

/* 过渡动画 */
.modal-enter-active {
  transition: all var(--duration-normal) ease;
}

.modal-leave-active {
  transition: all var(--duration-normal) ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95);
}
</style>
