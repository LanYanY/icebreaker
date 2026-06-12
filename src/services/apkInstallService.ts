import { Capacitor, registerPlugin } from '@capacitor/core'

interface ApkInstallerPlugin {
  installApk(options: { path: string }): Promise<{ success: boolean }>
}

interface ApkDownloaderPlugin {
  download(options: { url: string; filename: string }): Promise<{ success: boolean; path: string; size: number }>
  cancel(): Promise<{ success: boolean }>
  addListener(eventName: string, handler: (data: any) => void): { remove(): void }
}

const ApkInstaller = registerPlugin<ApkInstallerPlugin>('ApkInstaller')
const ApkDownloader = registerPlugin<ApkDownloaderPlugin>('ApkDownloader')

export interface DownloadProgress {
  type: 'downloading' | 'installing' | 'complete' | 'error'
  progress?: number
  message?: string
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
      return
    } catch (err: any) {
      console.warn(`[ApkInstall] Failed from ${url}:`, err.message)
      lastError = err
    }
  }

  throw lastError || new Error('All download sources failed')
}

async function downloadFromUrl(
  url: string,
  onProgress?: (status: DownloadProgress) => void
): Promise<void> {
  onProgress?.({ type: 'downloading', progress: 0 })

  // Listen for native download progress events
  const progressListener = ApkDownloader.addListener('downloadProgress', (data) => {
    if (data.type === 'progress') {
      onProgress?.({ type: 'downloading', progress: data.progress })
    } else if (data.type === 'complete') {
      onProgress?.({ type: 'downloading', progress: 100 })
    }
  })

  try {
    // Use native Java downloader — bypasses WebView network restrictions
    const result = await ApkDownloader.download({
      url,
      filename: `app-update-${Date.now()}.apk`
    })

    if (!result.path) {
      throw new Error('No file path returned from downloader')
    }

    onProgress?.({ type: 'installing' })

    // Trigger Android package installer
    await ApkInstaller.installApk({ path: result.path })

    onProgress?.({ type: 'complete' })
  } finally {
    progressListener.remove()
  }
}
