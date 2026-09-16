'use client'

import { Avatar } from '@/components/ui/avatar'

export interface ConversationRailItem {
  id: string
  participant: {
    id: string
    name: string | null
    avatar_url?: string | null
  } | null
  unreadCount?: number
}

export interface ConversationRailProps {
  items: ConversationRailItem[]
  activeConversationId: string | null
  onSelect: (conversationId: string) => void
  title?: string
  description?: string
  className?: string
}

export function ConversationRail({
  items,
  activeConversationId,
  onSelect,
  title = 'Chats',
  description = 'Recent conversations',
  className = '',
}: ConversationRailProps) {
  return (
    <aside
      className={`conversation-rail hidden w-72 shrink-0 border-r bg-muted/20 md:block ${className}`}
    >
      <div className="conversation-rail__header border-b px-4 py-3">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="conversation-rail__list max-h-[calc(100vh-13rem)] overflow-y-auto p-2">
        {items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No conversations yet
          </p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`conversation-rail__item flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted ${activeConversationId === item.id ? 'bg-muted' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <Avatar
                src={item.participant?.avatar_url ?? undefined}
                name={item.participant?.name ?? ''}
                alt={item.participant?.name ?? 'Friend'}
                size="xs"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {item.participant?.name || 'Private conversation'}
              </span>
              {item.unreadCount ? (
                <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </span>
              ) : null}
            </button>
          ))
        )}
      </div>
    </aside>
  )
}
