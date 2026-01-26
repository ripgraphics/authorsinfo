/**
 * Post Composer with Live Link Preview
 * Text input with real-time link detection and preview
 * Enhanced with inline tag autocomplete for mentions (@) and hashtags (#)
 * Phase 1: Create Post Modal with Live Link Preview
 */

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useLinkDetection } from '@/hooks/use-link-detection'
import { TagEnabledTextarea, type ExtractedTag } from '@/components/tags/tag-enabled-textarea'
import { EnterpriseLinkPreviewCard } from '@/components/enterprise/link-preview/enterprise-link-preview-card'
import { LinkPreviewSkeleton } from '@/components/enterprise/link-preview/link-preview-skeleton'
import type { LinkPreviewMetadata } from '@/types/link-preview'
import { cn } from '@/lib/utils'

export interface PostComposerWithPreviewProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  onLinkPreviewChange?: (preview: LinkPreviewMetadata | null) => void
  onTagsExtracted?: (tags: ExtractedTag[]) => void
  /** Compact layout image width when showing link preview. Default w-48. */
  previewImageWidth?: 'w-32' | 'w-36' | 'w-40' | 'w-48' | 'w-56'
  className?: string
  /** Enable inline tag autocomplete. Default true. */
  enableTagAutocomplete?: boolean
}

/**
 * Post Composer with Live Link Preview
 */
