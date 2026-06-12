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
 * 下载 APK 并触发 Android 安装器
 * 非原生平台时回退到浏览器打开
 */
export async function downloadAndInstallApk(
  downloadUrl: string,
  onProgress?: (status: DownloadProgress) => void
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    window.open(downloadUrl, '_blank')
    return
  }

  const apkFilename = `app-update-${Date.now()}.apk`

  try {
    onProgress?.({ type: 'downloading', progress: 0 })

    // 使用 Capacitor Filesystem 内置下载，避免将大文件加载到 JS 内存
    await Filesystem.downloadFile({
      url: downloadUrl,
      path: apkFilename,
      directory: Directory.Cache,
      recursive: true,
    })

    onProgress?.({ type: 'installing' })

    // 获取原生文件路径用于 FileProvider
    const statResult = await Filesystem.stat({
      path: apkFilename,
      directory: Directory.Cache,
    })

    // Android 上 stat().uri 返回 file:// URI，提取原生路径
    const nativePath = statResult.uri.replace('file://', '')

    // 触发 Android 安装器
    await ApkInstaller.installApk({ path: nativePath })

    onProgress?.({ type: 'complete' })
  } catch (error: any) {
    console.error('[ApkInstall] Failed:', error)
    onProgress?.({ type: 'error', message: error.message || 'Download failed' })
    throw error
  }
}
