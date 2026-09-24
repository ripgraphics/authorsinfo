'use client'

import { forwardRef, type Ref, useState } from 'react'
import { Copy, Download, Ellipsis, Flag, Forward, Heart, Pencil, Pin, Reply, Smile, Trash2 } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TypingIndicator } from '@/components/typing-indicator'
import { IconButton } from '@/components/ui/icon-button'
import { formatChatTimestamp } from '@/lib/utils/dateUtils'
import type { MessengerMessage } from '@/lib/messaging/message-types'

export type DirectMessageListMessage = MessengerMessage

export interface DirectMessageListParticipant {
  name: string | null
  avatar_url?: string | null
}

export interface DirectMessageListProps {
  messages: DirectMessageListMessage[]
  currentUserId: string | null
  participant: DirectMessageListParticipant | null
  conversationIntroLabel?: string
  typingUserNames: string[]
  loading?: boolean
  emptyText?: string
  className?: string
  onEdit?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onReaction?: (messageId: string) => void
  onCopy?: (messageId: string) => void
  hasMore?: boolean
  loadingOlder?: boolean
  onLoadOlder?: () => void
  loadError?: string | null
  onRetry?: () => void
  onReport?: (messageId: string) => void
  onReply?: (messageId: string) => void
  onForward?: (messageId: string) => void
  pinnedMessageIds?: Set<string>
  onTogglePin?: (messageId: string) => void
  onDeleteForMe?: (messageId: string) => void
  conversationUnavailable?: boolean
  onBackToInbox?: () => void
}

