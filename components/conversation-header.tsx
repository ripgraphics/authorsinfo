'use client'

import { ArrowLeft, Minus, Phone, Video, X } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { IconButton } from '@/components/ui/icon-button'

export interface ConversationHeaderParticipant {
  name: string | null
  avatar_url?: string | null
}

export interface ConversationHeaderProps {
  participant: ConversationHeaderParticipant | null
  presenceLabel?: string
  showMinimize?: boolean
  showClose?: boolean
  showBack?: boolean
  onAudioCall?: () => void
  onVideoCall?: () => void
  onMinimize?: () => void
  onClose?: () => void
  onBack?: () => void
  className?: string
}

export function ConversationHeader({
  participant,
  presenceLabel,
  showMinimize = false,
  showClose = false,
  showBack = false,
  onAudioCall,
  onVideoCall,
  onMinimize,
  onClose,
  onBack,
  className = '',
}: ConversationHeaderProps) {
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
        <p className="truncate font-semibold">{participant?.name || 'Chat'}</p>
        {presenceLabel ? <p className="truncate text-xs text-primary-foreground/75">{presenceLabel}</p> : null}
      </div>
      <div className="conversation-header__actions flex shrink-0 items-center gap-0.5">
        <IconButton icon={Phone} label="Audio call" tone="theme" onClick={onAudioCall} className="conversation-header__audio [&_svg]:size-5" />
        <IconButton icon={Video} label="Video call" tone="theme" onClick={onVideoCall} className="conversation-header__video [&_svg]:size-5" />
        {showMinimize ? <IconButton icon={Minus} label="Minimize chat" tone="theme" onClick={onMinimize} className="conversation-header__minimize [&_svg]:size-5" /> : null}
        {showClose ? <IconButton icon={X} label="Close" tone="theme" onClick={onClose} className="conversation-header__close [&_svg]:size-5" /> : null}
      </div>
    </header>
  )
}
