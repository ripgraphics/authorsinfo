/**
 * TagEnabledTextarea Component
 * A textarea wrapper that provides inline tag autocomplete for mentions (@) and hashtags (#)
 * Designed to integrate with post composers while maintaining all existing functionality
 */

'use client'

import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Hash, AtSign, Loader2 } from 'lucide-react'
import { TagDisambiguationDialog } from './tag-disambiguation-dialog'
import type { TagSuggestion } from './tag-input'

export interface TagEnabledTextareaProps {
  value: string
  onChange: (value: string) => void
  onTagsExtracted?: (tags: ExtractedTag[]) => void
  placeholder?: string
  className?: string
  textareaClassName?: string
  disabled?: boolean
  maxLength?: number
  rows?: number
  autoResize?: boolean
  minHeight?: number
  maxHeight?: number
  allowMentions?: boolean
  allowHashtags?: boolean
  allowEntities?: boolean
  showSuggestions?: boolean
  onFocus?: () => void
  onBlur?: () => void
  onInput?: (e: React.FormEvent<HTMLTextAreaElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

export interface ExtractedTag {
  type: 'user' | 'entity' | 'topic'
  name: string
  slug: string
  position: { start: number; end: number }
  tagId?: string
  entityId?: string
  entityType?: string
}

export interface TagEnabledTextareaRef {
  focus: () => void
  blur: () => void
  getTextarea: () => HTMLTextAreaElement | null
}

export const TagEnabledTextarea = forwardRef<TagEnabledTextareaRef, TagEnabledTextareaProps>(
  function TagEnabledTextarea(
    {
      value,
      onChange,
      onTagsExtracted,
      placeholder = 'Write something...',
      className,
      textareaClassName,
      disabled = false,
      maxLength,
      rows = 3,
      autoResize = true,
      minHeight = 80,
      maxHeight = 300,
      allowMentions = true,
      allowHashtags = true,
      allowEntities = true,
      showSuggestions = true,
      onFocus,
      onBlur,
      onInput,
      onKeyDown: externalKeyDown,
    },
    ref
  ) {
    const [suggestions, setSuggestions] = useState<TagSuggestion[]>([])
    const [showSuggestionsList, setShowSuggestionsList] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [currentQuery, setCurrentQuery] = useState('')
    const [currentPrefix, setCurrentPrefix] = useState<'@' | '#' | null>(null)
    const [cursorPosition, setCursorPosition] = useState(0)
    const [showDisambiguation, setShowDisambiguation] = useState(false)
    const [disambiguationMatches, setDisambiguationMatches] = useState<TagSuggestion[]>([])
    const [isSearching, setIsSearching] = useState(false)

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const suggestionsRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      blur: () => textareaRef.current?.blur(),
      getTextarea: () => textareaRef.current,
    }))

    // Extract tags from value and notify parent
    useEffect(() => {
      if (!onTagsExtracted) return

      const mentionRegex = /@(\w+)/g
      const hashtagRegex = /#(\w+)/g

      const tags: ExtractedTag[] = []

      let match
      while ((match = mentionRegex.exec(value)) !== null) {
        tags.push({
          type: 'user',
          name: match[1],
          slug: match[1].toLowerCase(),
          position: { start: match.index, end: match.index + match[0].length },
        })
      }

      while ((match = hashtagRegex.exec(value)) !== null) {
        tags.push({
          type: 'topic',
          name: match[1],
          slug: match[1].toLowerCase(),
          position: { start: match.index, end: match.index + match[0].length },
        })
      }

      onTagsExtracted(tags)
    }, [value, onTagsExtracted])

