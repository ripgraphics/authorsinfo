'use client'

import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export interface ParticipantDetailsPanelProps {
  participant: {
    id: string
    name: string | null
    avatar_url?: string | null
  } | null
  members?: Array<{
    id: string
    name: string | null
    avatar_url?: string | null
    role?: string | null
  }>
  groupTitle?: string | null
  historyPolicy?: 'retained_moderated' | null
  canLeave?: boolean
  onLeave?: () => void
  leaving?: boolean
  canInvite?: boolean
  onInvite?: () => void
  inviteCandidates?: Array<{
    id: string
    name: string | null
    avatar_url?: string | null
  }>
  onInviteMember?: (memberId: string) => void
  invitingMemberId?: string | null
  canMarkUnread?: boolean
  onMarkUnread?: () => void
  canBlock?: boolean
  onBlock?: () => void
  isMuted?: boolean
  canMute?: boolean
  onToggleMute?: () => void
  isArchived?: boolean
  canArchive?: boolean
  onToggleArchive?: () => void
  isRestricted?: boolean
  canRestrict?: boolean
  onToggleRestrict?: () => void
  title?: string
  description?: string
  className?: string
}

export function ParticipantDetailsPanel({
  participant,
  members = [],
  groupTitle,
  historyPolicy = null,
  canLeave = false,
  onLeave,
  leaving = false,
  canInvite = false,
  onInvite,
  inviteCandidates = [],
  onInviteMember,
  invitingMemberId = null,
  canMarkUnread = false,
  onMarkUnread,
  canBlock = false,
  onBlock,
  isMuted = false,
  canMute = false,
  onToggleMute,
  isArchived = false,
  canArchive = false,
  onToggleArchive,
  isRestricted = false,
  canRestrict = false,
  onToggleRestrict,
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
        <h2 className="mt-4 font-semibold">{groupTitle || participant?.name || 'Participant'}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        {historyPolicy ? (
          <div className="mt-4 w-full rounded-md bg-muted/40 px-3 py-2 text-left">
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">History</p>
            <p className="mt-1 text-xs">Retained and moderated</p>
          </div>
        ) : null}
        {members.length > 0 ? (
          <div className="mt-6 w-full border-t pt-4 text-left">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Members ({members.length})
            </p>
            <div className="mt-3 space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-2">
                  <Avatar
                    src={member.avatar_url ?? undefined}
                    name={member.name ?? ''}
                    alt={member.name ?? 'Member'}
                    size="xs"
                  />
                  <span className="truncate text-sm">{member.name || 'Member'}</span>
                  {member.role ? <span className="ml-auto text-[10px] text-muted-foreground">{member.role}</span> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {canLeave && onLeave ? (
          <Button
            type="button"
            variant="outline"
            className="mt-6 w-full"
            onClick={onLeave}
            disabled={leaving}
          >
            {leaving ? 'Leaving...' : 'Leave conversation'}
          </Button>
        ) : null}
        {canInvite && onInvite ? (
          <Button type="button" variant="outline" className="mt-2 w-full" onClick={onInvite}>
            Invite member
          </Button>
        ) : null}
        {canInvite && onInviteMember && inviteCandidates.length > 0 ? (
          <div className="mt-3 w-full space-y-2 text-left">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Invite friends</p>
            {inviteCandidates.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                className="flex w-full items-center gap-2 rounded-md p-1 text-left hover:bg-muted"
                onClick={() => onInviteMember(candidate.id)}
                disabled={invitingMemberId === candidate.id}
              >
                <Avatar
                  src={candidate.avatar_url ?? undefined}
                  name={candidate.name ?? ''}
                  alt={candidate.name ?? 'Friend'}
                  size="xs"
                />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {candidate.name || 'Friend'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {invitingMemberId === candidate.id ? '...' : 'Invite'}
                </span>
              </button>
            ))}
          </div>
        ) : null}
        {canMarkUnread && onMarkUnread ? (
          <Button type="button" variant="outline" className="mt-2 w-full" onClick={onMarkUnread}>
            Mark unread
          </Button>
        ) : null}
        {canBlock && onBlock ? (
          <Button type="button" variant="outline" className="mt-2 w-full" onClick={onBlock}>
            Block participant
          </Button>
        ) : null}
        {canMute && onToggleMute ? (
          <Button type="button" variant="outline" className="mt-2 w-full" onClick={onToggleMute}>
            {isMuted ? 'Unmute conversation' : 'Mute conversation'}
          </Button>
        ) : null}
        {canArchive && onToggleArchive ? (
          <Button type="button" variant="outline" className="mt-2 w-full" onClick={onToggleArchive}>
            {isArchived ? 'Unarchive conversation' : 'Archive conversation'}
          </Button>
        ) : null}
        {canRestrict && onToggleRestrict ? (
          <Button type="button" variant="outline" className="mt-2 w-full" onClick={onToggleRestrict}>
            {isRestricted ? 'Unrestrict participant' : 'Restrict participant'}
          </Button>
        ) : null}
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
