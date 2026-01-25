/**
 * Link Preview Image with Controls
 * Reusable image display with optional swap/remove overlay buttons.
 * Supports fixed-aspect or intrinsic (full-image) display. Enterprise-grade.
 */

'use client'

import React, { useState, useCallback } from 'react'
import Image from 'next/image'
import { ArrowLeftRight, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=='

const ASPECT_MAP = {
  '2/3': 'aspect-[2/3]',
  '3/4': 'aspect-[3/4]',
  '1/1': 'aspect-square',
  '16/9': 'aspect-video',
} as const

const WIDTH_PX = { 'w-40': 160, 'w-48': 192, 'w-56': 224, 'w-full': '100%' } as const
const MAX_HEIGHT_PX = 320

export type LinkPreviewImageAspectRatio = keyof typeof ASPECT_MAP
export type LinkPreviewImageWidth = keyof typeof WIDTH_PX

export interface LinkPreviewImageWithControlsProps {
  imageUrl: string
  alt: string
  /** Use image intrinsic aspect ratio (always show full image). Ignores aspectRatio when true. */
  adaptAspect?: boolean
  aspectRatio?: LinkPreviewImageAspectRatio
  width?: LinkPreviewImageWidth
  /** Max height in px when adaptAspect. Default 320. */
  maxHeight?: number
  onSwap?: () => void
  onRemove?: () => void
  showControls?: boolean
  className?: string
  unoptimized?: boolean
  /** Optional image load error callback */
  onError?: () => void
  /** Optional image load success callback */
  onLoad?: () => void
}

/**
 * Reusable link preview image. Enterprise-grade: full-image display,
 * optional overlay controls, loading/error handling, a11y.
 */
export function LinkPreviewImageWithControls({
  imageUrl,
  alt,
  adaptAspect = false,
  aspectRatio = '2/3',
  width = 'w-48',
  maxHeight = MAX_HEIGHT_PX,
  onSwap,
  onRemove,
  showControls = false,
  className,
  unoptimized = false,
  onError,
  onLoad,
}: LinkPreviewImageWithControlsProps) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const showOverlay =
    showControls || typeof onSwap === 'function' || typeof onRemove === 'function'
  const widthVal = WIDTH_PX[width]
  const widthNum = typeof widthVal === 'number' ? widthVal : 9999
  const useUnoptimized =
    unoptimized || imageUrl.includes('authorsinfo.com/_next/image')

  const handleLoad = useCallback(() => {
    setLoaded(true)
    setErrored(false)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    setErrored(true)
    setLoaded(false)
    onError?.()
  }, [onError])

  if (errored) {
    return (
      <div
        className={cn(
          'relative flex-shrink-0 overflow-hidden bg-muted flex items-center justify-center',
          !adaptAspect && width,
          !adaptAspect && ASPECT_MAP[aspectRatio],
          className
        )}
        style={
          adaptAspect
            ? {
                minWidth: 80,
                maxWidth: widthVal === '100%' ? '100%' : widthNum,
                minHeight: 120,
              }
            : undefined
        }
        role="img"
        aria-label={alt}
      >
        <span className="text-xs text-muted-foreground px-2 text-center">
          Image unavailable
        </span>
      </div>
    )
  }

  if (adaptAspect) {
    return (
      <div
        className={cn(
          'relative flex-shrink-0 overflow-hidden bg-muted flex items-center justify-center',
          width === 'w-full' && 'w-full',
          className
        )}
        style={
          width === 'w-full'
            ? { minWidth: 80 }
            : { maxWidth: widthNum, minWidth: 80 }
        }
      >
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'max-w-full w-auto h-auto object-contain',
            !loaded && 'opacity-0',
            loaded && 'opacity-100 transition-opacity duration-200'
          )}
          style={{ maxHeight: maxHeight }}
        />
        {!loaded && !errored && (
          <div
            className="absolute inset-0 bg-muted animate-pulse"
            aria-hidden="true"
          />
        )}
        {showOverlay && loaded && (
          <div
            className="absolute top-2 left-2 flex gap-1.5 z-10"
            role="group"
            aria-label="Image actions"
          >
            {onSwap && (
              <Button
                variant="ghost"
                size="icon"
                type="button"
                className="h-8 w-8 rounded-full bg-white hover:bg-white/95 text-gray-800 shadow-lg backdrop-blur-sm border border-gray-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onSwap()
                }}
                aria-label="Change image"
              >
                <ArrowLeftRight className="h-4 w-4" aria-hidden />
              </Button>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                type="button"
                className="h-8 w-8 rounded-full bg-white hover:bg-white/95 text-gray-800 shadow-lg backdrop-blur-sm border border-gray-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onRemove()
                }}
                aria-label="Remove image"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex-shrink-0 overflow-hidden bg-muted',
        width,
        ASPECT_MAP[aspectRatio],
        className
      )}
    >
      <Image
        src={imageUrl}
        alt={alt}
        fill
        className="object-contain"
        sizes={`${widthNum}px`}
        loading="lazy"
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        unoptimized={useUnoptimized}
        onLoad={handleLoad}
        onError={handleError}
      />
      {showOverlay && (
        <div
          className="absolute top-2 left-2 flex gap-1.5 z-10"
          role="group"
          aria-label="Image actions"
        >
          {onSwap && (
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="h-8 w-8 rounded-full bg-white hover:bg-white/95 text-gray-800 shadow-lg backdrop-blur-sm border border-gray-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onSwap()
              }}
              aria-label="Change image"
            >
              <ArrowLeftRight className="h-4 w-4" aria-hidden />
            </Button>
          )}
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="h-8 w-8 rounded-full bg-white hover:bg-white/95 text-gray-800 shadow-lg backdrop-blur-sm border border-gray-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onRemove()
              }}
              aria-label="Remove image"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
