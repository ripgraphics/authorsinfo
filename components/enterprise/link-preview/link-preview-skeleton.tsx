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

  // Compact layout (portrait-style image placeholder to match LinkPreviewImageWithControls)
  if (layout === 'compact') {
    return (
      <div
        className={cn(
          'rounded-lg border bg-card overflow-hidden',
          className
        )}
      >
        <div className="flex items-start gap-0">
          <div className="relative w-24 aspect-[2/3] flex-shrink-0 overflow-hidden bg-muted">
            <Shimmer />
          </div>
          <div className="min-w-0 flex-1 p-4 space-y-2">
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

  // Vertical layout — full-width image placeholder (matches adaptAspect full-image)
  if (layout === 'vertical') {
    return (
      <div
        className={cn(
          'overflow-hidden rounded-lg border bg-card',
          className
        )}
      >
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted">
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

  // Horizontal layout (default) — portrait-style image to match full-image display
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border bg-card',
        className
      )}
    >
      <div className="flex items-start">
        <div className="relative w-40 aspect-[2/3] flex-shrink-0 overflow-hidden bg-muted">
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
