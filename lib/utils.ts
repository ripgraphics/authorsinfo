import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format follower count for display
 * Only returns formatted string if count > 0
 * @param count - Number of followers
 * @returns Formatted string like "150 followers" or "1 follower", or empty string if 0
 */
export function formatFollowersCount(count: number | undefined | null): string {
  if (count === undefined || count === null || count === 0) {
    return ''
  }
  return count === 1 ? '1 follower' : `${count} followers`
}

/**
 * Format mutual friends count for display
 * Only returns formatted string if count > 0
 * @param count - Number of mutual friends
 * @returns Formatted string like "5 mutual friends" or "1 mutual friend", or empty string if 0
 */
export function formatMutualFriendsCount(count: number | undefined | null): string {
  if (count === undefined || count === null || count === 0) {
    return ''
  }
  return count === 1 ? '1 mutual friend' : `${count} mutual friends`
}
