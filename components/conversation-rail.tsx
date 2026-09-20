'use client'

import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { MessengerRequestList, type MessengerRequestListItem } from '@/components/messenger-request-list'

export interface ConversationRailItem {
  id: string
  title?: string | null
  participant: {
    id: string
    name: string | null
    avatar_url?: string | null
  } | null
  unreadCount?: number
  lastMessagePreview?: string | null
  lastMessageAt?: string | null
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
  filter?: 'all' | 'unread' | 'friends' | 'archived'
  onFilterChange?: (filter: 'all' | 'unread' | 'friends' | 'archived') => void
  title?: string
  description?: string
  mobileVisible?: boolean
  className?: string
  messageRequests?: MessengerRequestListItem[]
  currentUserId?: string | null
  onAcceptRequest?: (requestId: string) => void
  onDeclineRequest?: (requestId: string) => void
  onCancelRequest?: (requestId: string) => void
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
  mobileVisible = false,
  className = '',
  messageRequests = [],
  currentUserId = null,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
}: ConversationRailProps) {
  return (
    <aside
      className={`conversation-rail ${mobileVisible ? 'block' : 'hidden'} w-72 shrink-0 border-r bg-muted/20 md:block ${className}`}
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
            {(['all', 'unread', 'friends', 'archived'] as const).map((option) => (
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
      <MessengerRequestList
        requests={messageRequests}
        currentUserId={currentUserId}
        onAccept={onAcceptRequest}
        onDecline={onDeclineRequest}
        onCancel={onCancelRequest}
      />
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
              className={`conversation-rail__item flex min-h-16 w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted ${activeConversationId === item.id ? 'bg-muted' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <Avatar
                src={item.participant?.avatar_url ?? undefined}
                name={item.participant?.name ?? ''}
                alt={item.participant?.name ?? 'Friend'}
                size="xs"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {item.title || item.participant?.name || 'Private conversation'}
                </span>
                {item.lastMessagePreview ? (
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.lastMessagePreview}
                  </span>
                ) : null}
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                {item.lastMessageAt ? (
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(item.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                ) : null}
                {item.unreadCount ? (
                  <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                    {item.unreadCount > 99 ? '99+' : item.unreadCount}
                  </span>
                ) : null}
              </span>
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
