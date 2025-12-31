/**
 * Cleans up synopsis text from ISBNDB by converting HTML formatting to proper paragraphs
 * @param synopsis - The raw synopsis text from ISBNDB
 * @returns Cleaned synopsis text with proper paragraph formatting
 */
export function cleanSynopsis(synopsis: string): string {
  if (!synopsis) return ''

  // Replace <br/> with single line breaks
  let cleaned = synopsis.replace(/<br\s*\/?>/gi, '\n')

  // Replace <br/><br/> with double line breaks (paragraph breaks)
  cleaned = cleaned.replace(/\n\n+/g, '\n\n')

  // Split into paragraphs and wrap each in <p> tags
  const paragraphs = cleaned.split('\n\n').filter((p) => p.trim())

  if (paragraphs.length === 1) {
    // Single paragraph, just return the text
    return paragraphs[0].trim()
  } else {
    // Multiple paragraphs, wrap each in <p> tags
    return paragraphs.map((p) => `<p>${p.trim()}</p>`).join('\n')
  }
}

/**
 * Strips all HTML tags from text
 * @param text - Text that may contain HTML
 * @returns Plain text without HTML tags
 */
export function stripHtml(text: string): string {
  if (!text) return ''
  return text.replace(/<[^>]*>/g, '')
}
