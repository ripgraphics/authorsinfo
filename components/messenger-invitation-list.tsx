'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface MessengerInvitation {
  id: string
  group_id: string
  message?: string | null
  created_at?: string | null
}

export function MessengerInvitationList() {
  const [invitations, setInvitations] = useState<MessengerInvitation[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    void fetch('/api/messages/group/invitations', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setInvitations(data as MessengerInvitation[]))
  }, [])

  const respond = async (invitationId: string, action: 'accept' | 'decline') => {
    setProcessingId(invitationId)
    try {
      const response = await fetch('/api/messages/group/invitations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, invitation_id: invitationId }),
      })
      if (response.ok) {
        setInvitations((current) => current.filter((invitation) => invitation.id !== invitationId))
      }
    } finally {
      setProcessingId(null)
    }
  }

  if (invitations.length === 0) return null

  return (
    <section className="messenger-invitation-list border-b bg-muted/20 px-4 py-3">
      <h1 className="text-sm font-semibold">Message requests</h1>
      <div className="mt-2 space-y-2">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="flex items-center gap-3 rounded-md border bg-background p-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Group invitation</p>
              {invitation.message ? (
                <p className="truncate text-xs text-muted-foreground">{invitation.message}</p>
              ) : null}
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => void respond(invitation.id, 'accept')}
              disabled={processingId === invitation.id}
            >
              Accept
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void respond(invitation.id, 'decline')}
              disabled={processingId === invitation.id}
            >
              Decline
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}
