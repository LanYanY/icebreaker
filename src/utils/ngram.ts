/**
 * 字符n-gram相似度计算
 * 用于检测中文短文本的相似度
 */

/**
 * 生成字符n-gram集合
 * @param text 输入文本
 * @param n n-gram的n值，默认为2
 * @returns n-gram集合
 */
export function generateNgrams(text: string, n = 2): Set<string> {
  const ngrams = new Set<string>()
  
  if (!text) {
    return ngrams
  }
  
  const normalized = text.trim().toLowerCase()
  
  if (normalized.length < n) {
    ngrams.add(normalized)
    return ngrams
  }
  
  for (let i = 0; i <= normalized.length - n; i++) {
    ngrams.add(normalized.substring(i, i + n))
  }
  
  return ngrams
}

/**
 * 计算两个集合的Jaccard相似度
 * @param set1 集合1
 * @param set2 集合2
 * @returns Jaccard相似度（0-1）
 */
export function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 && set2.size === 0) return 1
  if (set1.size === 0 || set2.size === 0) return 0
  
  let intersectionSize = 0
  for (const item of set1) {
    if (set2.has(item)) {
      intersectionSize++
    }
  }
  
  const unionSize = set1.size + set2.size - intersectionSize
  return intersectionSize / unionSize
}

/**
 * 计算两个文本的相似度
 * @param text1 文本1
 * @param text2 文本2
 * @param n n-gram的n值，默认为2
 * @returns 相似度（0-1）
 */
export function calculateSimilarity(text1: string, text2: string, n = 2): number {
  if (!text1 || !text2) {
    return 0
  }
  
  const ngrams1 = generateNgrams(text1, n)
  const ngrams2 = generateNgrams(text2, n)
  
  return jaccardSimilarity(ngrams1, ngrams2)
}

/**
 * 检查文本是否与现有文本列表过于相似
 * @param text 待检查文本
 * @param existingTexts 现有文本列表
 * @param threshold 相似度阈值，默认0.6
 * @returns 是否相似
 */
export function isTooSimilar(
  text: string, 
  existingTexts: string[], 
  threshold = 0.6
): boolean {
  if (!text || !existingTexts || existingTexts.length === 0) {
    return false
  }
  
  for (const existingText of existingTexts) {
    if (!existingText) continue
    const similarity = calculateSimilarity(text, existingText)
    if (similarity >= threshold) {
      return true
    }
  }
  return false
}
