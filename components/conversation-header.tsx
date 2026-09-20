'use client'

import { ArrowLeft, Ellipsis, Minus, Phone, RefreshCw, Video, X } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { IconButton } from '@/components/ui/icon-button'

export interface ConversationHeaderParticipant {
  name: string | null
  avatar_url?: string | null
}

export interface ConversationHeaderProps {
  participant: ConversationHeaderParticipant | null
  title?: string
  presenceLabel?: string
  connectionLabel?: string
  showMinimize?: boolean
  showClose?: boolean
  showBack?: boolean
  onAudioCall?: () => void
  onVideoCall?: () => void
  onMinimize?: () => void
  onClose?: () => void
  onBack?: () => void
  onReconnect?: () => void
  onMarkUnread?: () => void
  onBlock?: () => void
  isMuted?: boolean
  onToggleMute?: () => void
  isArchived?: boolean
  onToggleArchive?: () => void
  isRestricted?: boolean
  onToggleRestrict?: () => void
  className?: string
}

export function ConversationHeader({
  participant,
  title,
  presenceLabel,
  connectionLabel,
  showMinimize = false,
  showClose = false,
  showBack = false,
  onAudioCall,
  onVideoCall,
  onMinimize,
  onClose,
  onBack,
  onReconnect,
  onMarkUnread,
  onBlock,
  isMuted = false,
  onToggleMute,
  isArchived = false,
  onToggleArchive,
  isRestricted = false,
  onToggleRestrict,
  className = '',
}: ConversationHeaderProps) {
  const [actionsOpen, setActionsOpen] = useState(false)

  return (
    <header className={`conversation-header flex items-center gap-3 border-b bg-primary px-4 py-3 text-primary-foreground ${className}`}>
      {showBack ? <IconButton icon={ArrowLeft} label="Back to conversations" tone="theme" onClick={onBack} className="conversation-header__back md:hidden [&_svg]:size-5" /> : null}
      {participant ? (
        <Avatar
          src={participant.avatar_url ?? undefined}
          name={participant.name ?? ''}
          alt={participant.name ?? 'Friend'}
          size="xs"
          className="conversation-header__avatar ring-2 ring-primary-foreground/40"
        />
      ) : null}
      <div className="conversation-header__identity min-w-0 flex-1">
        <p className="truncate font-semibold">{participant?.name || title || 'Chat'}</p>
        {presenceLabel || connectionLabel ? (
          <p className="truncate text-xs text-primary-foreground/75">
            {connectionLabel || presenceLabel}
          </p>
        ) : null}
      </div>
      <div className="conversation-header__actions relative flex shrink-0 items-center gap-0.5">
        {onMarkUnread || onBlock || onToggleMute || onToggleArchive || onToggleRestrict ? (
          <>
            <IconButton
              icon={Ellipsis}
              label="Conversation actions"
              tone="theme"
              className="conversation-header__menu [&_svg]:size-5"
              onClick={() => setActionsOpen((open) => !open)}
            />
            {actionsOpen ? (
              <div
                role="menu"
                aria-label="Conversation actions"
                className="absolute right-0 top-full z-50 mt-2 min-w-44 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
              >
                {onMarkUnread ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => { setActionsOpen(false); onMarkUnread() }}
                  >
                    Mark unread
                  </button>
                ) : null}
                {onBlock ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => { setActionsOpen(false); onBlock() }}
                  >
                    Block participant
                  </button>
                ) : null}
                {onToggleMute ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => { setActionsOpen(false); onToggleMute() }}
                  >
                    {isMuted ? 'Unmute conversation' : 'Mute conversation'}
                  </button>
                ) : null}
                {onToggleArchive ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => { setActionsOpen(false); onToggleArchive() }}
                  >
                    {isArchived ? 'Unarchive conversation' : 'Archive conversation'}
                  </button>
                ) : null}
                {onToggleRestrict ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => { setActionsOpen(false); onToggleRestrict() }}
                  >
                    {isRestricted ? 'Unrestrict participant' : 'Restrict participant'}
                  </button>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
        {onReconnect ? <IconButton icon={RefreshCw} label="Reconnect chat" tone="theme" onClick={onReconnect} className="conversation-header__reconnect [&_svg]:size-5" /> : null}
        {onAudioCall ? <IconButton icon={Phone} label="Audio call" tone="theme" onClick={onAudioCall} className="conversation-header__audio [&_svg]:size-5" /> : null}
        {onVideoCall ? <IconButton icon={Video} label="Video call" tone="theme" onClick={onVideoCall} className="conversation-header__video [&_svg]:size-5" /> : null}
        {showMinimize ? <IconButton icon={Minus} label="Minimize chat" tone="theme" onClick={onMinimize} className="conversation-header__minimize [&_svg]:size-5" /> : null}
        {showClose ? <IconButton icon={X} label="Close" tone="theme" onClick={onClose} className="conversation-header__close [&_svg]:size-5" /> : null}
      </div>
    </header>
  )
}
