/**
 * Video Link Preview Component
 * Special handling for video links (YouTube, Vimeo, etc.)
 * Phase 4: Enterprise Link Post Component
 */

'use client'

import React, { useState } from 'react'
import { Play, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { LinkPreviewMetadata } from '@/types/link-preview'
import { EnterpriseLinkPreviewCard } from './enterprise-link-preview-card'

export interface VideoLinkPreviewProps {
  url: string
  metadata?: LinkPreviewMetadata
  className?: string
}

/**
 * Extract YouTube video ID from URL
 */
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Extract Vimeo video ID from URL
 */
function getVimeoVideoId(url: string): string | null {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /vimeo\.com\/video\/(\d+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Get video embed URL
 */
function getVideoEmbedUrl(url: string): string | null {
  const youtubeId = getYouTubeVideoId(url)
  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}?autoplay=1`
  }

  const vimeoId = getVimeoVideoId(url)
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}?autoplay=1`
  }

  return null
}

/**
 * Get video thumbnail URL
 */
function getVideoThumbnailUrl(url: string): string | null {
  const youtubeId = getYouTubeVideoId(url)
  if (youtubeId) {
    return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
  }

  const vimeoId = getVimeoVideoId(url)
  if (vimeoId) {
    // Vimeo requires API call for thumbnail, use placeholder for now
    return null
  }

  return null
}

/**
 * Video Link Preview Component
 */
export function VideoLinkPreview({
  url,
  metadata,
  className,
}: VideoLinkPreviewProps) {
  const [showEmbed, setShowEmbed] = useState(false)
  const embedUrl = getVideoEmbedUrl(url)
  const thumbnailUrl = getVideoThumbnailUrl(url) || metadata?.image_url

  // If no embed URL, fall back to regular link preview
  if (!embedUrl) {
    return (
      <EnterpriseLinkPreviewCard
        url={url}
        metadata={metadata}
        layout="horizontal"
        className={className}
      />
    )
  }

  // Show embed player
  if (showEmbed) {
    return (
      <div className={cn('rounded-lg border bg-card overflow-hidden', className)}>
        <div className="relative aspect-video w-full">
          <iframe
            src={embedUrl}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video player"
          />
        </div>
        {metadata?.title && (
          <div className="p-4">
            <h3 className="font-semibold">{metadata.title}</h3>
            {metadata.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {metadata.description}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  // Show preview with play button
  return (
    <div className={cn('relative rounded-lg border bg-card overflow-hidden group', className)}>
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={metadata?.title || 'Video thumbnail'}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Play className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity group-hover:bg-black/30">
          <Button
            size="lg"
            className="rounded-full"
            onClick={() => setShowEmbed(true)}
          >
            <Play className="h-6 w-6 mr-2 fill-current" />
            Play Video
          </Button>
        </div>
      </div>

      {/* Video info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold line-clamp-2">
              {metadata?.title || 'Video'}
            </h3>
            {metadata?.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {metadata.description}
              </p>
            )}
            {metadata?.site_name && (
              <p className="mt-1 text-xs text-muted-foreground">
                {metadata.site_name}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="flex-shrink-0"
          >
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
