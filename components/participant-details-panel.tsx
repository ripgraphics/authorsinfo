'use client'

import { Avatar } from '@/components/ui/avatar'

export interface ParticipantDetailsPanelProps {
  participant: {
    id: string
    name: string | null
    avatar_url?: string | null
  } | null
  title?: string
  description?: string
  className?: string
}

export function ParticipantDetailsPanel({
  participant,
  title = 'Details',
  description = 'Conversation details',
  className = '',
}: ParticipantDetailsPanelProps) {
  return (
    <aside className={`participant-details-panel hidden w-64 shrink-0 border-l bg-muted/10 lg:block ${className}`}>
      <div className="participant-details-panel__content flex flex-col items-center px-5 py-8 text-center">
        <Avatar
          src={participant?.avatar_url ?? undefined}
          name={participant?.name ?? ''}
          alt={participant?.name ?? 'Participant'}
          size="lg"
        />
        <h2 className="mt-4 font-semibold">{participant?.name || 'Participant'}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        <div className="mt-8 w-full border-t pt-4 text-left">
          <p className="text-xs font-semibold uppercase text-muted-foreground">{title}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Messages, media, and conversation settings
          </p>
        </div>
      </div>
    </aside>
  )
}
