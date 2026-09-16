'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabaseClient } from '@/lib/supabase/client'

/**
 * Hook for managing typing indicator state in real-time chat.
 *
 * Features:
 * - Broadcasts typing events while the user types (throttled to avoid spam)
 * - Listens for typing events from other users
 * - Resolves user IDs to display names (falls back to "Someone")
 * - Automatically clears typing status after a timeout (default: 3 seconds)
 * - Filters out the current user's own typing events
 * - Uses the shared singleton Supabase browser client (no websocket churn)
 *
 * Usage:
 * ```tsx
 * const { typingUserNames, broadcastTyping } = useTypingIndicator({
 *   conversationId: 'some-conversation-id',
 *   currentUserId: 'current-user-id',
 * })
 * ```
 */

const TYPING_TIMEOUT_MS = 3000
const TYPING_THROTTLE_MS = 300

export interface UseTypingIndicatorOptions {
  /** The conversation ID to broadcast/listen on. */
  conversationId: string | null
  /** The current user's ID (to filter out own typing events). */
  currentUserId: string | null
  /** Timeout in ms before a typing user is automatically removed (default: 3000). */
  timeoutMs?: number
}

export interface UseTypingIndicatorResult {
  /** Display names of users currently typing (excluding the current user). */
  typingUserNames: string[]
  /** Call this when the user types to broadcast a typing event. */
  broadcastTyping: () => void
}

export function useTypingIndicator({
  conversationId,
  currentUserId,
  timeoutMs = TYPING_TIMEOUT_MS,
}: UseTypingIndicatorOptions): UseTypingIndicatorResult {
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({})
  const channelRef = useRef<RealtimeChannel | null>(null)
  const timeoutRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  // IDs we've already attempted to resolve, so we don't refetch on every event.
  const resolvedIdsRef = useRef<Set<string>>(new Set())

  // Subscribe to typing events for the conversation
  useEffect(() => {
    if (!conversationId || !currentUserId) return

    // Copy timeout refs to a local variable for cleanup
    const currentTimeouts = timeoutRefs.current

    const channel = supabaseClient
      .channel(`typing-${conversationId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const userId = payload?.user_id as string | undefined
        if (!userId || userId === currentUserId) return

        // Clear existing timeout for this user
        const existingTimeout = currentTimeouts.get(userId)
        if (existingTimeout) {
          clearTimeout(existingTimeout)
        }

        // Add user to typing list if not already there
        setTypingUsers((current) => (current.includes(userId) ? current : [...current, userId]))

        // Set a new timeout to remove the user after timeoutMs
        const newTimeout = setTimeout(() => {
          setTypingUsers((current) => current.filter((id) => id !== userId))
          currentTimeouts.delete(userId)
        }, timeoutMs)

        currentTimeouts.set(userId, newTimeout)
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      channelRef.current = null
      void supabaseClient.removeChannel(channel)
      // Clear all pending timeouts
      currentTimeouts.forEach((timeout) => clearTimeout(timeout))
      currentTimeouts.clear()
    }
  }, [conversationId, currentUserId, timeoutMs])

  // Resolve any unknown typing user IDs to display names.
  useEffect(() => {
    const unknownIds = typingUsers.filter((id) => !resolvedIdsRef.current.has(id))
    if (unknownIds.length === 0) return

    unknownIds.forEach((id) => resolvedIdsRef.current.add(id))

    let active = true
    void supabaseClient
      .from('users')
      .select('id, name')
      .in('id', unknownIds)
      .then(({ data }) => {
        if (!active || !data) return
        setDisplayNames((current) => {
          const next = { ...current }
          for (const row of data as Array<{ id: string; name: string | null }>) {
            if (row.name) next[row.id] = row.name
          }
          return next
        })
      })

    return () => {
      active = false
    }
  }, [typingUsers])

  // Broadcast typing event, throttled so a typing burst sends at most one
  // event per TYPING_THROTTLE_MS instead of one per keystroke.
  const lastSentRef = useRef(0)
  const trailingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const broadcastTyping = useCallback(() => {
    if (!conversationId || !currentUserId) return

    const send = () => {
      lastSentRef.current = Date.now()
      void channelRef.current?.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: currentUserId },
      })
    }

    const elapsed = Date.now() - lastSentRef.current
    if (elapsed >= TYPING_THROTTLE_MS) {
      send()
      return
    }

    if (!trailingRef.current) {
      trailingRef.current = setTimeout(
        () => {
          trailingRef.current = null
          send()
        },
        TYPING_THROTTLE_MS - elapsed
      )
    }
  }, [conversationId, currentUserId])

  useEffect(
    () => () => {
      if (trailingRef.current) clearTimeout(trailingRef.current)
    },
    []
  )

  const typingUserNames = typingUsers.map((id) => displayNames[id] ?? 'Someone')

  return {
    typingUserNames,
    broadcastTyping,
  }
}
