/**
 * Multiple Link Preview Component
 * Displays multiple links in a carousel or grid layout
 * Phase 4: Enterprise Link Post Component
 */

'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EnterpriseLinkPreviewCard } from './enterprise-link-preview-card'
import type { LinkPreviewMetadata } from '@/types/link-preview'
import { cn } from '@/lib/utils'

export interface MultipleLinkPreviewProps {
  links: Array<{
    url: string
    metadata?: LinkPreviewMetadata
  }>
  layout?: 'carousel' | 'grid'
  maxVisible?: number
  className?: string
}

/**
 * Multiple Link Preview Component
 */
export function MultipleLinkPreview({
  links,
  layout = 'carousel',
  maxVisible = 3,
  className,
}: MultipleLinkPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (links.length === 0) {
    return null
  }

  // If only one link, render single preview
  if (links.length === 1) {
    return (
      <EnterpriseLinkPreviewCard
        url={links[0].url}
        metadata={links[0].metadata}
        layout="horizontal"
        className={className}
      />
    )
  }

  // Grid layout
  if (layout === 'grid') {
    return (
      <div className={cn('grid grid-cols-1 gap-3', className)}>
        {links.map((link, index) => (
          <EnterpriseLinkPreviewCard
            key={index}
            url={link.url}
            metadata={link.metadata}
            layout={index === 0 ? 'horizontal' : 'compact'}
            trackAnalytics={true}
          />
        ))}
      </div>
    )
  }

  // Carousel layout
  const visibleLinks = links.slice(currentIndex, currentIndex + maxVisible)
  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex + maxVisible < links.length

  return (
    <div className={cn('relative', className)}>
      <div className="space-y-3">
        {visibleLinks.map((link, index) => (
          <EnterpriseLinkPreviewCard
            key={currentIndex + index}
            url={link.url}
            metadata={link.metadata}
            layout={index === 0 ? 'horizontal' : 'compact'}
            trackAnalytics={true}
          />
        ))}
      </div>

      {/* Carousel Controls */}
      {links.length > maxVisible && (
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={!canGoPrev}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <span className="text-sm text-muted-foreground">
            {currentIndex + 1}-{Math.min(currentIndex + maxVisible, links.length)} of{' '}
            {links.length}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentIndex(
                Math.min(links.length - maxVisible, currentIndex + 1)
              )
            }
            disabled={!canGoNext}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Show all links link */}
      {links.length > maxVisible && (
        <div className="mt-2 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Expand to show all (could be a modal or expanded view)
              console.log('Show all links')
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Show all {links.length} links
          </Button>
        </div>
      )}
    </div>
  )
}
