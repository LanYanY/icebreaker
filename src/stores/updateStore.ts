import { defineStore } from 'pinia'
import { ref } from 'vue'
import { checkForUpdate } from '@/services/updateService'
import { getSetting, setSetting } from '@/db'
import type { UpdateInfo } from '@/types/update'

const STORAGE_KEY_LAST_CHECK = 'update_last_check'
const STORAGE_KEY_DISMISSED = 'update_dismissed_version'
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 小时

export const useUpdateStore = defineStore('update', () => {
  // 状态
  const updateInfo = ref<UpdateInfo | null>(null)
  const isChecking = ref(false)
  const lastCheckTime = ref(0)
  const dismissedVersion = ref('')
  const currentVersion = ref('')

  /** 是否有可用更新（未被忽略的） */
  const hasUpdate = ref(false)

  /** 设置当前版本号 */
  function setCurrentVersion(version: string) {
    currentVersion.value = version
  }

  /** 从数据库加载持久化状态 */
  async function loadState() {
    try {
      const lastCheck = await getSetting(STORAGE_KEY_LAST_CHECK)
      if (lastCheck) lastCheckTime.value = Number(lastCheck) || 0

      const dismissed = await getSetting(STORAGE_KEY_DISMISSED)
      if (dismissed) dismissedVersion.value = dismissed
    } catch {
      // 静默失败
    }
  }

  /** 保存状态到数据库 */
  async function saveState() {
    try {
      await setSetting(STORAGE_KEY_LAST_CHECK, String(lastCheckTime.value))
      await setSetting(STORAGE_KEY_DISMISSED, dismissedVersion.value)
    } catch {
      // 静默失败
    }
  }

  /** 是否应该自动检查（距上次检查超过 24 小时） */
  function shouldAutoCheck(): boolean {
    return Date.now() - lastCheckTime.value > CHECK_INTERVAL_MS
  }

  /**
   * 检查更新
   * @param silent true = 静默检查（启动时），false = 手动检查（用户点击）
   */
  async function checkUpdate(silent = true): Promise<void> {
    if (isChecking.value) return
    if (!silent && !currentVersion.value) return

    // 静默模式下检查频率限制
    if (silent && !shouldAutoCheck()) return

    isChecking.value = true
    try {
      const result = await checkForUpdate(currentVersion.value)
      lastCheckTime.value = Date.now()
      await saveState()

      if (result) {
        // 如果用户已忽略此版本，不显示更新提示
        if (result.version === dismissedVersion.value) {
          updateInfo.value = null
          hasUpdate.value = false
        } else {
          updateInfo.value = result
          hasUpdate.value = true
        }
      } else {
        updateInfo.value = null
        hasUpdate.value = false
      }
    } catch (err) {
      console.warn('[UpdateStore] check failed:', err)
    } finally {
      isChecking.value = false
    }
  }

  /** 忽略此版本更新 */
  async function dismissUpdate() {
    if (updateInfo.value) {
      dismissedVersion.value = updateInfo.value.version
      await saveState()
    }
    updateInfo.value = null
    hasUpdate.value = false
  }

  /** 清除忽略状态（用于调试或用户主动再次检查） */
  async function clearDismissed() {
    dismissedVersion.value = ''
    await saveState()
  }

  return {
    updateInfo,
    isChecking,
    hasUpdate,
    currentVersion,
    lastCheckTime,
    dismissedVersion,
    setCurrentVersion,
    loadState,
    checkUpdate,
    dismissUpdate,
    clearDismissed,
    shouldAutoCheck,
  }
})
