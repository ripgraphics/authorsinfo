'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

export interface MessengerRequestListItem {
  id: string
  conversationId: string
  requesterId: string
  recipientId: string
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
}

interface MessengerRequestListProps {
  requests: MessengerRequestListItem[]
  currentUserId: string | null
  onAccept?: (requestId: string) => void | Promise<void>
  onDecline?: (requestId: string) => void | Promise<void>
  onCancel?: (requestId: string) => void | Promise<void>
}

export function MessengerRequestList({
  requests,
  currentUserId,
  onAccept,
  onDecline,
  onCancel,
}: MessengerRequestListProps) {
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const pendingActionRef = useRef<string | null>(null)
  const pendingRequests = requests.filter((request) => request.status === 'pending')
  if (!pendingRequests.length) return null

  const runAction = async (requestId: string, action?: (id: string) => void | Promise<void>) => {
    if (!action || pendingActionRef.current) return
    pendingActionRef.current = requestId
    setPendingAction(requestId)
    try {
      await action(requestId)
    } finally {
      pendingActionRef.current = null
      setPendingAction(null)
    }
  }

  return (
    <section className="messenger-request-list border-b p-3" aria-label="Message requests" aria-busy={Boolean(pendingAction)}>
      <h2 className="text-xs font-semibold uppercase text-muted-foreground">Message requests</h2>
      <p className="sr-only" aria-live="polite">
        {pendingAction ? 'Updating message request' : ''}
      </p>
      <div className="mt-2 space-y-2">
        {pendingRequests.map((request) => {
          const isRecipient = request.recipientId === currentUserId
          return (
            <div key={request.id} className="rounded-md border p-2 text-sm">
              <p>{isRecipient ? 'New message request' : 'Pending message request'}</p>
              <div className="mt-2 flex gap-2">
                {isRecipient && onAccept ? <Button type="button" size="sm" disabled={Boolean(pendingAction)} onClick={() => void runAction(request.id, onAccept)}>Accept</Button> : null}
                {isRecipient && onDecline ? <Button type="button" size="sm" variant="outline" disabled={Boolean(pendingAction)} onClick={() => void runAction(request.id, onDecline)}>Decline</Button> : null}
                {!isRecipient && onCancel ? <Button type="button" size="sm" variant="outline" disabled={Boolean(pendingAction)} onClick={() => void runAction(request.id, onCancel)}>Cancel</Button> : null}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
