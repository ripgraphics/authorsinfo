/**
 * Book utility functions for formatting and managing book-related data
 */

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
