/**
 * Tag and Collaborate View
 * Reusable content for tagging people and inviting collaborators.
 * Use as a view inside a modal (e.g. Create Post) or wrap in a Dialog elsewhere.
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TagSuggestion } from '@/components/tags/tag-input'

export interface TaggedEntity {
  id: string
  label: string
  type?: 'user' | 'page' | 'profile' | 'entity' | 'topic'
  avatarUrl?: string
  entityId?: string
  entityType?: string
}

export interface SuggestionEntity {
  id: string
  label: string
  sublabel?: string
  type?: 'user' | 'page' | 'profile' | 'entity' | 'topic'
  avatarUrl?: string
  entityId?: string
  entityType?: string
}

export interface TagAndCollaborateViewProps {
  tagged?: TaggedEntity[]
  onTaggedChange?: (tagged: TaggedEntity[]) => void
  suggestions?: SuggestionEntity[]
  onSearch?: (q: string) => void
  className?: string
}

/**
 * Tag and Collaborate View – reusable UI for Tag people / Invite collaborator.
 * Use inside Create Post modal or wrap in Dialog for use elsewhere.
 */
export function TagAndCollaborateView({
  tagged = [],
  onTaggedChange,
  suggestions: externalSuggestions = [],
  onSearch,
  className,
}: TagAndCollaborateViewProps) {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'tag' | 'collaborator'>('tag')
  const [suggestions, setSuggestions] = useState<SuggestionEntity[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Search tags when query changes
  useEffect(() => {
    if (!search || search.trim().length === 0) {
      setSuggestions(externalSuggestions.length > 0 ? externalSuggestions : [])
      return
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true)
      try {
        const types = activeTab === 'tag' ? ['user', 'entity'] : ['user']
        const params = new URLSearchParams({
          q: search,
          types: types.join(','),
          limit: '20',
        })

        const response = await fetch(`/api/tags/search?${params.toString()}`)
        const data = await response.json()

        if (data.results) {
          const mapped: SuggestionEntity[] = data.results.map((r: TagSuggestion) => ({
            id: r.id,
            label: r.name,
            sublabel: r.sublabel,
            type: r.type === 'user' ? 'user' : r.type === 'entity' ? 'entity' : 'topic',
            avatarUrl: r.avatarUrl,
            entityId: r.entityId,
            entityType: r.entityType,
          }))
          setSuggestions(mapped)
        } else {
          setSuggestions([])
        }
      } catch (error) {
        console.error('Error searching tags:', error)
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [search, activeTab, externalSuggestions])

  const removeTag = (id: string) => {
    const next = tagged.filter((t) => t.id !== id)
    onTaggedChange?.(next)
  }

  const addTag = (s: SuggestionEntity) => {
    if (tagged.some((t) => t.id === s.id)) return
    const next = [
      ...tagged,
      {
        id: s.id,
        label: s.label,
        type: s.type,
        avatarUrl: s.avatarUrl,
        entityId: s.entityId,
        entityType: s.entityType,
      },
    ]
    onTaggedChange?.(next)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setSearch(q)
    onSearch?.(q)
  }

  const displaySuggestions = suggestions.length > 0 ? suggestions : externalSuggestions

  return (
    <div className={cn('flex flex-col h-full min-h-0', className)}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'tag' | 'collaborator')} className="flex-1 flex flex-col min-h-0">
        <div className="flex-shrink-0 px-4 pt-3">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="tag">Tag people</TabsTrigger>
            <TabsTrigger value="collaborator">Invite collaborator</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-shrink-0 px-4 pt-3 flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search"
              value={search}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onSearch?.(search)
                }
              }}
              className="pl-9"
            />
          </div>
          <button
            type="button"
            onClick={() => onSearch?.(search)}
            className="text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded shrink-0"
          >
            Done
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
          <TabsContent value="tag" className="mt-0 space-y-4">
            {tagged.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tagged</p>
                <div className="flex flex-wrap gap-2">
                  {tagged.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm"
                    >
                      {t.label}
                      <button
                        type="button"
                        onClick={() => removeTag(t.id)}
                        className="rounded-full p-0.5 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-ring"
                        aria-label={`Remove ${t.label}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Suggestions</p>
              <div className="space-y-1">
                {displaySuggestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Search for people or pages to tag.</p>
                ) : (
                  displaySuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => addTag(suggestion)}
                      disabled={tagged.some((t) => t.id === suggestion.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left disabled:opacity-50"
                    >
                      <Avatar
                        src={suggestion.avatarUrl}
                        alt={suggestion.label}
                        name={suggestion.label}
                        size="sm"
                        className="w-10 h-10 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{suggestion.label}</p>
                        {suggestion.sublabel && (
                          <p className="text-xs text-muted-foreground truncate">{suggestion.sublabel}</p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="collaborator" className="mt-0">
            <p className="text-sm text-muted-foreground py-4">
              Invite a collaborator to share credit for your post. Search for people to invite.
            </p>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

export interface TagAndCollaborateModalProps extends TagAndCollaborateViewProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Tag and Collaborate Modal – standalone Dialog wrapping TagAndCollaborateView.
 * Use anywhere in the app when you need a modal for tagging/collaboration.
 * Uses DialogHeader, DialogTitle, and built-in CloseButton.
 */
export function TagAndCollaborateModal({
  isOpen,
  onClose,
  tagged,
  onTaggedChange,
  suggestions,
  onSearch,
  className,
}: TagAndCollaborateModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="flex flex-col max-h-[85vh] overflow-hidden max-w-[440px] p-0 gap-0">
        <DialogHeader className="flex-shrink-0 px-4 pt-4 pb-2 border-b">
          <DialogTitle className="text-lg font-semibold">Tag and collaborate</DialogTitle>
        </DialogHeader>
        <TagAndCollaborateView
          tagged={tagged}
          onTaggedChange={onTaggedChange}
          suggestions={suggestions}
          onSearch={onSearch}
          className="flex-1 min-h-0"
        />
      </DialogContent>
    </Dialog>
  )
}
