/**
 * TagDisambiguationDialog Component
 * Shows multiple matching entities when a mention is ambiguous
 */

'use client'

import React from 'react'
import { ReusableModal } from '@/components/ui/reusable-modal'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Hash, AtSign, User, Book, Users, Calendar } from 'lucide-react'
import type { TagSuggestion } from './tag-input'

export interface TagDisambiguationDialogProps {
  isOpen: boolean
  onClose: () => void
  query: string
  matches: TagSuggestion[]
  onSelect: (tag: TagSuggestion) => void
}

export function TagDisambiguationDialog({
  isOpen,
  onClose,
  query,
  matches,
  onSelect,
}: TagDisambiguationDialogProps) {
  const handleSelect = (tag: TagSuggestion) => {
    onSelect(tag)
    onClose()
  }

  const getEntityIcon = (type: string, entityType?: string) => {
    if (type === 'user') return <User className="h-4 w-4" />
    if (type === 'entity') {
      if (entityType === 'book') return <Book className="h-4 w-4" />
      if (entityType === 'group') return <Users className="h-4 w-4" />
      if (entityType === 'event') return <Calendar className="h-4 w-4" />
      return <AtSign className="h-4 w-4" />
    }
    if (type === 'topic') return <Hash className="h-4 w-4" />
    return <AtSign className="h-4 w-4" />
  }

  return (
    <ReusableModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Multiple matches found"
      description={`We found multiple results for "${query}". Please select the one you meant:`}
      contentClassName="max-w-md"
    >
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {matches.map((match) => (
            <button
              key={match.id}
              type="button"
              onClick={() => handleSelect(match)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
              )}
            >
              {match.type === 'user' && (
                <Avatar
                  src={match.avatarUrl}
                  alt={match.name}
                  name={match.name}
                  size="sm"
                  className="w-10 h-10 shrink-0"
                />
              )}
              {match.type !== 'user' && (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {getEntityIcon(match.type, match.entityType)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{match.name}</p>
                {match.sublabel && (
                  <p className="text-xs text-muted-foreground truncate">{match.sublabel}</p>
                )}
              </div>
            </button>
          ))}
        </div>
    </ReusableModal>
  )
}
