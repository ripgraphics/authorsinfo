/**
 * Enterprise Link Preview Card Component
 * Rich, Facebook-style link preview card
 * Phase 2: Enterprise Link Post Component
 */

'use client'

import React, { useState, useEffect, memo, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Globe, Lock, AlertTriangle, RefreshCw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { LinkPreviewMetadata } from '@/types/link-preview'
import { LinkPreviewSkeleton } from './link-preview-skeleton'
import { LinkPreviewError } from './link-preview-error'
import { VideoLinkPreview } from './video-link-preview'
import { LinkPreviewImageWithControls } from './link-preview-image-with-controls'

export interface EnterpriseLinkPreviewCardProps {
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
  onRefresh?: () => void
  onClick?: () => void
  onRemove?: () => void
  onImageChange?: (imageUrl: string) => void
  onRemoveImage?: () => void
  showImageControls?: boolean
  /** Compact layout only: image width. Default w-48. */
  compactImageWidth?: 'w-40' | 'w-48' | 'w-56'
  trackAnalytics?: boolean
}

type PreviewState = 'loading' | 'loaded' | 'error'

/**
 * Get link type badge color
 */
function getLinkTypeBadgeVariant(
  linkType?: string
): 'default' | 'secondary' | 'outline' {
  switch (linkType) {
    case 'article':
      return 'default'
    case 'video':
      return 'secondary'
    case 'product':
      return 'outline'
    default:
      return 'secondary'
  }
}

/**
 * Format domain for display
 */
function formatDomain(domain: string): string {
  return domain.replace(/^www\./, '')
}

/**
 * Format date for display
 */
function formatDate(dateString?: string): string {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  } catch {
    return ''
  }
}

/**
 * Enterprise Link Preview Card
 * Memoized for performance optimization
 */
