import type { UpdateInfo } from '@/types/update'

const GITEE_API = 'https://gitee.com/api/v5/repos/yy_lan/icebreaker/releases'
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
  // 尝试 Gitee（使用 /releases 列表接口，因为 /releases/latest 不返回 attach_files）
  const giteeResult = await fetchGiteeRelease(currentVersion)
  if (giteeResult) return giteeResult

  // 回退到 GitHub
  const githubResult = await fetchGitHubRelease(currentVersion)
  if (githubResult) return githubResult

  return null
}

/**
 * Gitee: 使用 /releases 列表接口取第一条（包含 attach_files）
 */
async function fetchGiteeRelease(currentVersion: string): Promise<UpdateInfo | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(GITEE_API, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    })
    clearTimeout(timeout)

    if (!response.ok) return null

    const releases = await response.json()
    if (!Array.isArray(releases) || releases.length === 0) return null

    // Gitee 列表不保证倒序，按 created_at 排取最新
    const data = releases.sort((a: any, b: any) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })[0]
    const tagName: string = data.tag_name || ''
    const latestVersion = tagName.replace(/^v/, '')

    if (!latestVersion) return null

    const current = currentVersion || '0.0.0'
    if (compareVersions(latestVersion, current) <= 0) return null

    const downloadUrl = extractApkUrl(data.assets)
    if (!downloadUrl) {
      console.warn('[UpdateService] No APK asset found in Gitee release')
      return null
    }

    return {
      version: latestVersion,
      releaseNotes: data.body || '',
      downloadUrl,
      source: 'gitee',
      publishedAt: data.created_at || ''
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.warn('[UpdateService] Gitee request timeout')
    } else {
      console.warn('[UpdateService] Gitee fetch failed:', err?.message || err)
    }
    return null
  }
}

/**
 * GitHub: 使用 /releases/latest 接口
 */
async function fetchGitHubRelease(currentVersion: string): Promise<UpdateInfo | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(GITHUB_API, {
      signal: controller.signal,
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    })
    clearTimeout(timeout)

    if (!response.ok) return null

    const data = await response.json()
    const tagName: string = data.tag_name || ''
    const latestVersion = tagName.replace(/^v/, '')

    if (!latestVersion) return null

    const current = currentVersion || '0.0.0'
    if (compareVersions(latestVersion, current) <= 0) return null

    const downloadUrl = extractApkUrl(data.assets)
    if (!downloadUrl) {
      console.warn('[UpdateService] No APK asset found in GitHub release')
      return null
    }

    return {
      version: latestVersion,
      releaseNotes: data.body || '',
      downloadUrl,
      source: 'github',
      publishedAt: data.published_at || ''
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.warn('[UpdateService] GitHub request timeout')
    } else {
      console.warn('[UpdateService] GitHub fetch failed:', err?.message || err)
    }
    return null
  }
}

export { compareVersions }
