'use client'

import { forwardRef, type Ref } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TypingIndicator } from '@/components/typing-indicator'
import { formatChatTimestamp } from '@/lib/utils/dateUtils'

export interface DirectMessageListMessage {
  id: string
  sender_id: string
  body: string
  created_at: string
  deleted_at: string | null
  read_at?: string | null
  read_by?: string | null
}

export interface DirectMessageListParticipant {
  name: string | null
  avatar_url?: string | null
}

export interface DirectMessageListProps {
  messages: DirectMessageListMessage[]
  currentUserId: string | null
  participant: DirectMessageListParticipant | null
  typingUserNames: string[]
  loading?: boolean
  emptyText?: string
  className?: string
}

export const DirectMessageList = forwardRef<HTMLDivElement, DirectMessageListProps>(
  function DirectMessageList(
    {
      messages,
      currentUserId,
      participant,
      typingUserNames,
      loading = false,
      emptyText = 'No messages yet.',
      className = '',
    },
    ref: Ref<HTMLDivElement>
  ) {
    return (
      <div
        ref={ref}
        className={`direct-message-list flex-1 space-y-2 overflow-y-auto p-3 ${className}`}
      >
        {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
        {messages.map((message, index) => {
          const previousMessage = messages[index - 1]
          const showDate =
            !previousMessage ||
            new Date(previousMessage.created_at).toDateString() !==
              new Date(message.created_at).toDateString()
          const isOwnMessage = message.sender_id === currentUserId

          return (
            <div key={message.id} className="direct-message-list__group">
              {showDate ? (
                <div className="direct-message-list__date my-3 text-center text-[11px] text-muted-foreground">
                  {new Date(message.created_at).toLocaleDateString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              ) : null}
              <div
                className={`direct-message-list__row flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                {!isOwnMessage ? (
                  <Avatar
                    src={participant?.avatar_url ?? undefined}
                    name={participant?.name ?? ''}
                    alt={participant?.name ?? 'Friend'}
                    size="xs"
                  />
                ) : null}
                <div
                  className={`direct-message-list__bubble max-w-[82%] rounded-xl px-3 py-2 text-sm shadow-sm ${
                    isOwnMessage
                      ? 'bg-app-theme-blue text-primary-foreground rounded-br-lg rounded-tl-lg rounded-tr-md'
                      : 'bg-muted text-foreground rounded-bl-lg rounded-br-md rounded-tl-md rounded-tr-lg'
                  }`}
                >
                  {message.deleted_at ? <em>Message deleted</em> : message.body}
                </div>
              </div>
              <div
                className={`direct-message-list__time mt-1 text-[10px] text-muted-foreground ${isOwnMessage ? 'text-right' : 'text-left'}`}
              >
                {formatChatTimestamp(message.created_at)}
              </div>
              {isOwnMessage && message.read_at && message.read_by ? (
                <div className="direct-message-list__receipt mt-0.5 flex justify-end">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex h-3.5 w-3.5 cursor-help">
                        <Avatar
                          src={participant?.avatar_url ?? undefined}
                          name={participant?.name ?? ''}
                          alt="Seen by recipient"
                          size="receipt"
                          className="border shadow-none"
                        />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Seen by {participant?.name || 'recipient'} at{' '}
                      {formatChatTimestamp(message.read_at)}
                    </TooltipContent>
                  </Tooltip>
                </div>
              ) : null}
            </div>
          )
        })}
        {!loading && messages.length === 0 ? (
          <p className="direct-message-list__empty text-sm text-muted-foreground">{emptyText}</p>
        ) : null}
        <TypingIndicator
          typingUserNames={typingUserNames}
          className="direct-message-list__typing"
        />
      </div>
    )
  }
)

DirectMessageList.displayName = 'DirectMessageList'