export function PostComposerWithPreview({
  value,
  onChange,
  placeholder = "What's on your mind?",
  maxLength = 5000,
  onLinkPreviewChange,
  onTagsExtracted,
  previewImageWidth = 'w-48',
  className,
  enableTagAutocomplete = true,
}: PostComposerWithPreviewProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [linkPreview, setLinkPreview] = useState<LinkPreviewMetadata | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [previewProgress, setPreviewProgress] = useState(0)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const currentPreviewUrlRef = useRef<string | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Use link detection hook (faster debounce for quicker preview)
  const { detectedLinks, setText } = useLinkDetection(value, {
    debounceMs: 150,
    autoDetect: true,
    maxLinks: 1,
  })

  // Sync external value changes
  useEffect(() => {
    setText(value)
  }, [value, setText])

  // Auto-resize textarea (only used when TagEnabledTextarea auto-resize is disabled)
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight || '20') || 20
    const maxHeight = lineHeight * 10 // Max 10 lines
    const newHeight = Math.min(el.scrollHeight, Math.ceil(maxHeight))
    el.style.height = `${newHeight}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [])

  // Handle extracted tags from TagEnabledTextarea
  const handleTagsExtracted = useCallback((tags: ExtractedTag[]) => {
    onTagsExtracted?.(tags)
  }, [onTagsExtracted])

  // Simulated progress: advance 0 -> 99% smoothly (fast then slow crawl), never stop until fetch completes
  useEffect(() => {
    if (!isLoadingPreview) return
    setPreviewProgress(0)
    const intervalMs = 100
    const id = setInterval(() => {
      setPreviewProgress((p) => {
        const step = p < 60 ? 6 : p < 85 ? 3 : 1
        return Math.min(p + step, 99)
      })
    }, intervalMs)
    progressIntervalRef.current = id
    return () => {
      clearInterval(id)
      progressIntervalRef.current = null
    }
  }, [isLoadingPreview])

  // Fetch link preview when link is detected (skip_image_optimization for speed)
  useEffect(() => {
    const detectedLink = detectedLinks[0]

    if (detectedLink && detectedLink.url) {
      if (currentPreviewUrlRef.current === detectedLink.url) return

      setIsLoadingPreview(true)
      setPreviewError(null)
      setPreviewProgress(0)
      currentPreviewUrlRef.current = detectedLink.url

      const fetchPreview = async () => {
        try {
          const response = await fetch('/api/link-preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: detectedLink.url,
              refresh: false,
              skip_image_optimization: true,
            }),
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const data = await response.json()

          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
            progressIntervalRef.current = null
          }
          setPreviewProgress(100)

          if (data.success && data.data) {
            setLinkPreview(data.data)
            currentPreviewUrlRef.current = data.data.url
            onLinkPreviewChange?.(data.data)
          } else {
            setPreviewError(data.error || 'Failed to load preview')
            setLinkPreview(null)
            currentPreviewUrlRef.current = null
            onLinkPreviewChange?.(null)
          }
        } catch (error) {
          console.error('Error fetching link preview:', error)
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
            progressIntervalRef.current = null
          }
          setPreviewProgress(100)
          setPreviewError('Failed to load preview')
          setLinkPreview(null)
          currentPreviewUrlRef.current = null
          onLinkPreviewChange?.(null)
        } finally {
          setIsLoadingPreview(false)
        }
      }

      fetchPreview()
    } else {
      if (currentPreviewUrlRef.current) {
        setLinkPreview(null)
        currentPreviewUrlRef.current = null
        onLinkPreviewChange?.(null)
        setPreviewError(null)
        setPreviewProgress(0)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedLinks])

  // Handle text change from TagEnabledTextarea
  const handleTextChange = (newValue: string) => {
    onChange(newValue.slice(0, maxLength))
  }

  // Handle remove link
  const handleRemoveLink = () => {
    const detectedLink = detectedLinks[0]
    if (detectedLink) {
      const urlPattern = new RegExp(detectedLink.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
      const textWithoutUrl = value.replace(urlPattern, '').trim().replace(/\s+/g, ' ')
      onChange(textWithoutUrl)
    }
    setLinkPreview(null)
    currentPreviewUrlRef.current = null
    setPreviewError(null)
    setPreviewProgress(0)
    onLinkPreviewChange?.(null)
  }

  // Handle remove image from preview (keep link, clear image)
  const handleRemoveImage = () => {
    if (!linkPreview) return
    const updated: LinkPreviewMetadata = {
      ...linkPreview,
      image_url: undefined,
      thumbnail_url: undefined,
      images: [],
    }
    setLinkPreview(updated)
    onLinkPreviewChange?.(updated)
  }

  // Get caption text (text without URL)
  const getCaptionText = () => {
    const detectedLink = detectedLinks[0]
    if (!detectedLink) return value
    
    // Remove the URL from text, preserving text before and after
    const urlPattern = new RegExp(detectedLink.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    return value.replace(urlPattern, '').trim().replace(/\s+/g, ' ')
  }

  const captionText = getCaptionText()
  const hasLink = detectedLinks.length > 0
  const detectedLink = detectedLinks[0]

  return (
    <div className={cn('space-y-3', className)}>
      {/* Text Input with Tag Autocomplete */}
      <TagEnabledTextarea
        value={value}
        onChange={handleTextChange}
        onTagsExtracted={enableTagAutocomplete ? handleTagsExtracted : undefined}
        placeholder={placeholder}
        maxLength={maxLength}
        autoResize={true}
        minHeight={40}
        maxHeight={200}
        allowMentions={true}
        allowHashtags={true}
        allowEntities={true}
        showSuggestions={enableTagAutocomplete}
        textareaClassName="min-h-[40px] resize-none border-0 focus:ring-0 focus:outline-none text-base"
      />

      {/* Character Counter */}
      <div className="flex justify-end text-xs text-muted-foreground">
        {value.length} / {maxLength}
      </div>

      {/* Link Preview Card */}
      {hasLink && detectedLink && (
        <div className="relative mt-3 space-y-2">
          {isLoadingPreview && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Loading preview…</span>
                <span className="text-xs tabular-nums text-muted-foreground">{previewProgress}%</span>
              </div>
              <Progress value={previewProgress} className="h-1.5" />
            </div>
          )}
          {isLoadingPreview ? (
            <LinkPreviewSkeleton layout="compact" />
          ) : linkPreview ? (
            <EnterpriseLinkPreviewCard
              url={detectedLink.url}
              metadata={linkPreview}
              layout="compact"
              showImage={true}
              showDescription={true}
              showSiteName={true}
              compactImageWidth={previewImageWidth}
              trackAnalytics={false}
              disableNavigation={true}
              onRemove={handleRemoveLink}
              onRemoveImage={handleRemoveImage}
              onImageChange={(imageUrl) => {
                // Update the selected image in the preview metadata
                if (linkPreview) {
                  const updatedPreview = {
                    ...linkPreview,
                    image_url: imageUrl,
                  }
                  setLinkPreview(updatedPreview)
                  onLinkPreviewChange?.(updatedPreview)
                }
              }}
              className="border-2"
            />
          ) : previewError ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <p>{previewError}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveLink}
                className="mt-2"
              >
                Remove link
              </Button>
            </div>
          ) : (
            // Show loading state while waiting for preview
            <LinkPreviewSkeleton layout="compact" />
          )}
        </div>
      )}

      {/* Caption Preview (if there's text beyond the URL) */}
      {hasLink && captionText && captionText.trim().length > 0 && (
        <div className="text-sm text-muted-foreground italic">
          Caption: {captionText}
        </div>
      )}
    </div>
  )
}
