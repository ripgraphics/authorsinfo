/**
 * Enterprise Link Metadata Extractor
 * Extracts Open Graph, Twitter Cards, and HTML meta tags from URLs
 * Phase 1: Enterprise Link Post Component
 */

import { load } from 'cheerio'
import urlParse from 'url-parse'
import isUrl from 'is-url'
import type {
  LinkPreviewMetadata,
  ExtractedMetadata,
  LinkPreviewOptions,
} from '@/types/link-preview'

const DEFAULT_OPTIONS: Required<LinkPreviewOptions> = {
  timeout: 10000, // 10 seconds
  max_redirects: 5,
  user_agent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  follow_redirects: true,
  validate_ssl: true,
  extract_images: true,
  extract_videos: true,
}

/**
 * Normalize URL for consistent storage and comparison
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = urlParse(url)
    let normalized = `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`
    
    // Remove trailing slash (except for root)
    if (normalized.endsWith('/') && normalized.length > parsed.protocol.length + 2 + parsed.hostname.length) {
      normalized = normalized.slice(0, -1)
    }
    
    // Add query string if present (sorted for consistency)
    if (parsed.query) {
      const params = new URLSearchParams(parsed.query)
      const sortedParams = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b))
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
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const parsed = urlParse(url)
    return parsed.hostname.replace(/^www\./, '')
  } catch (error) {
    console.error('Error extracting domain:', error)
    return ''
  }
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  if (!isUrl(url)) {
    return false
  }
  
  try {
    const parsed = urlParse(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Fetch HTML content from URL with timeout and redirect handling
 */
async function fetchHtml(
  url: string,
  options: Required<LinkPreviewOptions>
): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), options.timeout)

  try {
    let currentUrl = url
    let redirectCount = 0

    while (redirectCount < options.max_redirects) {
      const response = await fetch(currentUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': options.user_agent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'manual', // Handle redirects manually
      })

      // Handle redirects
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        if (location) {
          currentUrl = new URL(location, currentUrl).toString()
          redirectCount++
          continue
        }
      }

      // Check if response is HTML
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('text/html')) {
        throw new Error(`Invalid content type: ${contentType}`)
      }

      clearTimeout(timeoutId)
      return await response.text()
    }

    throw new Error('Too many redirects')
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout')
    }
    throw error
  }
}

/**
 * Extract metadata from HTML using Cheerio
 */
