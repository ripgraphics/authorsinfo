'use client'

import React from 'react'

interface FollowersDisplayProps {
  count: number | undefined | null
  className?: string
  showIcon?: boolean
  variant?: 'default' | 'compact'
}

/**
 * Reusable component for displaying follower count
 * Only renders when count > 0
 * Handles pluralization automatically
 */
export function FollowersDisplay({
  count,
  className = '',
  showIcon = false,
  variant = 'default',
}: FollowersDisplayProps) {
  // Don't render if count is 0, undefined, or null
  if (count === undefined || count === null || count === 0) {
    return null
  }

  const displayText = count === 1 ? '1 follower' : `${count} followers`

  if (variant === 'compact') {
    return <span className={className}>{displayText}</span>
  }

  return (
    <span className={className}>
      {showIcon && <span className="inline-block mr-1">👥</span>}
      {displayText}
    </span>
  )
}