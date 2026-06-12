export interface UpdateInfo {
  /** 新版本号，如 "1.3.0" */
  version: string
  /** Release Notes (markdown) */
  releaseNotes: string
  /** APK 下载地址列表（按优先级排序：Gitee → GitHub） */
  downloadUrls: string[]
  /** 主要来源平台 */
  source: 'gitee' | 'github'
  /** 发布时间 ISO string */
  publishedAt: string
}
