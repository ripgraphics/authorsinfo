/**
 * Global date formatting utilities for consistent date display across the application
 */

/**
 * Formats a date string or Date object to the standard application format: "Aug 20, 2025"
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string in "MMM DD, YYYY" format
 */
export function formatDate(date: string | Date | number): string {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatDate:', date)
      return 'Invalid Date'
    }

    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid Date'
  }
}

/**
 * Formats a date string or Date object to include time: "Aug 20, 2025 at 2:30 PM"
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string with time
 */
export function formatDateTime(date: string | Date | number): string {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatDateTime:', date)
      return 'Invalid Date'
    }

    const dateStr = dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

    const timeStr = dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    return `${dateStr} at ${timeStr}`
  } catch (error) {
    console.error('Error formatting date time:', error)
    return 'Invalid Date'
  }
}

/**
 * Formats a date string or Date object to relative time: "2 hours ago", "3 days ago"
 * @param date - Date string, Date object, or timestamp
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date | number): string {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatRelativeTime:', date)
      return 'Invalid Date'
    }

    const now = new Date()
    const diffInMs = now.getTime() - dateObj.getTime()
    const diffInSeconds = Math.floor(diffInMs / 1000)
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)
    const diffInWeeks = Math.floor(diffInDays / 7)
    const diffInMonths = Math.floor(diffInDays / 30)
    const diffInYears = Math.floor(diffInDays / 365)

    if (diffInSeconds < 60) {
      return 'just now'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
    } else if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks === 1 ? '' : ''} ago`
    } else if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`
    } else {
      return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`
    }
  } catch (error) {
    console.error('Error formatting relative time:', error)
    return 'Invalid Date'
  }
}

/**
 * Formats a date string or Date object to ISO format for database storage
 * @param date - Date string, Date object, or timestamp
 * @returns ISO date string
 */
export function formatISO(date: string | Date | number): string {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatISO:', date)
      return ''
    }

    return dateObj.toISOString()
  } catch (error) {
    console.error('Error formatting ISO date:', error)
    return ''
  }
}

/**
 * Checks if a date is today
 * @param date - Date string, Date object, or timestamp
 * @returns Boolean indicating if the date is today
 */
export function isToday(date: string | Date | number): boolean {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    const today = new Date()

    return dateObj.toDateString() === today.toDateString()
  } catch (error) {
    console.error('Error checking if date is today:', error)
    return false
  }
}

/**
 * Checks if a date is yesterday
 * @param date - Date string, Date object, or timestamp
 * @returns Boolean indicating if the date is yesterday
 */
export function isYesterday(date: string | Date | number): boolean {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    return dateObj.toDateString() === yesterday.toDateString()
  } catch (error) {
    console.error('Error checking if date is yesterday:', error)
    return false
  }
}