export const EnterpriseLinkPreviewCard = memo(function EnterpriseLinkPreviewCard({
  url,
  metadata: initialMetadata,
  layout = 'horizontal',
  showImage = true,
  showDescription = true,
  showSiteName = true,
  showSecurityBadge = true,
  className,
  onImageChange,
  onRemoveImage,
  showImageControls,
  compactImageWidth = 'w-48',
  onLoad,
  onError,
  onRefresh,
  onClick,
  onRemove,
  trackAnalytics = true,
}: EnterpriseLinkPreviewCardProps) {
  const [metadata, setMetadata] = useState<LinkPreviewMetadata | undefined>(
    initialMetadata
  )
  const [state, setState] = useState<PreviewState>(
    initialMetadata ? 'loaded' : 'loading'
  )
  const [error, setError] = useState<Error | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Extract original URL from Next.js optimized URLs
  const extractOriginalUrl = (url: string): string => {
    try {
      // If it's a Next.js optimized URL, extract the original
      if (url.includes('/_next/image?url=')) {
        const urlObj = new URL(url)
        const originalUrl = urlObj.searchParams.get('url')
        if (originalUrl) {
          return decodeURIComponent(originalUrl)
        }
      }
      return url
    } catch {
      return url
    }
  }

  // Get all available images - must be called before any conditional returns
  const availableImages = useMemo(() => {
    if (!metadata) return []
    const { images, image_url, thumbnail_url } = metadata
    const imageList = images && images.length > 0 ? images : (image_url ? [image_url] : (thumbnail_url ? [thumbnail_url] : []))
    // Extract original URLs from any Next.js optimized URLs
    return imageList.map(extractOriginalUrl)
  }, [metadata?.images, metadata?.image_url, metadata?.thumbnail_url])
  
  // Reset image index when metadata changes
  useEffect(() => {
    if (metadata) {
      setSelectedImageIndex(0)
    }
  }, [metadata?.url])

  // Reset image index when available images change
  useEffect(() => {
    if (selectedImageIndex >= availableImages.length && availableImages.length > 0) {
      setSelectedImageIndex(0)
    }
  }, [availableImages.length, selectedImageIndex])

  // Track view when metadata is loaded
  useEffect(() => {
    if (metadata?.id && trackAnalytics && state === 'loaded') {
      // Track view analytics
      fetch('/api/link-preview/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link_preview_id: metadata.id,
          event_type: 'view',
        }),
      }).catch(console.error)
    }
  }, [metadata?.id, trackAnalytics, state])

  // Fetch metadata if not provided
  useEffect(() => {
    if (initialMetadata) {
      setMetadata(initialMetadata)
      setState('loaded')
      onLoad?.(initialMetadata)
      return
    }

    const fetchMetadata = async () => {
      try {
        setState('loading')
        const response = await fetch('/api/link-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch link preview')
        }

        const data = await response.json()
        if (data.success && data.data) {
          setMetadata(data.data)
          setState('loaded')
          onLoad?.(data.data)
        } else {
          throw new Error(data.error || 'Failed to fetch link preview')
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        setState('error')
        onError?.(error)
      }
    }

    fetchMetadata()
  }, [url, initialMetadata, onLoad, onError])

  // Handle refresh
  const handleRefresh = async () => {
    if (isRefreshing) return

    try {
      setIsRefreshing(true)
      const response = await fetch('/api/link-preview/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error('Failed to refresh link preview')
      }

      const data = await response.json()
      if (data.success && data.data) {
        setMetadata(data.data)
        setState('loaded')
        onLoad?.(data.data)
        onRefresh?.()
      } else {
        throw new Error(data.error || 'Failed to refresh link preview')
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      setState('error')
      onError?.(error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handle click
  const handleClick = () => {
    if (trackAnalytics && metadata?.id) {
      // Track click analytics
      fetch('/api/link-preview/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link_preview_id: metadata.id,
          event_type: 'click',
        }),
      }).catch(console.error)
    }
    onClick?.()
  }

  // Loading state
  if (state === 'loading') {
    return <LinkPreviewSkeleton layout={layout} className={className} />
  }

  // Error state
  if (state === 'error') {
    return (
      <LinkPreviewError
        error={error}
        url={url}
        onRetry={handleRefresh}
        className={className}
      />
    )
  }

  // No metadata
  if (!metadata) {
    return (
      <div
        className={cn(
          'rounded-lg border bg-card p-4',
          className
        )}
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          {url}
        </a>
      </div>
    )
  }

  // Check if this is a video link
  const isVideoLink = metadata.link_type === 'video' || 
    url.includes('youtube.com') || 
    url.includes('youtu.be') || 
    url.includes('vimeo.com')

  if (isVideoLink) {
    return (
      <VideoLinkPreview
        url={url}
        metadata={metadata}
        className={className}
      />
    )
  }

  const {
    title,
    description,
    image_url,
    thumbnail_url,
    favicon_url,
    site_name,
    domain,
    link_type,
    author,
    published_at,
    security_score,
  } = metadata

  const displayImage = showImage && availableImages.length > 0 ? availableImages[selectedImageIndex] : null
  const displayTitle = title || formatDomain(domain)
  const displayDescription = showDescription ? description : undefined
  const displaySiteName = showSiteName ? (site_name || formatDomain(domain)) : undefined
  const hasMultipleImages = availableImages.length > 1

  // Swap image: cycle to next when multiple; no-op when single (parent may use for "replace" later)
  const handleSwapImage = () => {
    if (hasMultipleImages) {
      const newIndex = selectedImageIndex < availableImages.length - 1 ? selectedImageIndex + 1 : 0
      setSelectedImageIndex(newIndex)
      onImageChange?.(availableImages[newIndex])
    }
  }

  // Minimal layout
  if (layout === 'minimal') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={cn(
          'inline-flex items-center gap-2 text-sm text-blue-600 hover:underline',
          className
        )}
      >
        {favicon_url && (
          <Image
            src={favicon_url}
            alt=""
            width={16}
            height={16}
            className="rounded"
            unoptimized
          />
        )}
        <span>{displayTitle}</span>
        <ExternalLink className="h-3 w-3" />
      </a>
    )
  }

  // Compact layout (horizontal: image on left, description on right)
  const compactShowImageControls =
    showImageControls || !!onRemove || !!onImageChange || !!onRemoveImage

  if (layout === 'compact') {
    return (
      <div className={cn('relative group', className)}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          onClick={handleClick}
          className={cn(
            'block rounded-lg border bg-card overflow-hidden transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            onRemove && 'pr-10'
          )}
          aria-label={`Open link: ${displayTitle || url}`}
          role="link"
          tabIndex={0}
        >
          <div className="flex items-start gap-0">
            {displayImage ? (
              <LinkPreviewImageWithControls
                imageUrl={displayImage}
                alt={displayTitle || 'Link preview image'}
                adaptAspect
                width={compactImageWidth}
                maxHeight={320}
                onSwap={compactShowImageControls ? handleSwapImage : undefined}
                onRemove={
                  compactShowImageControls && onRemoveImage ? () => onRemoveImage() : undefined
                }
                showControls={compactShowImageControls}
                unoptimized={displayImage.includes('authorsinfo.com/_next/image')}
              />
            ) : null}
            {/* Content on the right */}
            <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
              {displaySiteName && (
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  {displaySiteName}
                </p>
              )}
              <h4 className="text-base font-semibold line-clamp-2 mb-2">
                {displayTitle}
              </h4>
              {displayDescription && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {displayDescription}
                </p>
              )}
            </div>
          </div>
        </a>
        {/* Remove link button (top-right corner of entire card) */}
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemove()
            }}
            aria-label="Remove link"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  // Vertical layout
  if (layout === 'vertical') {
    return (
      <div
        className={cn(
          'overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md',
          className
        )}
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          onClick={handleClick}
          className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`Open link: ${displayTitle || url}`}
          tabIndex={0}
        >
          {displayImage && (
            <LinkPreviewImageWithControls
              imageUrl={displayImage}
              alt={displayTitle || 'Link preview image'}
              adaptAspect
              width="w-full"
              maxHeight={320}
              showControls={false}
              unoptimized={displayImage.includes('authorsinfo.com/_next/image')}
              className="w-full rounded-t-lg"
            />
          )}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {favicon_url && (
                    <Image
                      src={favicon_url}
                      alt=""
                      width={16}
                      height={16}
                      className="rounded"
                      unoptimized
                    />
                  )}
                  {displaySiteName && (
                    <span className="text-xs text-muted-foreground">
                      {displaySiteName}
                    </span>
                  )}
                </div>
                <h3 className="mt-2 line-clamp-2 text-base font-semibold">
                  {displayTitle}
                </h3>
                {displayDescription && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {displayDescription}
                  </p>
                )}
                {author && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    by {author}
                  </p>
                )}
                {published_at && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(published_at)}
                  </p>
                )}
              </div>
              {link_type && (
                <Badge variant={getLinkTypeBadgeVariant(link_type)}>
                  {link_type}
                </Badge>
              )}
            </div>
            {showSecurityBadge && security_score !== undefined && security_score < 70 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                <span>Security warning</span>
              </div>
            )}
          </div>
        </a>
        {onRefresh && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                handleRefresh()
              }}
              disabled={isRefreshing}
              className="w-full"
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
              Refresh Preview
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Horizontal layout (default) — full image, portrait aspect, no overlay
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md',
        className
      )}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={handleClick}
        className="flex items-start rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`Open link: ${displayTitle || url}`}
        role="link"
        tabIndex={0}
      >
        {displayImage && (
          <LinkPreviewImageWithControls
            imageUrl={displayImage}
            alt={displayTitle || 'Link preview image'}
            adaptAspect
            width="w-40"
            maxHeight={320}
            showControls={false}
            unoptimized={displayImage.includes('authorsinfo.com/_next/image')}
            className="rounded-l-lg"
          />
        )}
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {favicon_url && (
                  <Image
                    src={favicon_url}
                    alt=""
                    width={16}
                    height={16}
                    className="rounded"
                    unoptimized
                  />
                )}
                {displaySiteName && (
                  <span className="text-xs text-muted-foreground">
                    {displaySiteName}
                  </span>
                )}
                {link_type && (
                  <Badge variant={getLinkTypeBadgeVariant(link_type)} className="text-xs">
                    {link_type}
                  </Badge>
                )}
              </div>
              <h3 className="mt-2 line-clamp-2 text-base font-semibold">
                {displayTitle}
              </h3>
              {displayDescription && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {displayDescription}
                </p>
              )}
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                {author && <span>by {author}</span>}
                {published_at && <span>{formatDate(published_at)}</span>}
                {showSecurityBadge && security_score !== undefined && security_score < 70 && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    Security warning
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </a>
      {onRefresh && (
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              handleRefresh()
            }}
            disabled={isRefreshing}
            className="w-full"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh Preview
          </Button>
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for memoization
  return (
    prevProps.url === nextProps.url &&
    prevProps.layout === nextProps.layout &&
    prevProps.showImage === nextProps.showImage &&
    prevProps.showDescription === nextProps.showDescription &&
    prevProps.showSiteName === nextProps.showSiteName &&
    prevProps.showSecurityBadge === nextProps.showSecurityBadge &&
    prevProps.compactImageWidth === nextProps.compactImageWidth &&
    prevProps.trackAnalytics === nextProps.trackAnalytics &&
    JSON.stringify(prevProps.metadata) === JSON.stringify(nextProps.metadata)
  )
})
