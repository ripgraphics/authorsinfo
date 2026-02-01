/**
 * Book utility functions for formatting and managing book-related data
 */

/**
 * Extracts page count from a book-like object (supports both pages and page_count).
 * Use when passing to BookCard or AddToShelfButton from varying API responses.
 * Accepts unknown to support BookData and other types that may have pages at runtime.
 */
export function getBookPages(book: unknown): number | null {
  if (!book || typeof book !== 'object') return null
  const b = book as Record<string, unknown>
  const pages = b.pages ?? b.page_count
  if (typeof pages === 'number' && !Number.isNaN(pages)) return pages
  return null
}

/**
 * Formats book cover alt/title text
 * @param title - The book title
 * @param coverType - Type of cover: 'front' (default) or 'back'
 * @returns Formatted string like "Book Title : book cover" or "Book Title : book back cover"
 */
export function getBookCoverAltText(title: string, coverType: 'front' | 'back' = 'front'): string {
  if (!title) return ''
  const coverLabel = coverType === 'back' ? 'book back cover' : 'book cover'
  return `${title} : ${coverLabel}`
}

/**
 * Formats book gallery image alt/title text
 * @param title - The book title
 * @param imageDescription - Optional description of the gallery image (e.g., "sample page", "interior spread")
 * @returns Formatted string like "Book Title : sample page" or "Book Title : gallery image"
 */
export function getBookGalleryAltText(title: string, imageDescription?: string): string {
  if (!title) return ''
  const label = imageDescription || 'gallery image'
  return `${title} : ${label}`
}
