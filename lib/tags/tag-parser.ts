/**
 * Tag Parser and Normalization Service
 * Extracts @mentions and #hashtags from text content
 */

export interface ParsedTag {
  type: 'user' | 'entity' | 'topic' | 'location' | 'taxonomy'
  name: string
  slug: string
  position: {
    start: number
    end: number
  }
  metadata?: Record<string, any>
}

export interface ParsedMention extends ParsedTag {
  type: 'user' | 'entity'
  entityId?: string
  entityType?: 'user' | 'author' | 'book' | 'group' | 'event'
}

export interface ParsedHashtag extends ParsedTag {
  type: 'topic'
}

/**
 * Generate URL-friendly slug from tag name
 */
export function generateTagSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Extract @mentions from text
 * Supports: @username, @Author Name, @Book Title, @Group Name, @Event Title
 * Language-aware: supports CJK and other non-Latin scripts
 */
export function extractMentions(text: string, locale: string = 'en'): ParsedMention[] {
  const mentions: ParsedMention[] = []
  
  // Use language-aware regex for CJK languages
  let mentionRegex: RegExp
  if (['zh', 'ja', 'ko'].includes(locale)) {
    // CJK: Match @ followed by CJK characters, alphanumeric, and spaces
    mentionRegex = /@([\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\w\s]+)/g
  } else {
    // Standard: Match @mentions - can be @username or @Entity Name
    mentionRegex = /@([a-zA-Z0-9_]+(?:[\s][a-zA-Z0-9_]+)*)/g
  }
  
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    const fullMatch = match[0]
    const name = match[1].trim()
    const start = match.index
    const end = start + fullMatch.length

    // Determine if it's a user (simple username) or entity (has spaces or special format)
    // For CJK, this logic may need adjustment
    const isEntity = name.includes(' ') || /^[A-Z\u4e00-\u9fff]/.test(name)

    mentions.push({
      type: isEntity ? 'entity' : 'user',
      name: name,
      slug: generateTagSlug(name),
      position: { start, end },
      entityType: isEntity ? undefined : 'user',
    })
  }

  return mentions
}

/**
 * Extract #hashtags from text
 * Language-aware: supports CJK and other non-Latin scripts
 */
export function extractHashtags(text: string, locale: string = 'en'): ParsedHashtag[] {
  const hashtags: ParsedHashtag[] = []
  
  // Use language-aware regex for CJK languages
  let hashtagRegex: RegExp
  if (['zh', 'ja', 'ko'].includes(locale)) {
    // CJK: Match # followed by CJK characters, alphanumeric, and spaces
    hashtagRegex = /#([\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\w\s]+)/g
  } else {
    // Standard: Match #hashtags - alphanumeric and underscores, can have spaces
    hashtagRegex = /#([a-zA-Z0-9_]+(?:[\s][a-zA-Z0-9_]+)*)/g
  }
  
  let match

  while ((match = hashtagRegex.exec(text)) !== null) {
    const fullMatch = match[0]
    const name = match[1].trim()
    const start = match.index
    const end = start + fullMatch.length

    hashtags.push({
      type: 'topic',
      name: name,
      slug: generateTagSlug(name),
      position: { start, end },
    })
  }

  return hashtags
}

/**
 * Extract all tags (mentions + hashtags) from text
 */
export function extractAllTags(text: string): ParsedTag[] {
  const mentions = extractMentions(text)
  const hashtags = extractHashtags(text)
  return [...mentions, ...hashtags]
}

/**
 * Normalize tag name (trim, lowercase for comparison)
 */
export function normalizeTagName(name: string): string {
  return name.trim().toLowerCase()
}

/**
 * Check if two tag names are equivalent (case-insensitive, trimmed)
 */
export function areTagsEquivalent(name1: string, name2: string): boolean {
  return normalizeTagName(name1) === normalizeTagName(name2)
}

/**
 * Remove tags from text (useful for cleaning)
 */
export function removeTagsFromText(text: string): string {
  // Remove @mentions
  let cleaned = text.replace(/@([a-zA-Z0-9_]+(?:[\s][a-zA-Z0-9_]+)*)/g, '')
  // Remove #hashtags
  cleaned = cleaned.replace(/#([a-zA-Z0-9_]+(?:[\s][a-zA-Z0-9_]+)*)/g, '')
  // Clean up extra spaces
  return cleaned.replace(/\s+/g, ' ').trim()
}

/**
 * Replace plain text mentions with formatted mentions
 * Useful for displaying parsed content
 */
export function formatTagsInText(
  text: string,
  mentions: ParsedMention[],
  hashtags: ParsedHashtag[]
): string {
  let formatted = text
  const allTags = [...mentions, ...hashtags].sort((a, b) => b.position.start - a.position.start)

  // Replace from end to start to preserve positions
  for (const tag of allTags) {
    const prefix = tag.type === 'topic' ? '#' : '@'
    const original = prefix + tag.name
    const replacement = `<span class="tag tag-${tag.type}" data-tag-type="${tag.type}" data-tag-slug="${tag.slug}">${original}</span>`
    formatted =
      formatted.slice(0, tag.position.start) +
      replacement +
      formatted.slice(tag.position.end)
  }

  return formatted
}
