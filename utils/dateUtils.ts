/**
 * Formats a date string to "June 29, 2005" format
 * @param dateString - The date string to format
 * @returns Formatted date string or empty string if invalid
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return ""

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return dateString // Return original string if parsing fails
  }
}

/**
 * Formats a date string to "June 29, 2005" format for display
 * @param dateString - The date string to format
 * @returns Formatted date string or "N/A" if invalid
 */
export function formatDateDisplay(dateString?: string): string {
  if (!dateString) return "N/A"

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return "N/A"
  }
} 