function extractMetadataFromHtml(html: string, url: string): ExtractedMetadata {
  const $ = load(html)
  const metadata: ExtractedMetadata = {}

  // Extract Open Graph tags
  $('meta[property^="og:"]').each((_, element) => {
    const property = $(element).attr('property')?.replace('og:', '')
    const content = $(element).attr('content')
    
    if (property && content) {
      switch (property) {
        case 'title':
          metadata.og_title = content
          break
        case 'description':
          metadata.og_description = content
          break
        case 'image':
          metadata.og_image = content
          break
        case 'url':
          metadata.og_url = content
          break
        case 'type':
          metadata.og_type = content
          break
        case 'site_name':
          metadata.og_site_name = content
          break
        case 'author':
          metadata.og_author = content
          break
        case 'published_time':
          metadata.og_published_time = content
          break
        case 'article:author':
          metadata.og_article_author = content
          break
        case 'article:published_time':
          metadata.og_article_published_time = content
          break
      }
    }
  })

  // Extract Twitter Card tags
  $('meta[name^="twitter:"]').each((_, element) => {
    const name = $(element).attr('name')?.replace('twitter:', '')
    const content = $(element).attr('content')
    
    if (name && content) {
      switch (name) {
        case 'card':
          metadata.twitter_card = content
          break
        case 'title':
          metadata.twitter_title = content
          break
        case 'description':
          metadata.twitter_description = content
          break
        case 'image':
          metadata.twitter_image = content
          break
        case 'site':
          metadata.twitter_site = content
          break
        case 'creator':
          metadata.twitter_creator = content
          break
      }
    }
  })

  // Extract HTML meta tags (fallback)
  metadata.html_title = $('title').first().text().trim() || undefined
  metadata.html_description =
    $('meta[name="description"]').attr('content') || undefined
  metadata.html_keywords =
    $('meta[name="keywords"]').attr('content') || undefined
  metadata.html_author = $('meta[name="author"]').attr('content') || undefined

  // Extract favicon
  const faviconHref =
    $('link[rel="icon"]').attr('href') ||
    $('link[rel="shortcut icon"]').attr('href') ||
    $('link[rel="apple-touch-icon"]').attr('href')
  
  if (faviconHref) {
    try {
      metadata.favicon = new URL(faviconHref, url).toString()
    } catch {
      metadata.favicon = faviconHref
    }
  }

  // Extract canonical URL
  const canonicalHref = $('link[rel="canonical"]').attr('href')
  if (canonicalHref) {
    try {
      metadata.canonical_url = new URL(canonicalHref, url).toString()
    } catch {
      metadata.canonical_url = canonicalHref
    }
  }

  // Extract language
  metadata.language = $('html').attr('lang') || $('meta[http-equiv="content-language"]').attr('content')

  // Extract content type
  metadata.content_type = $('meta[http-equiv="content-type"]').attr('content')

  // Extract charset
  metadata.charset = $('meta[charset]').attr('charset') || $('meta[http-equiv="charset"]').attr('content')

  // Extract video metadata
  $('meta[property^="video:"]').each((_, element) => {
    const property = $(element).attr('property')?.replace('video:', '')
    const content = $(element).attr('content')
    
    if (property === 'url' && content) {
      metadata.video_url = content
    } else if (property === 'type' && content) {
      metadata.video_type = content
    } else if (property === 'duration' && content) {
      metadata.video_duration = parseInt(content, 10)
    } else if (property === 'thumbnail_url' && content) {
      metadata.video_thumbnail = content
    }
  })

  // Extract article metadata
  $('meta[property^="article:"]').each((_, element) => {
    const property = $(element).attr('property')?.replace('article:', '')
    const content = $(element).attr('content')
    
    if (property === 'author' && content) {
      metadata.article_author = content
    } else if (property === 'published_time' && content) {
      metadata.article_published_time = content
    } else if (property === 'modified_time' && content) {
      metadata.article_modified_time = content
    } else if (property === 'section' && content) {
      metadata.article_section = content
    } else if (property === 'tag' && content) {
      if (!metadata.article_tag) {
        metadata.article_tag = []
      }
      metadata.article_tag.push(content)
    }
  })

  // Extract product metadata
  $('meta[property^="product:"]').each((_, element) => {
    const property = $(element).attr('property')?.replace('product:', '')
    const content = $(element).attr('content')
    
    if (property === 'price:amount' && content) {
      metadata.product_price = content
    } else if (property === 'price:currency' && content) {
      metadata.product_currency = content
    } else if (property === 'availability' && content) {
      metadata.product_availability = content
    } else if (property === 'condition' && content) {
      metadata.product_condition = content
    }
  })

  // Extract all images from the page
  const imageUrls = new Set<string>()
  
  // Extract from og:image (multiple can exist)
  $('meta[property="og:image"]').each((_, element) => {
    const content = $(element).attr('content')
    if (content) {
      try {
        imageUrls.add(new URL(content, url).toString())
      } catch {
        imageUrls.add(content)
      }
    }
  })
  
  // Extract from twitter:image
  $('meta[name="twitter:image"]').each((_, element) => {
    const content = $(element).attr('content')
    if (content) {
      try {
        imageUrls.add(new URL(content, url).toString())
      } catch {
        imageUrls.add(content)
      }
    }
  })
  
  // Extract from img tags (prioritize larger images)
  $('img').each((_, element) => {
    const src = $(element).attr('src') || $(element).attr('data-src') || $(element).attr('data-lazy-src')
    if (src) {
      try {
        const absoluteUrl = new URL(src, url).toString()
        // Filter out very small images (likely icons) and data URIs
        if (!absoluteUrl.startsWith('data:') && !absoluteUrl.includes('icon') && !absoluteUrl.includes('logo')) {
          const width = parseInt($(element).attr('width') || '0', 10)
          const height = parseInt($(element).attr('height') || '0', 10)
          // Only include images that are reasonably sized (at least 100x100 or no size specified)
          if (width === 0 || height === 0 || (width >= 100 && height >= 100)) {
            imageUrls.add(absoluteUrl)
          }
        }
      } catch {
        // Skip invalid URLs
      }
    }
  })
  
  // Store all images in metadata (will be added to LinkPreviewMetadata later)
  if (imageUrls.size > 0) {
    metadata.all_images = Array.from(imageUrls)
  }

  return metadata
}

