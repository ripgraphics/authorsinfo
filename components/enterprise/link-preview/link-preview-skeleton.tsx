/**
 * Link Preview Skeleton Component
 * Loading skeleton for link preview cards
 * Phase 2: Enterprise Link Post Component
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface LinkPreviewSkeletonProps {
  layout?: 'horizontal' | 'vertical' | 'compact' | 'minimal'
  className?: string
}

/**
 * Shimmer animation effect
 */
function Shimmer() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  )
}

/**
 * Link Preview Skeleton
 */
export function LinkPreviewSkeleton({
  layout = 'horizontal',
  className,
}: LinkPreviewSkeletonProps) {
  // Minimal layout
  if (layout === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="h-4 w-4 rounded bg-muted" />
        <div className="h-4 w-24 rounded bg-muted" />
      </div>
    )
  }

  // Compact layout
  if (layout === 'compact') {
    return (
      <div
        className={cn(
          'rounded-lg border bg-card p-3',
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-muted">
            <Shimmer />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-muted">
              <Shimmer />
            </div>
            <div className="h-3 w-1/2 rounded bg-muted">
              <Shimmer />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Vertical layout
  if (layout === 'vertical') {
    return (
      <div
        className={cn(
          'overflow-hidden rounded-lg border bg-card',
          className
        )}
      >
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <Shimmer />
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-muted">
              <Shimmer />
            </div>
            <div className="h-3 w-24 rounded bg-muted">
              <Shimmer />
            </div>
          </div>
          <div className="h-5 w-full rounded bg-muted">
            <Shimmer />
          </div>
          <div className="h-4 w-3/4 rounded bg-muted">
            <Shimmer />
          </div>
          <div className="h-3 w-1/2 rounded bg-muted">
            <Shimmer />
          </div>
        </div>
      </div>
    )
  }

  // Horizontal layout (default)
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border bg-card',
        className
      )}
    >
      <div className="flex">
        <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden bg-muted sm:h-40 sm:w-40">
          <Shimmer />
        </div>
        <div className="flex flex-1 flex-col p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-muted">
              <Shimmer />
            </div>
            <div className="h-3 w-24 rounded bg-muted">
              <Shimmer />
            </div>
          </div>
          <div className="h-5 w-full rounded bg-muted">
            <Shimmer />
          </div>
          <div className="h-4 w-3/4 rounded bg-muted">
            <Shimmer />
          </div>
          <div className="h-3 w-1/2 rounded bg-muted">
            <Shimmer />
          </div>
        </div>
      </div>
    </div>
  )
}
