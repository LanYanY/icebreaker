/**
 * 文本标准化函数
 * 用于在生成hash和计算相似度前统一文本格式
 */
export function normalizeText(text: string): string {
  return text
    .trim()                          // 去掉首尾空格
    .replace(/\s+/g, ' ')           // 合并多余空格
    .replace(/[。！？，、；：""''（）【】《》\.\!\?\,\;\:\(\)\[\]\{\}]/g, '') // 去掉标点符号
    .toLowerCase()                   // 英文统一小写
    .replace(/[\u4e00-\u9fa5]/g, (char) => {
      // 中文全角标点统一（可选）
      return char
    })
}

/**
 * 生成文本的简单hash
 * 使用DJB2算法
 */
export function generateHash(text: string): string {
  const normalized = normalizeText(text)
  let hash = 5381
  
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash) + normalized.charCodeAt(i)
    hash = hash & hash // 转换为32位整数
  }
  
  return Math.abs(hash).toString(36)
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}
