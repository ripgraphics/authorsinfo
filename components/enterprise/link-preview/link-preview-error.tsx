/**
 * Link Preview Error Component
 * Error state for link preview cards
 * Phase 2: Enterprise Link Post Component
 */

'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export interface LinkPreviewErrorProps {
  error: Error | null
  url: string
  onRetry?: () => void
  className?: string
}

/**
 * Get error message based on error type
 */
function getErrorMessage(error: Error | null): string {
  if (!error) return 'Failed to load link preview'

  const message = error.message.toLowerCase()

  if (message.includes('timeout') || message.includes('time')) {
    return 'Request timed out. The link may be slow to respond.'
  }

  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Please check your connection.'
  }

  if (message.includes('invalid') || message.includes('format')) {
    return 'Invalid URL format.'
  }

  if (message.includes('security') || message.includes('validation')) {
    return 'Link failed security validation.'
  }

  if (message.includes('cors') || message.includes('cross-origin')) {
    return 'Cannot load preview due to CORS restrictions.'
  }

  return error.message || 'Failed to load link preview'
}

/**
 * Format URL for display
 */
function formatUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname + urlObj.pathname
  } catch {
    return url
  }
}

/**
 * Link Preview Error Component
 */
export function LinkPreviewError({
  error,
  url,
  onRetry,
  className,
}: LinkPreviewErrorProps) {
  const errorMessage = getErrorMessage(error)
  const displayUrl = formatUrl(url)

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4',
        className
      )}
    >
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Preview Unavailable</AlertTitle>
        <AlertDescription className="mt-2">
          <p>{errorMessage}</p>
          <div className="mt-3 flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              <span className="truncate">{displayUrl}</span>
            </a>
          </div>
        </AlertDescription>
      </Alert>
      {onRetry && (
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )}
    </div>
  )
}
