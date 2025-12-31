/**
 * Image URL Validation Utilities
 * Ensures only valid Cloudinary URLs are stored in the database
 */

/**
 * Validates if a URL is a valid Cloudinary URL
 * @param url - The URL to validate
 * @returns true if the URL is a valid Cloudinary URL, false otherwise
 */
export function isValidCloudinaryUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  // Check if it's a blob URL (should be rejected)
  if (url.startsWith('blob:')) {
    return false
  }

  // Check if it's a data URL (should be rejected)
  if (url.startsWith('data:')) {
    return false
  }

  // Check if it's a local file path (should be rejected)
  if (url.startsWith('file://') || url.startsWith('C:\\') || url.startsWith('/Users/')) {
    return false
  }

  // Check if it's a valid Cloudinary URL
  // Cloudinary URLs typically look like: https://res.cloudinary.com/{cloud_name}/image/upload/...
  const cloudinaryPattern =
    /^https?:\/\/(res|api)\.cloudinary\.com\/[^\/]+\/(image|video)\/upload\//

  return cloudinaryPattern.test(url)
}

/**
 * Validates and sanitizes an image URL
 * @param url - The URL to validate and sanitize
 * @returns The validated URL or null if invalid
 */
export function validateAndSanitizeImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') {
    return null
  }

  // Reject blob, data, and local file URLs
  if (!isValidCloudinaryUrl(url)) {
    console.warn('Invalid image URL detected (not a Cloudinary URL):', url.substring(0, 100))
    return null
  }

  return url
}

/**
 * Checks if a URL should be rejected (blob, data, or local file)
 * @param url - The URL to check
 * @returns true if the URL should be rejected
 */
export function shouldRejectUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return true
  }

  return (
    url.startsWith('blob:') ||
    url.startsWith('data:') ||
    url.startsWith('file://') ||
    url.startsWith('C:\\') ||
    url.startsWith('/Users/')
  )
}

/**
 * Adds cache-busting query parameter to an image URL
 * @param url - The URL to add cache-busting to
 * @returns The URL with cache-busting parameter, or null if URL is invalid
 */
export function addCacheBusting(url: string | null | undefined): string | null {
  const validatedUrl = validateAndSanitizeImageUrl(url)
  if (!validatedUrl) {
    return null
  }

  // If URL already has query params, append; otherwise add
  const separator = validatedUrl.includes('?') ? '&' : '?'
  const timestamp = Date.now()
  return `${validatedUrl}${separator}_cb=${timestamp}`
}

/**
 * Extract entity_type from storage_path
 * Storage path patterns:
 * - authorsinfo/book_entity_header_cover → 'book'
 * - authorsinfo/user_photos → 'user'
 * - user_album_album_... → 'user'
 * - authorsinfo/author_... → 'author'
 * - authorsinfo/publisher_... → 'publisher'
 * - authorsinfo/event_... → 'event'
 * @param storagePath - The storage path to extract entity type from
 * @returns The entity type string or null if cannot be determined
 */
export function extractEntityTypeFromStoragePath(
  storagePath: string | null | undefined
): string | null {
  if (!storagePath) return null

  const path = storagePath.toLowerCase()

  // Check for explicit entity type patterns
  if (path.includes('book_') || path.includes('/book/')) return 'book'
  if (path.includes('author_') || path.includes('/author/')) return 'author'
  if (path.includes('publisher_') || path.includes('/publisher/')) return 'publisher'
  if (path.includes('event_') || path.includes('/event/')) return 'event'

  // User patterns (most common fallback)
  if (path.includes('user_') || path.includes('user_photos') || path.includes('user_album'))
    return 'user'

  return null
}
