import { Filesystem, Directory } from '@capacitor/filesystem'
import { Capacitor, registerPlugin } from '@capacitor/core'

interface ApkInstallerPlugin {
  installApk(options: { path: string }): Promise<{ success: boolean }>
}

const ApkInstaller = registerPlugin<ApkInstallerPlugin>('ApkInstaller')

export interface DownloadProgress {
  type: 'downloading' | 'installing' | 'complete' | 'error'
  progress?: number
  message?: string
}

/**
 * 将 Uint8Array 转为 base64（避免栈溢出）
 */
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

/**
 * 下载 APK 并触发 Android 安装器
 * 支持多 URL 回退（Gitee → GitHub）
 */
export async function downloadAndInstallApk(
  urls: string[],
  onProgress?: (status: DownloadProgress) => void
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    window.open(urls[0], '_blank')
    return
  }

  let lastError: Error | null = null

  for (const url of urls) {
    try {
      await downloadFromUrl(url, onProgress)
      return // 成功则返回
    } catch (err: any) {
      console.warn(`[ApkInstall] Failed from ${url}:`, err.message)
      lastError = err
      // 继续尝试下一个 URL
    }
  }

  // 所有 URL 都失败
  throw lastError || new Error('All download sources failed')
}

async function downloadFromUrl(
  url: string,
  onProgress?: (status: DownloadProgress) => void
): Promise<void> {
  const apkFilename = `app-update-${Date.now()}.apk`

  onProgress?.({ type: 'downloading', progress: 0 })

  // 使用 XMLHttpRequest 支持更可靠的进度追踪和超时控制
  const apkBytes = await downloadWithXhr(url, (progress) => {
    onProgress?.({ type: 'downloading', progress })
  })

  onProgress?.({ type: 'downloading', progress: 100 })

  // 转为 base64 写入文件系统
  const base64 = uint8ToBase64(apkBytes)

  await Filesystem.writeFile({
    path: apkFilename,
    data: base64,
    directory: Directory.Cache,
  })

  onProgress?.({ type: 'installing' })

  // 获取原生文件路径用于 FileProvider
  const statResult = await Filesystem.stat({
    path: apkFilename,
    directory: Directory.Cache,
  })

  const nativePath = statResult.uri.replace('file://', '')

  // 触发 Android 安装器
  await ApkInstaller.installApk({ path: nativePath })

  onProgress?.({ type: 'complete' })
}

/**
 * 使用 XMLHttpRequest 下载文件（比 fetch 更可靠）
 */
function downloadWithXhr(
  url: string,
  onProgress?: (percent: number) => void
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url, true)
    xhr.responseType = 'arraybuffer'

    xhr.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100)
        onProgress(percent)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(new Uint8Array(xhr.response))
      } else {
        reject(new Error(`HTTP ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error'))
    xhr.ontimeout = () => reject(new Error('Timeout'))

    xhr.timeout = 120000 // 2 分钟超时
    xhr.send()
  })
}
