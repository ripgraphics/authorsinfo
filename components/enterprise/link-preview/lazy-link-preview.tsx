/**
 * Lazy Link Preview Component
 * Lazy loads link previews using Intersection Observer
 * Phase 5: Enterprise Link Post Component
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { EnterpriseLinkPreviewCard } from './enterprise-link-preview-card'
import { LinkPreviewSkeleton } from './link-preview-skeleton'
import type { LinkPreviewMetadata } from '@/types/link-preview'

export interface LazyLinkPreviewProps {
  url: string
  metadata?: LinkPreviewMetadata
  layout?: 'horizontal' | 'vertical' | 'compact' | 'minimal'
  showImage?: boolean
  showDescription?: boolean
  showSiteName?: boolean
  showSecurityBadge?: boolean
  className?: string
  onLoad?: (metadata: LinkPreviewMetadata) => void
  onError?: (error: Error) => void
  trackAnalytics?: boolean
  rootMargin?: string
}

/**
 * Lazy Link Preview Component
 * Only loads preview when component is in viewport
 */
export function LazyLinkPreview({
  url,
  metadata,
  layout = 'horizontal',
  showImage = true,
  showDescription = true,
  showSiteName = true,
  showSecurityBadge = true,
  className,
  onLoad,
  onError,
  trackAnalytics = true,
  rootMargin = '200px', // Start loading 200px before entering viewport
}: LazyLinkPreviewProps) {
  const { ref, inView } = useInView({
    triggerOnce: true, // Only trigger once
    rootMargin,
    threshold: 0.1,
  })

  return (
    <div ref={ref} className={className}>
      {inView ? (
        <EnterpriseLinkPreviewCard
          url={url}
          metadata={metadata}
          layout={layout}
          showImage={showImage}
          showDescription={showDescription}
          showSiteName={showSiteName}
          showSecurityBadge={showSecurityBadge}
          onLoad={onLoad}
          onError={onError}
          trackAnalytics={trackAnalytics}
        />
      ) : (
        <LinkPreviewSkeleton layout={layout} />
      )}
    </div>
  )
}
