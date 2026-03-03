/**
 * TaggedTextRenderer Component
 * Renders text content with inline mentions (@) and hashtags (#) as hoverable tag links
 * Each tag shows a preview card on hover with user/entity/topic details
 */

'use client'

import React, { useMemo } from 'react'
import { TagDisplay } from './tag-display'
import { TagPreviewData } from './tag-preview-card'
import { cn } from '@/lib/utils'

export interface TaggedTextRendererProps {
  text: string
  className?: string
  /** Optional class name for text portion when media rendering is enabled */
  textClassName?: string
  /** Show preview cards on hover. Default true. */
  showPreviews?: boolean
  /** Parse image/GIF URLs and render them as media previews below text. Default false. */
  renderMediaUrls?: boolean
  /** Optional class name for rendered media elements */
  mediaClassName?: string
  /** Additional tagging data if available (from database) */
  taggings?: Array<{
    id: string
    tag_id: string
    tag_type: 'user' | 'entity' | 'topic'
    tag_name: string
    tag_slug: string
    entity_id?: string
    entity_type?: string
    avatar_url?: string
    tag_metadata?: Record<string, any>
  }>
  /** Callback when a tag is clicked */
  onTagClick?: (tag: { type: string; slug: string; name: string }) => void
}

interface ParsedSegment {
  type: 'text' | 'mention' | 'hashtag'
  content: string
  slug?: string
  entityType?: 'user' | 'entity'
}

const MEDIA_URL_REGEX = /https?:\/\/[^\s]+\.(?:gif|png|jpe?g|webp|avif)(?:\?[^\s]*)?/gi

function extractMediaUrls(text: string): string[] {
  if (!text) return []
  return Array.from(new Set(text.match(MEDIA_URL_REGEX) || []))
}

function stripMediaUrls(text: string): string {
  if (!text) return ''
  return text.replace(MEDIA_URL_REGEX, '').replace(/\n{3,}/g, '\n\n').trim()
}

/**
 * Parse text content to extract mentions and hashtags while preserving text structure
 */
function parseTextWithTags(text: string): ParsedSegment[] {
  if (!text) return []

  const segments: ParsedSegment[] = []
  // Match @mentions (word characters) and #hashtags (word characters)
  const tagPattern = /(@[a-zA-Z][a-zA-Z0-9_]*|#[a-zA-Z][a-zA-Z0-9_]*)/g

  let lastIndex = 0
  let match

  while ((match = tagPattern.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      })
    }

    // Add the tag
    const tagText = match[0]
    const isHashtag = tagText.startsWith('#')
    const tagName = tagText.substring(1) // Remove @ or #

    segments.push({
      type: isHashtag ? 'hashtag' : 'mention',
      content: tagName,
      slug: tagName.toLowerCase(),
      entityType: isHashtag ? undefined : 'user', // Default mentions to user type
    })

    lastIndex = match.index + tagText.length
  }

  // Add remaining text after last match
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex),
    })
  }

  return segments
}

/**
 * TaggedTextRenderer - renders text with interactive tag links
 */
export function TaggedTextRenderer({
  text,
  className,
  textClassName,
  showPreviews = true,
  renderMediaUrls = false,
  mediaClassName,
  taggings = [],
  onTagClick,
}: TaggedTextRendererProps) {
  // Create lookup maps for tagging data
  const taggingsBySlug = useMemo(() => {
    const map: Record<string, (typeof taggings)[0]> = {}
    for (const t of taggings) {
      if (t.tag_slug) {
        map[t.tag_slug.toLowerCase()] = t
      }
    }
    return map
  }, [taggings])

  const mediaUrls = useMemo(() => (renderMediaUrls ? extractMediaUrls(text) : []), [renderMediaUrls, text])
  const textWithoutMedia = useMemo(
    () => (renderMediaUrls ? stripMediaUrls(text) : text),
    [renderMediaUrls, text]
  )

  // Parse text into segments
  const segments = useMemo(() => parseTextWithTags(textWithoutMedia), [textWithoutMedia])

  if (segments.length === 0 && mediaUrls.length === 0) {
    return null
  }

  const textContent = (
    <span className={cn('whitespace-pre-wrap break-words', textClassName)}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={index}>{segment.content}</span>
        }

        // Look up tagging data if available
        const tagging = segment.slug ? taggingsBySlug[segment.slug] : undefined

        // Determine tag type and properties
        const isHashtag = segment.type === 'hashtag'
        const tagType = isHashtag
          ? 'topic'
          : tagging?.tag_type === 'entity'
            ? 'entity'
            : 'user'
        const tagSlug = tagging?.tag_slug || segment.slug || segment.content.toLowerCase()
        const tagName = tagging?.tag_name || segment.content
        const avatarUrl = tagging?.avatar_url
        const tagMetadata = tagging?.tag_metadata

        // Create preview data with metadata for user tags to get correct permalink
        const previewData: TagPreviewData | undefined = tagMetadata ? {
          id: tagging?.tag_id || '',
          name: tagName,
          slug: tagSlug,
          type: tagType as TagPreviewData['type'],
          metadata: tagMetadata,
        } : undefined

        return (
          <TagDisplay
            key={`${segment.type}-${index}-${tagSlug}`}
            name={tagName}
            slug={tagSlug}
            type={tagType}
            avatarUrl={avatarUrl}
            showPreview={showPreviews}
            previewData={previewData}
            onClick={
              onTagClick
                ? () => onTagClick({ type: tagType, slug: tagSlug, name: tagName })
                : undefined
            }
          />
        )
      })}
    </span>
  )

  if (!renderMediaUrls) {
    return <span className={className}>{textContent}</span>
  }

  return (
    <div className={cn('space-y-2', className)}>
      {segments.length > 0 ? textContent : null}
      {mediaUrls.length > 0 ? (
        <div className="space-y-2">
          {mediaUrls.map((mediaUrl) => (
            <img
              key={mediaUrl}
              src={mediaUrl}
              alt="Comment media"
              className={cn(
                'rounded-xl border border-gray-200 max-h-[320px] w-auto max-w-full object-cover',
                mediaClassName
              )}
              loading="lazy"
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Hook to check if text contains any tags
 */
export function useHasTags(text: string): boolean {
  return useMemo(() => {
    if (!text) return false
    return /@[a-zA-Z][a-zA-Z0-9_]*|#[a-zA-Z][a-zA-Z0-9_]*/.test(text)
  }, [text])
}

/**
 * Extract mentions and hashtags from text
 */
export function extractTagsFromText(text: string): {
  mentions: string[]
  hashtags: string[]
} {
  if (!text) return { mentions: [], hashtags: [] }

  const mentions: string[] = []
  const hashtags: string[] = []

  const mentionPattern = /@([a-zA-Z][a-zA-Z0-9_]*)/g
  const hashtagPattern = /#([a-zA-Z][a-zA-Z0-9_]*)/g

  let match
  while ((match = mentionPattern.exec(text)) !== null) {
    if (!mentions.includes(match[1].toLowerCase())) {
      mentions.push(match[1].toLowerCase())
    }
  }

  while ((match = hashtagPattern.exec(text)) !== null) {
    if (!hashtags.includes(match[1].toLowerCase())) {
      hashtags.push(match[1].toLowerCase())
    }
  }

  return { mentions, hashtags }
}
