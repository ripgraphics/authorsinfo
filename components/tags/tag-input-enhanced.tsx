/**
 * Enhanced TagInput Component with inline rich highlighting
 * Renders tags as styled chips while composing
 */

'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Hash, AtSign, X } from 'lucide-react'
import { TagDisambiguationDialog } from './tag-disambiguation-dialog'
import type { TagSuggestion } from './tag-input'
import { extractMentions, extractHashtags } from '@/lib/tags/tag-parser'

export interface TagInputEnhancedProps {
  value: string
  onChange: (value: string) => void
  onTagsChange?: (tags: TagSuggestion[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  allowMentions?: boolean
  allowHashtags?: boolean
  allowEntities?: boolean
  maxTags?: number
  showSuggestions?: boolean
}

interface ParsedTag {
  type: 'user' | 'entity' | 'topic'
  name: string
  slug: string
  position: { start: number; end: number }
  tagId?: string
  avatarUrl?: string
  entityId?: string
  entityType?: string
}

export function TagInputEnhanced({
  value,
  onChange,
  onTagsChange,
  placeholder = 'Write something...',
  className,
  disabled = false,
  allowMentions = true,
  allowHashtags = true,
  allowEntities = true,
  maxTags,
  showSuggestions = true,
}: TagInputEnhancedProps) {
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([])
  const [showSuggestionsList, setShowSuggestionsList] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [currentQuery, setCurrentQuery] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [showDisambiguation, setShowDisambiguation] = useState(false)
  const [disambiguationMatches, setDisambiguationMatches] = useState<TagSuggestion[]>([])
  const [parsedTags, setParsedTags] = useState<ParsedTag[]>([])
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Parse tags from value
  useEffect(() => {
    const mentions = extractMentions(value)
    const hashtags = extractHashtags(value)
    const allTags: ParsedTag[] = [
      ...mentions.map((m) => ({
        type: (m.type === 'user' ? 'user' : 'entity') as 'user' | 'entity',
        name: m.name,
        slug: m.slug,
        position: m.position,
      })),
      ...hashtags.map((h) => ({
        type: 'topic' as const,
        name: h.name,
        slug: h.slug,
        position: h.position,
      })),
    ]
    setParsedTags(allTags)
  }, [value])

  const searchTags = useCallback(async (query: string) => {
    if (!query || query.trim().length === 0) {
      setSuggestions([])
      setShowSuggestionsList(false)
      return
    }

    try {
      const types: string[] = []
      if (allowMentions) types.push('user')
      if (allowEntities) types.push('entity')
      if (allowHashtags) types.push('topic')

      const params = new URLSearchParams({
        q: query,
        limit: '10',
      })

      if (types.length > 0) {
        params.append('types', types.join(','))
      }

      const response = await fetch(`/api/tags/search?${params.toString()}`)
      const data = await response.json()

      if (data.results) {
        // If multiple exact matches, show disambiguation
        if (data.results.length > 1 && data.results.length <= 5) {
          const exactMatches = data.results.filter((r: TagSuggestion) =>
            r.name.toLowerCase() === query.toLowerCase() || r.slug.toLowerCase() === query.toLowerCase()
          )
          if (exactMatches.length > 1) {
            setDisambiguationMatches(exactMatches)
            setShowDisambiguation(true)
            setShowSuggestionsList(false)
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
    }
  }, [allowMentions, allowHashtags, allowEntities])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart || 0

    onChange(newValue)
    setCursorPosition(cursorPos)

    // Extract current word being typed
    const textBeforeCursor = newValue.substring(0, cursorPos)
    const match = textBeforeCursor.match(/(@|#)([a-zA-Z0-9_\s]*)$/)

    if (match && showSuggestions) {
      const prefix = match[1]
      const query = match[2].trim()

      // Check if we should show suggestions
      const shouldShow =
        (prefix === '@' && (allowMentions || allowEntities)) ||
        (prefix === '#' && allowHashtags)

      if (shouldShow) {
        setCurrentQuery(query)
        // Debounce search
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current)
        }
        searchTimeoutRef.current = setTimeout(() => {
          searchTags(query)
        }, 300)
      } else {
        setShowSuggestionsList(false)
        setSuggestions([])
      }
    } else {
      setShowSuggestionsList(false)
      setSuggestions([])
    }
  }

  const insertTag = (tag: TagSuggestion) => {
    if (!inputRef.current) return

    const textBeforeCursor = value.substring(0, cursorPosition)
    const textAfterCursor = value.substring(cursorPosition)
    const match = textBeforeCursor.match(/(@|#)([a-zA-Z0-9_\s]*)$/)

    if (match) {
      const prefix = match[1]
      const newText =
        textBeforeCursor.replace(/(@|#)([a-zA-Z0-9_\s]*)$/, `${prefix}${tag.name} `) +
        textAfterCursor

      onChange(newText)

      // Update cursor position
      setTimeout(() => {
        if (inputRef.current) {
          const newPos = textBeforeCursor.length - match[0].length + prefix.length + tag.name.length + 1
          inputRef.current.setSelectionRange(newPos, newPos)
          setCursorPosition(newPos)
        }
      }, 0)
    }

    setShowSuggestionsList(false)
    setSuggestions([])
    setCurrentQuery('')

    // Notify parent of tag change
    if (onTagsChange) {
      onTagsChange([tag])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showDisambiguation) {
      if (e.key === 'Escape') {
        setShowDisambiguation(false)
        e.preventDefault()
      }
      return
    }

    if (!showSuggestionsList || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % suggestions.length)
      // Scroll into view
      const selectedElement = suggestionsRef.current?.children[selectedIndex + 1] as HTMLElement
      selectedElement?.scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
      // Scroll into view
      const selectedElement = suggestionsRef.current?.children[selectedIndex - 1] as HTMLElement
      selectedElement?.scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      if (suggestions[selectedIndex]) {
        insertTag(suggestions[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      setShowSuggestionsList(false)
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestionsList(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Render tags as overlays (simplified approach - tags shown below input)
  const renderTagChips = () => {
    if (parsedTags.length === 0) return null

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {parsedTags.map((tag, index) => (
          <span
            key={`${tag.position.start}-${index}`}
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium',
              tag.type === 'user' && 'bg-blue-50 text-blue-700',
              tag.type === 'entity' && 'bg-purple-50 text-purple-700',
              tag.type === 'topic' && 'bg-green-50 text-green-700'
            )}
          >
            {tag.type === 'topic' && <Hash className="h-3 w-3" />}
            {(tag.type === 'user' || tag.type === 'entity') && <AtSign className="h-3 w-3" />}
            <span>{tag.name}</span>
            <button
              type="button"
              onClick={() => {
                // Remove tag from text
                const before = value.substring(0, tag.position.start)
                const after = value.substring(tag.position.end)
                const prefix = tag.type === 'topic' ? '#' : '@'
                const newValue = before + after
                onChange(newValue)
              }}
              className="ml-1 hover:bg-black/10 rounded p-0.5"
              aria-label={`Remove ${tag.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <textarea
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (currentQuery && suggestions.length > 0) {
              setShowSuggestionsList(true)
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full min-h-[100px] px-3 py-2 text-sm border rounded-md resize-y',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Tag input with autocomplete"
          aria-autocomplete="list"
          aria-expanded={showSuggestionsList}
          aria-controls="tag-suggestions"
        />
      </div>

      {renderTagChips()}

      {showSuggestionsList && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          id="tag-suggestions"
          role="listbox"
          aria-label="Tag suggestions"
          className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[300px] overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => insertTag(suggestion)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-ring',
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
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Hash className="h-4 w-4 text-primary" />
                </div>
              )}
              {suggestion.type === 'entity' && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <AtSign className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{suggestion.name}</p>
                {suggestion.sublabel && (
                  <p className="text-xs text-muted-foreground truncate">{suggestion.sublabel}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showDisambiguation && (
        <TagDisambiguationDialog
          isOpen={showDisambiguation}
          onClose={() => setShowDisambiguation(false)}
          query={currentQuery}
          matches={disambiguationMatches}
          onSelect={insertTag}
        />
      )}
    </div>
  )
}
