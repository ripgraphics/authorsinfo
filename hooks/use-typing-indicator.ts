'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { useDebounce } from '@/hooks/use-debounce'

/**
 * Hook for managing typing indicator state in real-time chat.
 *
 * Features:
 * - Broadcasts typing events when the user types (debounced to avoid spam)
 * - Listens for typing events from other users
 * - Automatically clears typing status after a timeout (default: 3 seconds)
 * - Filters out the current user's own typing events
 * - Works with any Supabase Realtime channel
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
const TYPING_DEBOUNCE_MS = 300

export interface UseTypingIndicatorOptions {
  /** The conversation ID to broadcast/listen on. */
  conversationId: string | null
  /** The current user's ID (to filter out own typing events). */
  currentUserId: string | null
  /** Timeout in ms before a typing user is automatically removed (default: 3000). */
  timeoutMs?: number
}

export interface UseTypingIndicatorResult {
  /** Names (IDs) of users currently typing (excluding the current user). */
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
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createBrowserClient<Database>>['channel']
  > | null>(null)
  const timeoutRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Create the Supabase client once
  const clientRef = useRef<ReturnType<typeof createBrowserClient<Database>> | null>(null)
  if (!clientRef.current) {
    clientRef.current = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  const client = clientRef.current

  // Subscribe to typing events for the conversation
  useEffect(() => {
    if (!conversationId || !currentUserId) return

    // Copy timeout refs to a local variable for cleanup
    const currentTimeouts = timeoutRefs.current

    const channel = client
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
      void client.removeChannel(channel)
      // Clear all pending timeouts
      currentTimeouts.forEach((timeout) => clearTimeout(timeout))
      currentTimeouts.clear()
    }
  }, [conversationId, currentUserId, client, timeoutMs])

  // Broadcast typing event (debounced to avoid spam)
  const rawBroadcastTyping = useCallback(() => {
    if (!conversationId || !currentUserId) return
    void channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: currentUserId },
    })
  }, [conversationId, currentUserId])

  const broadcastTyping = useDebounce(rawBroadcastTyping, TYPING_DEBOUNCE_MS)

  return {
    typingUserNames: typingUsers,
    broadcastTyping,
  }
}
