'use client'

import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'

export interface ConversationRailItem {
  id: string
  participant: {
    id: string
    name: string | null
    avatar_url?: string | null
  } | null
  unreadCount?: number
}

export interface ConversationRailContact {
  id: string
  name: string | null
  email?: string | null
  avatar_url?: string | null
}

export interface ConversationRailProps {
  items: ConversationRailItem[]
  activeConversationId: string | null
  onSelect: (conversationId: string) => void
  contacts?: ConversationRailContact[]
  onSelectContact?: (contactId: string) => void
  searchValue?: string
  onSearchChange?: (value: string) => void
  filter?: 'all' | 'unread' | 'friends'
  onFilterChange?: (filter: 'all' | 'unread' | 'friends') => void
  title?: string
  description?: string
  className?: string
}

export function ConversationRail({
  items,
  activeConversationId,
  onSelect,
  contacts = [],
  onSelectContact,
  searchValue = '',
  onSearchChange,
  filter = 'all',
  onFilterChange,
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
        {onSearchChange ? (
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search chats"
            aria-label="Search chats"
            className="mt-3 h-9"
          />
        ) : null}
        {onFilterChange ? (
          <div className="conversation-rail__filters mt-3 flex gap-1" role="tablist" aria-label="Chat filters">
            {(['all', 'unread', 'friends'] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={filter === option}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${filter === option ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
                onClick={() => onFilterChange(option)}
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="conversation-rail__list max-h-[calc(100vh-13rem)] overflow-y-auto p-2">
        {items.length === 0 && contacts.length === 0 ? (
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
        {contacts.length > 0 ? (
          <div className="conversation-rail__contacts mt-4 border-t pt-3">
            <p className="px-3 pb-2 text-xs font-semibold uppercase text-muted-foreground">New message</p>
            {contacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                className="conversation-rail__contact flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-muted"
                onClick={() => onSelectContact?.(contact.id)}
              >
                <Avatar src={contact.avatar_url ?? undefined} name={contact.name ?? ''} alt={contact.name ?? 'Contact'} size="xs" />
                <span className="min-w-0 flex-1 truncate text-sm">{contact.name || contact.email || 'Contact'}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  )
}
