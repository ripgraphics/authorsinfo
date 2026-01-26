/**
 * TagInput Component
 * Facebook-style inline mention and hashtag input with autocomplete
 */

'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Search, X, Hash, AtSign } from 'lucide-react'

export interface TagSuggestion {
  id: string
  name: string
  slug: string
  type: 'user' | 'entity' | 'topic' | 'collaborator' | 'location' | 'taxonomy'
  avatarUrl?: string
  sublabel?: string
  entityId?: string
  entityType?: string
}

export interface TagInputProps {
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

export function TagInput({
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
}: TagInputProps) {
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([])
  const [showSuggestionsList, setShowSuggestionsList] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [currentQuery, setCurrentQuery] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Debounced search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
      // This is simplified - in production, you'd want to match these to actual tag IDs
      // For now, we'll pass the selected tag
      onTagsChange([tag])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestionsList || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
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
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestionsList(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn('relative', className)}>
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
      />

      {showSuggestionsList && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[300px] overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => insertTag(suggestion)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors',
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
    </div>
  )
}
