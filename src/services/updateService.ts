import type { UpdateInfo } from '@/types/update'

const GITEE_API = 'https://gitee.com/api/v5/repos/yy_lan/icebreaker/releases/latest'
const GITHUB_API = 'https://api.github.com/repos/LanYanY/icebreaker/releases/latest'

/**
 * 比较两个语义化版本号
 * @returns -1 a < b, 0 相等, 1 a > b
 */
function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map(Number)
  const pb = b.replace(/^v/, '').split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0
    const nb = pb[i] || 0
    if (na > nb) return 1
    if (na < nb) return -1
  }
  return 0
}

/**
 * 从 release assets 中提取 APK 下载地址
 */
function extractApkUrl(assets: any[]): string | null {
  if (!Array.isArray(assets)) return null
  const apk = assets.find((a: any) => a.name?.endsWith('.apk'))
  return apk?.browser_download_url || null
}

/**
 * 检查是否有新版本可用
 * 优先从 Gitee 获取，失败则从 GitHub 获取
 */
export async function checkForUpdate(currentVersion: string): Promise<UpdateInfo | null> {
  // 尝试 Gitee
  const giteeResult = await fetchRelease(GITEE_API, 'gitee', currentVersion)
  if (giteeResult) return giteeResult

  // 回退到 GitHub
  const githubResult = await fetchRelease(GITHUB_API, 'github', currentVersion)
  if (githubResult) return githubResult

  return null
}

async function fetchRelease(
  url: string,
  source: 'gitee' | 'github',
  currentVersion: string
): Promise<UpdateInfo | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    })
    clearTimeout(timeout)

    if (!response.ok) return null

    const data = await response.json()
    const tagName: string = data.tag_name || ''
    const latestVersion = tagName.replace(/^v/, '')

    if (!latestVersion) return null

    // 获取当前版本（如果传入的为空则尝试从 App.getInfo 获取）
    const current = currentVersion || '0.0.0'

    // 如果没有更新，返回 null
    if (compareVersions(latestVersion, current) <= 0) return null

    const downloadUrl = extractApkUrl(data.assets)
    if (!downloadUrl) {
      console.warn(`[UpdateService] No APK asset found in ${source} release`)
      return null
    }

    return {
      version: latestVersion,
      releaseNotes: data.body || '',
      downloadUrl,
      source,
      publishedAt: data.published_at || data.created_at || ''
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.warn(`[UpdateService] ${source} request timeout`)
    } else {
      console.warn(`[UpdateService] ${source} fetch failed:`, err?.message || err)
    }
    return null
  }
}

export { compareVersions }
