'use client'

import { useRef, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

// Module-level variables to persist typing state across component remounts
let globalInputValue: string = ''
let globalLastTyping: number = 0
const TYPING_WINDOW_MS = 5000 // 5 seconds

interface ReusableSearchProps {
  /**
   * The URL parameter name to use for the search query (default: 'search')
   */
  paramName?: string
  /**
   * Placeholder text for the search input
   */
  placeholder?: string
  /**
   * Debounce delay in milliseconds for URL updates (default: 300)
   * Note: onSearchChange is called immediately on every keystroke
   */
  debounceMs?: number
  /**
   * Callback fired immediately when search value changes (on every keystroke)
   */
  onSearchChange?: (value: string) => void
  /**
   * Whether to automatically update URL params (default: true)
   */
  updateUrl?: boolean
  /**
   * Base path for URL updates (default: current path)
   */
  basePath?: string
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Show search icon (default: true)
   */
  showIcon?: boolean
  /**
   * Additional URL params to preserve
   */
  preserveParams?: string[]
}

/**
 * Enterprise-grade reusable search component with:
 * - Instant results on every keystroke (like Amazon/Facebook)
 * - Continuous typing without interruption
 * - Delayed URL updates to prevent Server Component re-renders
 * - Simple, performant implementation
 */
export function ReusableSearch({
  paramName = 'search',
  placeholder = 'Search...',
  debounceMs = 300,
  onSearchChange,
  updateUrl = true,
  basePath,
  className,
  showIcon = true,
  preserveParams = [],
}: ReusableSearchProps) {
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const urlUpdateTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Get initial value from URL or global state (only called on mount)
  const getInitialValue = () => {
    const now = Date.now()
    const timeSinceLastTyping = now - globalLastTyping
    const recentlyTyped = timeSinceLastTyping < TYPING_WINDOW_MS
    const urlValue = searchParams.get(paramName) || ''
    
    // If user typed recently, use global value to prevent reset on remount
    if (recentlyTyped && globalInputValue) {
      return globalInputValue
    }
    return urlValue
  }

  // Initialize input value from URL or global state on mount only
  useEffect(() => {
    if (inputRef.current && !inputRef.current.value) {
      const initialValue = getInitialValue()
      inputRef.current.value = initialValue
      globalInputValue = initialValue
    }
  }, []) // Only run on mount

  // Update URL params (debounced, called after typing stops)
  const updateUrlParams = useCallback(
    (value: string) => {
      if (!updateUrl) return

      const params = new URLSearchParams(searchParams.toString())

      if (value.trim()) {
        params.set(paramName, value.trim())
      } else {
        params.delete(paramName)
      }

      // Remove page param when searching
      params.delete('page')

      // Preserve specified params
      preserveParams.forEach((key) => {
        const val = searchParams.get(key)
        if (val) params.set(key, val)
      })

      // Build the URL
      const path = basePath || window.location.pathname
      const queryString = params.toString()
      const finalUrl = queryString ? `${path}?${queryString}` : path

      // Update URL without triggering navigation
      window.history.replaceState(null, '', finalUrl)
    },
    [paramName, updateUrl, basePath, searchParams, preserveParams]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    // Update global state immediately (persists across remounts)
    globalInputValue = value
    globalLastTyping = Date.now()

    // Call onSearchChange immediately on every keystroke (instant results)
    if (onSearchChange) {
      onSearchChange(value)
    }

    // Clear existing URL update timer
    if (urlUpdateTimerRef.current) {
      clearTimeout(urlUpdateTimerRef.current)
    }

    // Schedule URL update after typing stops (prevents Server Component re-renders)
    urlUpdateTimerRef.current = setTimeout(() => {
      updateUrlParams(value)
    }, debounceMs)
  }

  // Sync with URL when it changes externally (but not during typing)
  useEffect(() => {
    const urlValue = searchParams.get(paramName) || ''
    const now = Date.now()
    const timeSinceLastTyping = now - globalLastTyping
    const recentlyTyped = timeSinceLastTyping < TYPING_WINDOW_MS

    // Only sync from URL if:
    // 1. User hasn't typed recently
    // 2. Input is not currently focused (user not actively typing)
    // 3. Input value differs from URL
    const isFocused = inputRef.current === document.activeElement
    if (!recentlyTyped && !isFocused && inputRef.current && inputRef.current.value !== urlValue) {
      inputRef.current.value = urlValue
      globalInputValue = urlValue
    }
  }, [searchParams, paramName])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (urlUpdateTimerRef.current) {
        clearTimeout(urlUpdateTimerRef.current)
      }
    }
  }, [])

  return (
    <div className={cn('relative flex-1', className)}>
      {showIcon && (
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      )}
      <Input
        ref={inputRef}
        type="search"
        placeholder={placeholder}
        defaultValue={getInitialValue()}
        onChange={handleChange}
        className={showIcon ? 'pl-9' : ''}
      />
    </div>
  )
}
