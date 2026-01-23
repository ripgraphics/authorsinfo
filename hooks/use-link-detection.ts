/**
 * useLinkDetection Hook
 * Real-time URL detection in text input
 * Phase 2: Enterprise Link Post Component
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { extractLinks, type ExtractedLink } from '@/lib/link-preview/link-extractor'

export interface UseLinkDetectionOptions {
  debounceMs?: number
  autoDetect?: boolean
  maxLinks?: number
}

export interface UseLinkDetectionReturn {
  text: string
  setText: (text: string) => void
  detectedLinks: ExtractedLink[]
  hasLinks: boolean
  linkCount: number
  clearLinks: () => void
  addLink: (url: string) => void
  removeLink: (url: string) => void
}

/**
 * Hook for detecting URLs in text input
 */
export function useLinkDetection(
  initialText: string = '',
  options: UseLinkDetectionOptions = {}
): UseLinkDetectionReturn {
  const {
    debounceMs = 300,
    autoDetect = true,
    maxLinks = 10,
  } = options

  const [text, setText] = useState(initialText)
  const [detectedLinks, setDetectedLinks] = useState<ExtractedLink[]>([])

  // Debounced link detection
  useEffect(() => {
    if (!autoDetect || !text) {
      setDetectedLinks([])
      return
    }

    const timeoutId = setTimeout(() => {
      const links = extractLinks(text)
      // Limit number of links
      const limitedLinks = links.slice(0, maxLinks)
      setDetectedLinks(limitedLinks)
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [text, debounceMs, autoDetect, maxLinks])

  // Memoized computed values
  const hasLinks = useMemo(() => detectedLinks.length > 0, [detectedLinks])
  const linkCount = useMemo(() => detectedLinks.length, [detectedLinks])

  // Clear all detected links
  const clearLinks = useCallback(() => {
    setDetectedLinks([])
  }, [])

  // Add a link manually
  const addLink = useCallback(
    (url: string) => {
      const links = extractLinks(url)
      if (links.length > 0) {
        setDetectedLinks((prev) => {
          const newLinks = [...prev, links[0]]
          // Remove duplicates
          const uniqueLinks = newLinks.filter(
            (link, index, self) =>
              index ===
              self.findIndex((l) => l.normalizedUrl === link.normalizedUrl)
          )
          return uniqueLinks.slice(0, maxLinks)
        })
      }
    },
    [maxLinks]
  )

  // Remove a link
  const removeLink = useCallback((url: string) => {
    setDetectedLinks((prev) =>
      prev.filter((link) => link.normalizedUrl !== url)
    )
  }, [])

  return {
    text,
    setText,
    detectedLinks,
    hasLinks,
    linkCount,
    clearLinks,
    addLink,
    removeLink,
  }
}