    // Auto-resize textarea
    useEffect(() => {
      if (!autoResize || !textareaRef.current) return

      const textarea = textareaRef.current
      textarea.style.height = 'auto'
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight)
      textarea.style.height = `${newHeight}px`
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
    }, [value, autoResize, minHeight, maxHeight])

    // Search tags
    const searchTags = useCallback(
      async (query: string, prefix: '@' | '#') => {
        if (!query || query.trim().length === 0) {
          setSuggestions([])
          setShowSuggestionsList(false)
          return
        }

        setIsSearching(true)

        try {
          const types: string[] = []
          if (prefix === '@') {
            if (allowMentions) types.push('user')
            if (allowEntities) types.push('entity')
          } else if (prefix === '#') {
            if (allowHashtags) types.push('topic')
          }

          if (types.length === 0) {
            setSuggestions([])
            setShowSuggestionsList(false)
            return
          }

          const params = new URLSearchParams({
            q: query,
            types: types.join(','),
            limit: '10',
          })

          const response = await fetch(`/api/tags/search?${params.toString()}`)
          const data = await response.json()

          if (data.results) {
            // Check for disambiguation (multiple exact matches)
            if (data.results.length > 1 && data.results.length <= 5) {
              const exactMatches = data.results.filter(
                (r: TagSuggestion) =>
                  r.name.toLowerCase() === query.toLowerCase() ||
                  r.slug.toLowerCase() === query.toLowerCase()
              )
              if (exactMatches.length > 1) {
                setDisambiguationMatches(exactMatches)
                setShowDisambiguation(true)
                setShowSuggestionsList(false)
                setIsSearching(false)
                return
              }
            }

            setSuggestions(data.results)
            setShowSuggestionsList(data.results.length > 0)
            setSelectedIndex(0)
          }
        } catch (error) {
          console.error('Error searching tags:', error)
          setSuggestions([])
          setShowSuggestionsList(false)
        } finally {
          setIsSearching(false)
        }
      },
      [allowMentions, allowHashtags, allowEntities]
    )

    // Handle text change
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      let newValue = e.target.value
      if (maxLength && newValue.length > maxLength) {
        newValue = newValue.slice(0, maxLength)
      }

      const cursorPos = e.target.selectionStart || 0
      onChange(newValue)
      setCursorPosition(cursorPos)

      // Extract current word being typed
      const textBeforeCursor = newValue.substring(0, cursorPos)
      const match = textBeforeCursor.match(/(@|#)([a-zA-Z0-9_]*)$/)

      if (match && showSuggestions) {
        const prefix = match[1] as '@' | '#'
        const query = match[2]

        setCurrentPrefix(prefix)
        setCurrentQuery(query)

        // Debounce search
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current)
        }
        searchTimeoutRef.current = setTimeout(() => {
          searchTags(query, prefix)
        }, 200)
      } else {
        setShowSuggestionsList(false)
        setSuggestions([])
        setCurrentPrefix(null)
        setCurrentQuery('')
      }
    }

    // Insert selected tag
    const insertTag = useCallback(
      (tag: TagSuggestion) => {
        if (!textareaRef.current || !currentPrefix) return

        const textBeforeCursor = value.substring(0, cursorPosition)
        const textAfterCursor = value.substring(cursorPosition)
        const match = textBeforeCursor.match(/(@|#)([a-zA-Z0-9_]*)$/)

        if (match) {
          const prefix = match[1]
          // Use slug for consistent formatting
          const tagText = tag.type === 'topic' ? tag.name : tag.slug || tag.name
          const newText =
            textBeforeCursor.replace(/(@|#)([a-zA-Z0-9_]*)$/, `${prefix}${tagText} `) +
            textAfterCursor

          onChange(newText)

          // Update cursor position
          setTimeout(() => {
            if (textareaRef.current) {
              const newPos =
                textBeforeCursor.length - match[0].length + prefix.length + tagText.length + 1
              textareaRef.current.setSelectionRange(newPos, newPos)
              textareaRef.current.focus()
              setCursorPosition(newPos)
            }
          }, 0)
        }

        setShowSuggestionsList(false)
        setSuggestions([])
        setCurrentQuery('')
        setCurrentPrefix(null)
      },
      [value, cursorPosition, currentPrefix, onChange]
    )

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (showDisambiguation) {
        if (e.key === 'Escape') {
          setShowDisambiguation(false)
          e.preventDefault()
          return
        }
      }

      if (showSuggestionsList && suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % suggestions.length)
          // Scroll into view
          const selectedElement = suggestionsRef.current?.children[
            (selectedIndex + 1) % suggestions.length
          ] as HTMLElement
          selectedElement?.scrollIntoView({ block: 'nearest' })
          return
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
          // Scroll into view
          const selectedElement = suggestionsRef.current?.children[
            (selectedIndex - 1 + suggestions.length) % suggestions.length
          ] as HTMLElement
          selectedElement?.scrollIntoView({ block: 'nearest' })
          return
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          if (suggestions[selectedIndex]) {
            e.preventDefault()
            insertTag(suggestions[selectedIndex])
            return
          }
        } else if (e.key === 'Escape') {
          setShowSuggestionsList(false)
          e.preventDefault()
          return
        }
      }

      // Call external keydown handler
      externalKeyDown?.(e)
    }

    // Close suggestions when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setShowSuggestionsList(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Cleanup
    useEffect(() => {
      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current)
        }
      }
    }, [])

    return (
      <div ref={containerRef} className={cn('relative', className)}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          onInput={onInput}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={cn(
            'w-full px-3 py-2 text-sm resize-none',
            'focus:outline-none focus:ring-0',
            disabled && 'opacity-50 cursor-not-allowed',
            textareaClassName
          )}
          style={{ minHeight: `${minHeight}px` }}
          aria-label="Text input with tag autocomplete"
          aria-autocomplete="list"
          aria-expanded={showSuggestionsList}
          aria-controls="tag-suggestions-dropdown"
        />

        {/* Suggestions Dropdown */}
        {showSuggestionsList && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            id="tag-suggestions-dropdown"
            role="listbox"
            aria-label="Tag suggestions"
            className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[280px] overflow-y-auto"
          >
            {isSearching && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </div>
            )}
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                role="option"
                aria-selected={index === selectedIndex}
                onClick={() => insertTag(suggestion)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors',
                  'focus:outline-none focus:bg-accent',
                  index === selectedIndex && 'bg-accent'
                )}
              >
                {suggestion.type === 'user' && (
                  <Avatar
                    src={suggestion.avatarUrl}
                    alt={suggestion.name}
                    name={suggestion.name}
                    size="sm"
                    className="w-8 h-8 shrink-0"
                  />
                )}
                {suggestion.type === 'topic' && (
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Hash className="h-4 w-4 text-green-600" />
                  </div>
                )}
                {suggestion.type === 'entity' && (
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <AtSign className="h-4 w-4 text-purple-600" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{suggestion.name}</p>
                  {suggestion.sublabel && (
                    <p className="text-xs text-muted-foreground truncate">{suggestion.sublabel}</p>
                  )}
                </div>
                {suggestion.type === 'user' && (
                  <span className="text-xs text-muted-foreground">@{suggestion.slug}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Disambiguation Dialog */}
        {showDisambiguation && (
          <TagDisambiguationDialog
            isOpen={showDisambiguation}
            onClose={() => setShowDisambiguation(false)}
            query={currentQuery}
            matches={disambiguationMatches}
            onSelect={(tag) => {
              insertTag(tag)
              setShowDisambiguation(false)
            }}
          />
        )}
      </div>
    )
  }
)
