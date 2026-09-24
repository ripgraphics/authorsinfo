'use client'

import { Info, PanelLeft, PanelLeftClose, Phone, Video } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { IconButton } from '@/components/ui/icon-button'

interface MessengerConversationHeaderProps {
  participant: {
    name: string | null
    avatar_url?: string | null
  } | null
  onAudioCall?: () => void
  onVideoCall?: () => void
  audioCallAvailable?: boolean
  videoCallAvailable?: boolean
  onDetails?: () => void
  leftRailOpen?: boolean
  onToggleLeftRail?: () => void
}

export function MessengerConversationHeader({
  participant,
  onAudioCall,
  onVideoCall,
  audioCallAvailable = false,
  videoCallAvailable = false,
  onDetails,
  leftRailOpen = true,
  onToggleLeftRail,
}: MessengerConversationHeaderProps) {
  return (
    <header className="messenger-conversation-header flex shrink-0 items-center justify-between border-b bg-background px-4 py-3 text-foreground">
      <div className="flex min-w-0 items-center gap-2">
        {onToggleLeftRail ? (
          <IconButton
            icon={leftRailOpen ? PanelLeftClose : PanelLeftOpen}
            label={leftRailOpen ? 'Hide conversations' : 'Show conversations'}
            tone="muted"
            onClick={onToggleLeftRail}
          />
        ) : null}
        {participant ? (
          <Avatar
            src={participant.avatar_url ?? undefined}
            name={participant.name ?? ''}
            alt={participant.name ?? 'Friend'}
            size="xs"
          />
        ) : null}
        <p className="truncate font-semibold">{participant?.name || 'Messenger'}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <IconButton icon={Phone} label="Audio call" tone="muted" onClick={onAudioCall} disabled={!audioCallAvailable} />
        <IconButton icon={Video} label="Video call" tone="muted" onClick={onVideoCall} disabled={!videoCallAvailable} />
        {onDetails ? <IconButton icon={Info} label="Conversation details" tone="muted" onClick={onDetails} /> : null}
      </div>
    </header>
  )
}
