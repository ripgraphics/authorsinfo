/**
 * Link Preview Image with Controls
 * Reusable image display with swap/remove overlay buttons.
 * Use in link preview cards, post composer, or any app surface.
 */

'use client'

import React from 'react'
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

export type LinkPreviewImageAspectRatio = keyof typeof ASPECT_MAP
export type LinkPreviewImageWidth = 'w-40' | 'w-48' | 'w-56'

export interface LinkPreviewImageWithControlsProps {
  imageUrl: string
  alt: string
  aspectRatio?: LinkPreviewImageAspectRatio
  width?: LinkPreviewImageWidth
  onSwap?: () => void
  onRemove?: () => void
  showControls?: boolean
  className?: string
  /** Skip Next.js image optimization for certain domains (e.g. same-origin _next/image URLs) */
  unoptimized?: boolean
}

/**
 * Reusable link preview image with optional swap/remove overlay buttons.
 * Full image visible via object-contain; no square crop.
 */
export function LinkPreviewImageWithControls({
  imageUrl,
  alt,
  aspectRatio = '2/3',
  width = 'w-48',
  onSwap,
  onRemove,
  showControls = false,
  className,
  unoptimized = false,
}: LinkPreviewImageWithControlsProps) {
  const showOverlay =
    showControls || typeof onSwap === 'function' || typeof onRemove === 'function'
  const widthNum = width === 'w-40' ? 160 : width === 'w-48' ? 192 : 224

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
        unoptimized={unoptimized || imageUrl.includes('authorsinfo.com/_next/image')}
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
              className="h-8 w-8 rounded-full bg-white hover:bg-white/95 text-gray-800 shadow-lg backdrop-blur-sm border border-gray-300"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onSwap()
              }}
              aria-label="Change image"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
          )}
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white hover:bg-white/95 text-gray-800 shadow-lg backdrop-blur-sm border border-gray-300"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onRemove()
              }}
              aria-label="Remove image"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
