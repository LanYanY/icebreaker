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
 * 使用 fetch 流式读取实现真实进度追踪
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

    // 使用 fetch 下载，支持 Content-Length 进度追踪
    const response = await fetch(downloadUrl)
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`)
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10)
    const reader = response.body?.getReader()
    if (!reader) throw new Error('Response body not readable')

    const chunks: Uint8Array[] = []
    let received = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      chunks.push(value)
      received += value.length

      if (contentLength > 0) {
        const progress = Math.round((received / contentLength) * 100)
        onProgress?.({ type: 'downloading', progress })
      }
    }

    // 合并所有 chunks
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const apkBytes = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      apkBytes.set(chunk, offset)
      offset += chunk.length
    }

    // 转为 base64 写入文件系统
    const base64 = btoa(String.fromCharCode(...apkBytes))

    onProgress?.({ type: 'downloading', progress: 100 })

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
  } catch (error: any) {
    console.error('[ApkInstall] Failed:', error)
    onProgress?.({ type: 'error', message: error.message || 'Download failed' })
    throw error
  }
}