/**
 * Determine link type from metadata
 */
function determineLinkType(
  metadata: ExtractedMetadata,
  url: string
): 'article' | 'video' | 'image' | 'website' | 'product' | 'book' | 'other' {
  // Check for video
  if (metadata.video_url || metadata.og_type === 'video' || metadata.twitter_card === 'player') {
    return 'video'
  }

  // Check for image (direct image URL)
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  if (imageExtensions.some((ext) => url.toLowerCase().includes(ext))) {
    return 'image'
  }

  // Check for article
  if (
    metadata.og_type === 'article' ||
    metadata.article_author ||
    metadata.article_published_time
  ) {
    return 'article'
  }

  // Check for product
  if (metadata.product_price || metadata.og_type === 'product') {
    return 'product'
  }

  // Check for book (could be enhanced with ISBN detection)
  if (url.includes('book') || url.includes('isbn')) {
    return 'book'
  }

  return 'website'
}

/**
 * Resolve relative URLs to absolute URLs
 */
function resolveUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).toString()
  } catch {
    return url
  }
}

/**
 * Extract link preview metadata from a URL
 */
export async function extractLinkMetadata(
  url: string,
  options: LinkPreviewOptions = {}
): Promise<LinkPreviewMetadata> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Validate URL
  if (!validateUrl(url)) {
    throw new Error('Invalid URL format')
  }

  // Normalize URL
  const normalizedUrl = normalizeUrl(url)
  const domain = extractDomain(url)

  try {
    // Fetch HTML
    const html = await fetchHtml(url, opts)

    // Extract metadata
    const extracted = extractMetadataFromHtml(html, url)

    // Build LinkPreviewMetadata
    const metadata: LinkPreviewMetadata = {
      url,
      normalized_url: normalizedUrl,
      domain,
      link_type: determineLinkType(extracted, url),
    }

    // Priority: Open Graph > Twitter Card > HTML meta tags
    metadata.title =
      extracted.og_title ||
      extracted.twitter_title ||
      extracted.html_title ||
      undefined

    metadata.description =
      extracted.og_description ||
      extracted.twitter_description ||
      extracted.html_description ||
      undefined

    // Set primary image (og:image or twitter:image)
    metadata.image_url = extracted.og_image
      ? resolveUrl(extracted.og_image, url)
      : extracted.twitter_image
        ? resolveUrl(extracted.twitter_image, url)
        : undefined

    // Store all available images
    if (extracted.all_images && extracted.all_images.length > 0) {
      metadata.images = extracted.all_images.map(img => resolveUrl(img, url))
      // Ensure primary image is first in the array if it exists
      if (metadata.image_url && !metadata.images.includes(metadata.image_url)) {
        metadata.images.unshift(metadata.image_url)
      }
    } else if (metadata.image_url) {
      // If no all_images but we have a primary image, use that
      metadata.images = [metadata.image_url]
    }

    metadata.site_name =
      extracted.og_site_name || extracted.twitter_site || domain

    metadata.favicon_url = extracted.favicon
      ? resolveUrl(extracted.favicon, url)
      : `https://www.google.com/s2/favicons?domain=${domain}&sz=64`

    metadata.author =
      extracted.og_author ||
      extracted.article_author ||
      extracted.twitter_creator ||
      extracted.html_author ||
      undefined

    metadata.published_at =
      extracted.og_published_time ||
      extracted.article_published_time ||
      undefined

    // Store all extracted metadata in metadata field
    metadata.metadata = {
      ...extracted,
      canonical_url: extracted.canonical_url || url,
    }

    // Set expiration (24 hours from now)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)
    metadata.expires_at = expiresAt.toISOString()

    metadata.extracted_at = new Date().toISOString()
    metadata.is_valid = true

    return metadata
  } catch (error: any) {
    console.error('Error extracting link metadata:', error)
    
    // Return minimal metadata on error
    return {
      url,
      normalized_url: normalizedUrl,
      domain,
      link_type: 'other',
      is_valid: false,
      extracted_at: new Date().toISOString(),
    }
  }
}
