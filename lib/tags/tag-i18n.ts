/**
 * Tag i18n Service
 * Handles localized tag names and language-aware parsing
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Get localized tag name
 */
export async function getLocalizedTagName(
  tagId: string,
  locale: string = 'en'
): Promise<string | null> {
  const supabase = await createClient()

  const { data: tag } = await supabase
    .from('tags')
    .select('name, localized_names, default_locale')
    .eq('id', tagId)
    .single()

  if (!tag) return null

  // Return localized name if available
  if (tag.localized_names && typeof tag.localized_names === 'object') {
    const localized = (tag.localized_names as Record<string, string>)[locale]
    if (localized) {
      return localized
    }
  }

  // Fallback to default locale or base name
  if (locale === tag.default_locale || !tag.localized_names) {
    return tag.name
  }

  // Try default locale
  if (tag.default_locale && tag.localized_names) {
    const defaultLocalized = (tag.localized_names as Record<string, string>)[tag.default_locale]
    if (defaultLocalized) {
      return defaultLocalized
    }
  }

  return tag.name
}

/**
 * Set localized tag name
 */
export async function setLocalizedTagName(
  tagId: string,
  locale: string,
  name: string
): Promise<boolean> {
  const supabase = await createClient()

  // Get current localized names
  const { data: tag } = await supabase
    .from('tags')
    .select('localized_names')
    .eq('id', tagId)
    .single()

  if (!tag) return false

  const localizedNames = (tag.localized_names as Record<string, string>) || {}
  localizedNames[locale] = name

  const { error } = await supabase
    .from('tags')
    .update({ localized_names: localizedNames })
    .eq('id', tagId)

  return !error
}

/**
 * Detect language from text (simple heuristic)
 */
export function detectLanguage(text: string): string {
  // Simple detection based on character ranges
  // In production, use a proper language detection library

  // Check for CJK characters (Chinese, Japanese, Korean)
  if (/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(text)) {
    // More specific detection would be needed
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh'
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'
    if (/[\uac00-\ud7af]/.test(text)) return 'ko'
  }

  // Check for Arabic
  if (/[\u0600-\u06ff]/.test(text)) return 'ar'

  // Check for Cyrillic
  if (/[\u0400-\u04ff]/.test(text)) return 'ru'

  // Default to English
  return 'en'
}

/**
 * Parse tags with language-aware segmentation
 */
export function parseTagsLanguageAware(
  text: string,
  locale: string = 'en'
): Array<{ type: 'mention' | 'hashtag'; name: string; position: { start: number; end: number } }> {
  const tags: Array<{ type: 'mention' | 'hashtag'; name: string; position: { start: number; end: number } }> = []

  // For CJK languages, use different parsing rules
  if (['zh', 'ja', 'ko'].includes(locale)) {
    // CJK: Match @ or # followed by CJK characters, alphanumeric, and spaces
    const mentionRegex = /@([\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\w\s]+)/g
    const hashtagRegex = /#([\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\w\s]+)/g

    let match
    while ((match = mentionRegex.exec(text)) !== null) {
      tags.push({
        type: 'mention',
        name: match[1].trim(),
        position: { start: match.index, end: match.index + match[0].length },
      })
    }

    while ((match = hashtagRegex.exec(text)) !== null) {
      tags.push({
        type: 'hashtag',
        name: match[1].trim(),
        position: { start: match.index, end: match.index + match[0].length },
      })
    }
  } else {
    // Standard parsing for Latin scripts
    const mentionRegex = /@([a-zA-Z0-9_]+(?:[\s][a-zA-Z0-9_]+)*)/g
    const hashtagRegex = /#([a-zA-Z0-9_]+(?:[\s][a-zA-Z0-9_]+)*)/g

    let match
    while ((match = mentionRegex.exec(text)) !== null) {
      tags.push({
        type: 'mention',
        name: match[1].trim(),
        position: { start: match.index, end: match.index + match[0].length },
      })
    }

    while ((match = hashtagRegex.exec(text)) !== null) {
      tags.push({
        type: 'hashtag',
        name: match[1].trim(),
        position: { start: match.index, end: match.index + match[0].length },
      })
    }
  }

  return tags
}
