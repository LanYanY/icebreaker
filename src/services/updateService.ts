import type { UpdateInfo } from '@/types/update'

const GITEE_API = 'https://gitee.com/api/v5/repos/yy_lan/icebreaker/releases?per_page=100'
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
 * 同时从 Gitee 和 GitHub 获取，合并下载地址（Gitee 优先）
 */
export async function checkForUpdate(currentVersion: string): Promise<UpdateInfo | null> {
  const current = currentVersion || '0.0.0'

  // 并行获取两个平台的 release 信息
  const [giteeInfo, githubInfo] = await Promise.all([
    fetchGiteeRelease(),
    fetchGitHubRelease()
  ])

  // 取版本号更大的那个
  let latestVersion = ''
  let releaseNotes = ''
  let publishedAt = ''
  let source: 'gitee' | 'github' = 'gitee'

  if (giteeInfo && githubInfo) {
    if (compareVersions(giteeInfo.version, githubInfo.version) >= 0) {
      latestVersion = giteeInfo.version
      releaseNotes = giteeInfo.releaseNotes
      publishedAt = giteeInfo.publishedAt
      source = 'gitee'
    } else {
      latestVersion = githubInfo.version
      releaseNotes = githubInfo.releaseNotes
      publishedAt = githubInfo.publishedAt
      source = 'github'
    }
  } else if (giteeInfo) {
    latestVersion = giteeInfo.version
    releaseNotes = giteeInfo.releaseNotes
    publishedAt = giteeInfo.publishedAt
    source = 'gitee'
  } else if (githubInfo) {
    latestVersion = githubInfo.version
    releaseNotes = githubInfo.releaseNotes
    publishedAt = githubInfo.publishedAt
    source = 'github'
  } else {
    return null
  }

  // 比较版本
  if (compareVersions(latestVersion, current) <= 0) return null

  // 合并下载地址（Gitee 优先，GitHub 备用）
  const downloadUrls: string[] = []
  if (giteeInfo?.downloadUrl) downloadUrls.push(giteeInfo.downloadUrl)
  if (githubInfo?.downloadUrl) downloadUrls.push(githubInfo.downloadUrl)

  if (downloadUrls.length === 0) {
    console.warn('[UpdateService] No APK download URLs found')
    return null
  }

  return {
    version: latestVersion,
    releaseNotes,
    downloadUrls,
    source,
    publishedAt
  }
}

async function fetchGiteeRelease(): Promise<{ version: string; releaseNotes: string; downloadUrl: string; publishedAt: string } | null> {
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
    const version = tagName.replace(/^v/, '')
    if (!version) return null

    const downloadUrl = extractApkUrl(data.assets)
    if (!downloadUrl) return null

    return {
      version,
      releaseNotes: data.body || '',
      downloadUrl,
      publishedAt: data.created_at || ''
    }
  } catch (err: any) {
    console.warn('[UpdateService] Gitee fetch failed:', err?.message || err)
    return null
  }
}

async function fetchGitHubRelease(): Promise<{ version: string; releaseNotes: string; downloadUrl: string; publishedAt: string } | null> {
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
    const version = tagName.replace(/^v/, '')
    if (!version) return null

    const downloadUrl = extractApkUrl(data.assets)
    if (!downloadUrl) return null

    return {
      version,
      releaseNotes: data.body || '',
      downloadUrl,
      publishedAt: data.published_at || ''
    }
  } catch (err: any) {
    console.warn('[UpdateService] GitHub fetch failed:', err?.message || err)
    return null
  }
}

export { compareVersions }
