'use client'

import { useEffect, useState } from 'react'

/**
 * Shared unread chat count between the page header's Messages button and
 * the floating chat. The floating chat polls the server and broadcasts
 * the total via a window event; this hook subscribes to it so the header
 * badge stays in sync without duplicating the N+1 fetch.
 */

const UNREAD_EVENT = 'authorsinfo:chat-unread-total'

export function broadcastChatUnreadTotal(total: number) {
  window.dispatchEvent(new CustomEvent(UNREAD_EVENT, { detail: total }))
}

export function useChatUnreadTotal(): number {
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const handle = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail
      if (typeof detail === 'number' && Number.isFinite(detail)) setTotal(detail)
    }
    window.addEventListener(UNREAD_EVENT, handle)
    return () => window.removeEventListener(UNREAD_EVENT, handle)
  }, [])

  return total
}
