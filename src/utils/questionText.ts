import type { Question, QuestionText } from '@/types/question'

/**
 * Extract bilingual text from a Question, handling both old string and new QuestionText formats.
 */
export function getShareText(question: Question): { en: string; zh: string } {
  const text = question.text

  if (!text) return { en: '', zh: '' }

  // New bilingual format: { en: string; zh: string }
  if (typeof text === 'object' && 'en' in text) {
    return {
      en: (text as QuestionText).en || '',
      zh: (text as QuestionText).zh || ''
    }
  }

  // Legacy string format
  if (typeof text === 'string') {
    return { en: text, zh: '' }
  }

  return { en: '', zh: '' }
}
