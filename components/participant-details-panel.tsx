'use client'

import { Avatar } from '@/components/ui/avatar'
import { IconButton } from '@/components/ui/icon-button'
import { Bell, ChevronDown, LockKeyhole, Search, UserRound } from 'lucide-react'
import { useState } from 'react'

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
  onProfile?: () => void
  onSearch?: () => void
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
  onProfile,
  onSearch,
  title = 'Details',
  description = 'Conversation details',
  className = '',
}: ParticipantDetailsPanelProps) {
  const [openSection, setOpenSection] = useState<string | null>(null)
  const sections = [
    { id: 'info', label: 'Chat Info', body: description },
    { id: 'customize', label: 'Customize chat', body: 'Conversation appearance and notification preferences' },
    { id: 'media', label: 'Media & files', body: 'Shared media and files will appear here' },
    { id: 'privacy', label: 'Privacy & support', body: 'Conversation safety and support options' },
  ]

  return (
    <aside className={`participant-details-panel fixed right-0 top-16 z-40 flex h-[calc(100vh-4rem)] w-[min(386px,calc(100vw-1rem))] shrink-0 border-l bg-background shadow-2xl min-[1200px]:static min-[1200px]:h-auto min-[1200px]:w-[min(32vw,386px)] min-[1200px]:shadow-none ${className}`}>
      <div className="participant-details-panel__content flex h-full flex-col items-center overflow-y-auto px-5 py-8 text-center">
        <Avatar
          src={participant?.avatar_url ?? undefined}
          name={participant?.name ?? ''}
          alt={participant?.name ?? 'Participant'}
          size="lg"
        />
        <h2 className="mt-4 font-semibold">{groupTitle || participant?.name || 'Participant'}</h2>
        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
          <LockKeyhole className="h-3 w-3" aria-hidden="true" />
          <span>{activePrivacyLabel(groupTitle, historyPolicy)}</span>
        </div>
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <IconButton icon={UserRound} label="Open profile" tone="muted" onClick={onProfile} />
            <span className="text-[11px] text-muted-foreground">Profile</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <IconButton icon={Bell} label="Conversation notifications" tone="muted" onClick={onToggleMute} />
            <span className="text-[11px] text-muted-foreground">Mute</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <IconButton icon={Search} label="Search conversation" tone="muted" onClick={onSearch} />
            <span className="text-[11px] text-muted-foreground">Search</span>
          </div>
        </div>
        <div className="mt-7 w-full text-left">
          {sections.map((section) => {
            const isOpen = openSection === section.id
            return (
              <div key={section.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-4 text-sm font-medium hover:text-primary"
                  aria-expanded={isOpen}
                  onClick={() => setOpenSection(isOpen ? null : section.id)}
                >
                  <span>{section.label}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {isOpen ? <p className="pb-4 text-xs text-muted-foreground">{section.body}</p> : null}
              </div>
            )
          })}
        </div>
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

function activePrivacyLabel(groupTitle: string | null | undefined, historyPolicy: string | null) {
  if (groupTitle || historyPolicy) return 'Moderated conversation'
  return 'Private conversation'
}
