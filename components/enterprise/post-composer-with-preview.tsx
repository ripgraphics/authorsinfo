/**
 * Post Composer with Live Link Preview
 * Text input with real-time link detection and preview
 * Phase 1: Create Post Modal with Live Link Preview
 */

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLinkDetection } from '@/hooks/use-link-detection'
// No need to import extractTextWithoutUrl - we'll implement it inline
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
  className?: string
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
  className,
}: PostComposerWithPreviewProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [linkPreview, setLinkPreview] = useState<LinkPreviewMetadata | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const currentPreviewUrlRef = useRef<string | null>(null)

  // Use link detection hook
  const { detectedLinks, setText } = useLinkDetection(value, {
    debounceMs: 300,
    autoDetect: true,
    maxLinks: 1,
  })

  // Sync external value changes
  useEffect(() => {
    setText(value)
  }, [value, setText])

  // Auto-resize textarea
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

  // Fetch link preview when link is detected
  useEffect(() => {
    const detectedLink = detectedLinks[0]
    
    if (detectedLink && detectedLink.url) {
      // Only fetch if we don't already have this preview loaded
      if (currentPreviewUrlRef.current === detectedLink.url) {
        return // Already have this preview, don't refetch
      }
      
      setIsLoadingPreview(true)
      setPreviewError(null)
      currentPreviewUrlRef.current = detectedLink.url
      
      const fetchPreview = async () => {
        try {
          const response = await fetch('/api/link-preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: detectedLink.url, refresh: false }),
          })
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          
          const data = await response.json()
          
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
      // Clear preview when no link detected
      if (currentPreviewUrlRef.current) {
        setLinkPreview(null)
        currentPreviewUrlRef.current = null
        onLinkPreviewChange?.(null)
        setPreviewError(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedLinks]) // Only depend on detectedLinks to avoid infinite loops

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value.slice(0, maxLength)
    onChange(newValue)
    resizeTextarea()
  }

  // Handle remove link
  const handleRemoveLink = () => {
    const detectedLink = detectedLinks[0]
    if (detectedLink) {
      // Remove the URL from text, preserving text before and after
      // Use the original text from the match, not the normalized URL
      const urlPattern = new RegExp(detectedLink.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
      const textWithoutUrl = value.replace(urlPattern, '').trim().replace(/\s+/g, ' ')
      onChange(textWithoutUrl)
    }
    setLinkPreview(null)
    currentPreviewUrlRef.current = null
    setPreviewError(null)
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
      {/* Text Input */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        placeholder={placeholder}
        className="min-h-[120px] resize-none border-0 focus:ring-0 focus:outline-none text-base"
        maxLength={maxLength}
        onInput={resizeTextarea}
      />

      {/* Character Counter */}
      <div className="flex justify-end text-xs text-muted-foreground">
        {value.length} / {maxLength}
      </div>

      {/* Link Preview Card */}
      {hasLink && detectedLink && (
        <div className="relative mt-3">
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
              trackAnalytics={false}
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
