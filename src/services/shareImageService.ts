import { toPng } from 'html-to-image'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'
import type { Question } from '@/types/question'
import { getShareText } from '@/utils/questionText'

/**
 * Render a hidden ShareQuestionCard to DOM, export as PNG data URL.
 */
async function renderCardToDataUrl(element: HTMLElement): Promise<string> {
  return toPng(element, {
    pixelRatio: 2,
    backgroundColor: '#F8F5F0',
    width: 540,
    height: 675,
    style: {
      transform: 'scale(1)',
      transformOrigin: 'top left'
    }
  })
}

/**
 * Convert data URL to base64 string (without prefix)
 */
function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(',')[1] || ''
}

/**
 * Get a timestamp-based filename
 */
function getShareFilename(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `openingline_share_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.png`
}

/**
 * Export the share card DOM element as a PNG Blob.
 */
export async function exportShareCard(element: HTMLElement): Promise<Blob> {
  const dataUrl = await renderCardToDataUrl(element)
  const res = await fetch(dataUrl)
  return res.blob()
}

/**
 * Share the card image via Android system share sheet.
 */
export async function shareCardImage(element: HTMLElement): Promise<void> {
  const dataUrl = await renderCardToDataUrl(element)
  const base64 = dataUrlToBase64(dataUrl)
  const filename = getShareFilename()

  // Write to cache directory first
  await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache,
    recursive: true
  })

  // Get the file URI for sharing
  const fileUri = await Filesystem.getUri({
    directory: Directory.Cache,
    path: filename
  })

  try {
    await Share.share({
      title: '开场白 Opening Line',
      files: [fileUri.uri],
      dialogTitle: '分享卡片图片'
    })
  } finally {
    // Cleanup temp file
    try {
      await Filesystem.deleteFile({
        path: filename,
        directory: Directory.Cache
      })
    } catch { /* ignore cleanup errors */ }
  }
}

/**
 * Save the card image to the device photo gallery.
 */
export async function saveCardToGallery(element: HTMLElement): Promise<boolean> {
  const dataUrl = await renderCardToDataUrl(element)
  const base64 = dataUrlToBase64(dataUrl)
  const filename = getShareFilename()

  // Write to external storage (visible in gallery)
  await Filesystem.writeFile({
    path: `Pictures/OpeningLine/${filename}`,
    data: base64,
    directory: Directory.ExternalStorage,
    recursive: true
  })

  return true
}

/**
 * Get the display text for a question (for error messages etc.)
 */
export function getShareDisplayText(question: Question): string {
  const { en } = getShareText(question)
  return en || 'Unknown question'
}
