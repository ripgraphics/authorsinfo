'use client'

import React from 'react'

interface MutualFriendsDisplayProps {
  count: number | undefined | null
  className?: string
  showIcon?: boolean
  variant?: 'default' | 'compact'
}

/**
 * Reusable component for displaying mutual friends count
 * Only renders when count > 0
 * Handles pluralization automatically
 */
export function MutualFriendsDisplay({
  count,
  className = '',
  showIcon = false,
  variant = 'default',
}: MutualFriendsDisplayProps) {
  // Don't render if count is 0, undefined, or null
  if (count === undefined || count === null || count === 0) {
    return null
  }

  const displayText = count === 1 ? '1 mutual friend' : `${count} mutual friends`

  if (variant === 'compact') {
    return <span className={className}>{displayText}</span>
  }

  return (
    <span className={className}>
      {showIcon && <span className="inline-block mr-1">🤝</span>}
      {displayText}
    </span>
  )
}