export const DirectMessageList = forwardRef<HTMLDivElement, DirectMessageListProps>(
  function DirectMessageList(
    {
      messages,
      currentUserId,
      participant,
      conversationIntroLabel,
      typingUserNames,
      loading = false,
      emptyText = 'No messages yet.',
      className = '',
      onEdit,
      onDelete,
      onReaction,
      onCopy,
      hasMore = false,
      loadingOlder = false,
      onLoadOlder,
      loadError = null,
      onRetry,
      onReport,
      onReply,
      onForward,
      pinnedMessageIds = new Set(),
      onTogglePin,
      onDeleteForMe,
      conversationUnavailable = false,
      onBackToInbox,
    },
    ref: Ref<HTMLDivElement>
  ) {
    return (
      <div
        ref={ref}
        className={`direct-message-list flex-1 space-y-2 overflow-y-auto p-3 ${className}`}
      >
        {hasMore && onLoadOlder ? (
          <button
            type="button"
            aria-label="Load older messages"
            className="mx-auto block rounded px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
            onClick={onLoadOlder}
            disabled={loadingOlder}
          >
            {loadingOlder ? 'Loading older messages...' : 'Load older messages'}
          </button>
        ) : null}
        {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
        {conversationUnavailable ? (
          <div className="mx-auto flex max-w-sm flex-col items-center gap-2 py-4 text-center text-sm text-muted-foreground">
            <p>This conversation is unavailable.</p>
            {onBackToInbox ? (
              <button type="button" className="rounded border px-3 py-1 text-xs text-foreground hover:bg-muted" onClick={onBackToInbox}>
                Back to inbox
              </button>
            ) : null}
          </div>
        ) : null}
        {loadError && !conversationUnavailable ? (
          <div className="mx-auto flex max-w-sm flex-col items-center gap-2 py-4 text-center text-sm text-destructive">
            <p>{loadError}</p>
            {onRetry ? (
              <button
                type="button"
                aria-label="Retry loading messages"
                className="rounded border px-3 py-1 text-xs text-foreground hover:bg-muted"
                onClick={onRetry}
              >
                Retry
              </button>
            ) : null}
          </div>
        ) : null}
        {conversationIntroLabel && participant ? (
          <div className="direct-message-list__conversation-intro flex flex-col items-center px-6 py-8 text-center">
            <Avatar
              src={participant.avatar_url ?? undefined}
              name={participant.name ?? ''}
              alt={participant.name ?? 'Participant'}
              size="lg"
            />
            <h2 className="mt-3 text-base font-semibold">
              {participant.name || 'Conversation'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{conversationIntroLabel}</p>
          </div>
        ) : null}
        {messages.map((message, index) => {
          const previousMessage = messages[index - 1]
          const showDate =
            !previousMessage ||
            new Date(previousMessage.createdAt).toDateString() !==
              new Date(message.createdAt).toDateString()
          const isOwnMessage = message.senderId === currentUserId
          const hasMessageActions = !message.deletedAt && (
            isOwnMessage
              ? Boolean(onEdit || onDelete || onReaction || onCopy || onReply || onForward || onTogglePin || onDeleteForMe)
              : Boolean(onCopy || onReport || onReply || onForward || onTogglePin || onDeleteForMe)
          )
          const messageActions = hasMessageActions ? (
            <div className="direct-message-list__actions flex shrink-0 items-center gap-1 rounded-full bg-background p-1 opacity-0 shadow-md ring-1 ring-border transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              {onReaction ? (
                <IconButton icon={Smile} label="React to message" tone="muted" size="sm" onClick={() => onReaction(message.id)} />
              ) : null}
              {onReply ? (
                <IconButton icon={Reply} label="Reply to message" tone="muted" size="sm" onClick={() => onReply(message.id)} />
              ) : null}
              <details className="relative">
                <summary className="list-none [&::-webkit-details-marker]:hidden">
                  <IconButton icon={Ellipsis} label="More message actions" tone="muted" size="sm" />
                </summary>
                <div className="absolute bottom-full right-0 z-20 mb-1 grid min-w-44 gap-1 rounded-lg border bg-background p-1 text-sm shadow-lg">
                  {onCopy ? <button type="button" className="rounded px-3 py-2 text-left hover:bg-accent" onClick={() => onCopy(message.id)}>Copy</button> : null}
                  {!isOwnMessage && onReport ? <button type="button" className="rounded px-3 py-2 text-left hover:bg-accent" onClick={() => onReport(message.id)}>Report</button> : null}
                  {onForward ? <button type="button" className="rounded px-3 py-2 text-left hover:bg-accent" onClick={() => onForward(message.id)}>Forward</button> : null}
                  {onTogglePin ? <button type="button" className="rounded px-3 py-2 text-left hover:bg-accent" onClick={() => onTogglePin(message.id)}>{pinnedMessageIds.has(message.id) ? 'Unpin' : 'Pin'}</button> : null}
                  {onDeleteForMe ? <button type="button" className="rounded px-3 py-2 text-left hover:bg-accent" onClick={() => onDeleteForMe(message.id)}>Delete for me</button> : null}
                  {onEdit ? <button type="button" className="rounded px-3 py-2 text-left hover:bg-accent" onClick={() => onEdit(message.id)}>Edit</button> : null}
                  {onDelete ? <button type="button" className="rounded px-3 py-2 text-left hover:bg-accent" onClick={() => onDelete(message.id)}>Delete</button> : null}
                </div>
              </details>
            </div>
          ) : null

          return (
            <div key={message.id} className="direct-message-list__group group relative">
              {showDate ? (
                <div className="direct-message-list__date my-3 text-center text-[11px] text-muted-foreground">
                  {new Date(message.createdAt).toLocaleDateString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              ) : null}
              <div
                className={`direct-message-list__row flex items-center gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                {!isOwnMessage ? (
                  <Avatar
                    src={participant?.avatar_url ?? undefined}
                    name={participant?.name ?? ''}
                    alt={participant?.name ?? 'Friend'}
                    size="xs"
                    className="shrink-0"
                  />
                ) : null}
                {isOwnMessage ? messageActions : null}
                <div
                  className={`direct-message-list__bubble max-w-[82%] rounded-xl px-3 py-2 text-sm shadow-sm ${
                    isOwnMessage
                      ? 'bg-app-theme-blue text-primary-foreground rounded-br-lg rounded-tl-lg rounded-tr-md'
                      : 'bg-muted text-foreground rounded-bl-lg rounded-br-md rounded-tl-md rounded-tr-lg'
                  }`}
                >
                  {message.replyToMessageId ? (() => {
                    const parentMessage = messages.find((item) => item.id === message.replyToMessageId)
                    return parentMessage ? (
                      <div className="mb-2 rounded border-l-2 border-current/40 pl-2 text-xs opacity-80">
                        <p className="font-semibold">Replying to message</p>
                        <p className="truncate">{parentMessage.body}</p>
                      </div>
                    ) : null
                  })() : null}
                  {message.deletedAt ? <em>Message deleted</em> : message.body}
                  {message.attachments?.length ? (
                    <div className="mt-2 space-y-1 border-t border-current/20 pt-2">
                      {message.attachments.map((attachment) => (
                        <div key={attachment.id} className="space-y-1">
                          {(() => {
                            const attachmentUrl = `/api/messages/direct/${message.conversationId ?? ''}/attachments?message_id=${encodeURIComponent(message.id)}&attachment_id=${encodeURIComponent(attachment.id)}`
                            if (attachment.mimeType.startsWith('image/')) {
                              return <img src={attachmentUrl} alt={attachment.fileName} className="max-h-56 max-w-full rounded object-contain" />
                            }
                            if (attachment.mimeType.startsWith('video/')) {
                              return <video src={attachmentUrl} controls preload="metadata" className="max-h-56 max-w-full rounded" aria-label={attachment.fileName} />
                            }
                            if (attachment.mimeType.startsWith('audio/')) {
                              return <audio src={attachmentUrl} controls preload="metadata" className="w-full" aria-label={attachment.fileName} />
                            }
                            return null
                          })()}
                          <a
                            href={`/api/messages/direct/${message.conversationId ?? ''}/attachments?message_id=${encodeURIComponent(message.id)}&attachment_id=${encodeURIComponent(attachment.id)}`}
                            className="flex items-center gap-2 text-xs underline"
                            download={attachment.fileName}
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span className="truncate">{attachment.fileName}</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                {!isOwnMessage ? messageActions : null}
              </div>
              <div
                className={`direct-message-list__time mt-1 text-[10px] text-muted-foreground ${isOwnMessage ? 'text-right' : 'text-left'}`}
              >
                {formatChatTimestamp(message.createdAt)}
              </div>
              {pinnedMessageIds.has(message.id) ? <span className="direct-message-list__pinned text-[10px] text-muted-foreground">Pinned</span> : null}
              {message.mentionUserIds?.length ? <span className="direct-message-list__mentions text-[10px] text-muted-foreground">Mentioned users</span> : null}
              {isOwnMessage && message.readAt && message.readBy ? (
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
                      {formatChatTimestamp(message.readAt)}
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
