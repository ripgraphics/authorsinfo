/**
 * TagDisplay Component
 * Renders tags as interactive links with proper styling
 */

'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Hash, AtSign } from 'lucide-react'
import { TagPreviewCard, type TagPreviewData } from './tag-preview-card'

export interface TagDisplayProps {
  name: string
  slug: string
  type: 'user' | 'entity' | 'topic' | 'collaborator' | 'location' | 'taxonomy'
  avatarUrl?: string
  sublabel?: string
  className?: string
  onClick?: () => void
  showPreview?: boolean
  previewData?: TagPreviewData
  onPreviewLoad?: (slug: string) => Promise<TagPreviewData | null>
}

export function TagDisplay({
  name,
  slug,
  type,
  avatarUrl,
  sublabel,
  className,
  onClick,
  showPreview = false,
  previewData,
  onPreviewLoad,
}: TagDisplayProps) {
  const [showPreviewCard, setShowPreviewCard] = useState(false)
  const [preview, setPreview] = useState<TagPreviewData | null>(previewData || null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const tagRef = useRef<HTMLSpanElement>(null)

  const prefix = type === 'topic' ? '#' : '@'
  
  // Compute href reactively based on current preview/metadata
  // Uses entity_id (UUID) from metadata for user tags
  const href = useMemo(() => {
    const metadata = preview?.metadata || previewData?.metadata
    return getTagHref(type, slug, metadata)
  }, [type, slug, preview, previewData])

  const handleMouseEnter = async () => {
    if (!showPreview) return

    hoverTimeoutRef.current = setTimeout(async () => {
      if (!preview) {
        setIsLoadingPreview(true)
        try {
          // Load preview from API
          const response = await fetch(`/api/tags/preview?slug=${encodeURIComponent(slug)}&type=${type}`)
          if (response.ok) {
            const data = await response.json()
            if (data.preview) {
              setPreview(data.preview)
              setShowPreviewCard(true)
            }
          }
        } catch (error) {
          console.error('Error loading preview:', error)
        } finally {
          setIsLoadingPreview(false)
        }
      } else {
        setShowPreviewCard(true)
      }
    }, 500) // 500ms delay before showing preview
  }

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setShowPreviewCard(false)
  }

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  const content = (
    <span
      ref={tagRef}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-sm font-medium transition-colors',
        'cursor-pointer',
        type === 'user' && 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
        type === 'entity' && 'text-purple-600 hover:text-purple-700 hover:bg-purple-50',
        type === 'topic' && 'text-green-600 hover:text-green-700 hover:bg-green-50',
        type === 'location' && 'text-orange-600 hover:text-orange-700 hover:bg-orange-50',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={`Tag: ${prefix}${name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (onClick) onClick()
          else if (href) window.location.href = href
        }
      }}
    >
      {type === 'user' && avatarUrl && (
        <Avatar src={avatarUrl} alt={name} name={name} size="xs" className="w-4 h-4" />
      )}
      {type === 'topic' && <Hash className="h-3 w-3" />}
      {type === 'entity' && <AtSign className="h-3 w-3" />}
      <span>{prefix}{name}</span>
    </span>
  )

  const tagElement = (
    <>
      {onClick ? (
        <button type="button" onClick={onClick} className="inline-block">
          {content}
        </button>
      ) : href ? (
        <Link href={href} className="inline-block">
          {content}
        </Link>
      ) : (
        content
      )}
      {showPreview && showPreviewCard && preview && (
        <TagPreviewCard
          tag={preview}
          position="bottom"
          onClose={() => setShowPreviewCard(false)}
        />
      )}
    </>
  )

  return <span className="relative inline-block">{tagElement}</span>
}

function getTagHref(
  type: TagDisplayProps['type'],
  slug: string,
  metadata?: Record<string, any>
): string | null {
  switch (type) {
    case 'user':
      // Use entity_id (UUID) from metadata for user tags, fallback to slug if not available
      const userId = metadata?.entity_id || slug
      return `/profile/${userId}`
    case 'entity':
      // Entity type would need to be passed separately to determine the correct route
      // For now, return a generic route
      return `/entities/${slug}`
    case 'topic':
      return `/tags/${slug}`
    case 'location':
      return `/locations/${slug}`
    default:
      return null
  }
}

/**
 * Render tags in text content
 */
export function renderTagsInText(
  text: string,
  tags: Array<{
    name: string
    slug: string
    type: TagDisplayProps['type']
    position: { start: number; end: number }
    avatarUrl?: string
  }>
): React.ReactNode[] {
  if (!tags || tags.length === 0) {
    return [<span key="text">{text}</span>]
  }

  // Sort tags by position (reverse to replace from end to start)
  const sortedTags = [...tags].sort((a, b) => b.position.start - a.position.start)

  const parts: React.ReactNode[] = []
  let lastIndex = text.length

  for (const tag of sortedTags) {
    // Add text after tag
    if (tag.position.end < lastIndex) {
      parts.unshift(<span key={`text-${tag.position.end}`}>{text.substring(tag.position.end, lastIndex)}</span>)
    }

    // Add tag
    parts.unshift(
      <TagDisplay
        key={`tag-${tag.position.start}`}
        name={tag.name}
        slug={tag.slug}
        type={tag.type}
        avatarUrl={tag.avatarUrl}
      />
    )

    // Add text before tag
    if (tag.position.start > 0) {
      const textBefore = text.substring(0, tag.position.start)
      parts.unshift(<span key={`text-${tag.position.start}`}>{textBefore}</span>)
    }

    lastIndex = tag.position.start
  }

  // Add remaining text at the beginning
  if (lastIndex > 0) {
    parts.unshift(<span key="text-start">{text.substring(0, lastIndex)}</span>)
  }

  return parts
}
