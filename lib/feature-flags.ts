/**
 * Feature Flags Configuration
 * 
 * Centralized feature flags that can be easily migrated to admin settings later.
 * These flags control the visibility/enablement of various features throughout the application.
 * 
 * TODO: Migrate these to admin settings table when admin settings UI is ready
 */

export const FEATURE_FLAGS = {
  /**
   * Enable/disable the page banner on book detail pages
   * Default: false (disabled)
   * 
   * When enabled, displays a carousel banner at the top of book detail pages.
   * Can be configured per-book or globally via admin settings in the future.
   */
  BOOK_PAGE_BANNER_ENABLED: false,
} as const

/**
 * Type-safe accessor for feature flags
 */
export type FeatureFlag = keyof typeof FEATURE_FLAGS

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag]
}
