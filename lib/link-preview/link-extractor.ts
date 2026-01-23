/**
 * Link Extractor Utility
 * Extracts URLs from text content
 * Phase 2: Enterprise Link Post Component
 */

import isUrl from 'is-url'
import urlParse from 'url-parse'

export interface ExtractedLink {
  url: string
  normalizedUrl: string
  startIndex: number
  endIndex: number
  text: string
}

/**
 * URL regex pattern for detection
 * Supports:
 * - http:// and https://
 * - www. (with protocol inference)
 * - Protocol-less URLs (assumes https)
 */
const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+|www\.[^\s<>"{}|\\^`\[\]]+|[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}[^\s<>"{}|\\^`\[\]]*)/gi

/**
 * Normalize URL for consistent storage
 */
export function normalizeUrl(url: string): string {
  try {
    // Add protocol if missing
    if (!url.match(/^https?:\/\//i)) {
      url = `https://${url}`
    }

    const parsed = urlParse(url)
    let normalized = `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`

    // Remove trailing slash (except for root)
    if (
      normalized.endsWith('/') &&
      normalized.length >
        parsed.protocol.length + 2 + parsed.hostname.length
    ) {
      normalized = normalized.slice(0, -1)
    }

    // Add query string if present (sorted for consistency)
    if (parsed.query) {
      const params = new URLSearchParams(parsed.query)
      const sortedParams = Array.from(params.entries()).sort(([a], [b]) =>
        a.localeCompare(b)
      )
      if (sortedParams.length > 0) {
        const queryString = new URLSearchParams(sortedParams).toString()
        normalized += `?${queryString}`
      }
    }

    return normalized.toLowerCase()
  } catch (error) {
    console.error('Error normalizing URL:', error)
    return url.toLowerCase()
  }
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  // Add protocol if missing for validation
  let urlToValidate = url
  if (!url.match(/^https?:\/\//i)) {
    urlToValidate = `https://${url}`
  }

  return isUrl(urlToValidate)
}

/**
 * Extract all URLs from text
 */
export function extractLinks(text: string): ExtractedLink[] {
  if (!text || typeof text !== 'string') {
    return []
  }

  const links: ExtractedLink[] = []
  const matches = text.matchAll(URL_REGEX)

  for (const match of matches) {
    if (!match[0] || match.index === undefined) {
      continue
    }

    let url = match[0].trim()

    // Remove trailing punctuation that's not part of the URL
    url = url.replace(/[.,;:!?]+$/, '')

    // Add protocol if missing
    if (!url.match(/^https?:\/\//i)) {
      url = `https://${url}`
    }

    // Validate URL
    if (!validateUrl(url)) {
      continue
    }

    const normalizedUrl = normalizeUrl(url)
    const startIndex = match.index
    const endIndex = startIndex + match[0].length

    links.push({
      url,
      normalizedUrl,
      startIndex,
      endIndex,
      text: match[0],
    })
  }

  // Remove duplicates based on normalized URL
  const uniqueLinks = links.filter(
    (link, index, self) =>
      index === self.findIndex((l) => l.normalizedUrl === link.normalizedUrl)
  )

  return uniqueLinks
}

/**
 * Extract first URL from text
 */
export function extractFirstLink(text: string): ExtractedLink | null {
  const links = extractLinks(text)
  return links.length > 0 ? links[0] : null
}

/**
 * Replace URLs in text with placeholders
 */
export function replaceLinksWithPlaceholders(
  text: string,
  replacer: (link: ExtractedLink, index: number) => string
): string {
  const links = extractLinks(text)
  if (links.length === 0) {
    return text
  }

  // Sort by start index in reverse to avoid index shifting issues
  const sortedLinks = [...links].sort((a, b) => b.startIndex - a.startIndex)

  let result = text
  sortedLinks.forEach((link, index) => {
    const replacement = replacer(link, index)
    result =
      result.slice(0, link.startIndex) +
      replacement +
      result.slice(link.endIndex)
  })

  return result
}

/**
 * Highlight URLs in text with HTML
 */
export function highlightLinksInText(
  text: string,
  className: string = 'link-highlight'
): string {
  return replaceLinksWithPlaceholders(
    text,
    (link) => `<span class="${className}" data-url="${link.url}">${link.text}</span>`
  )
}
