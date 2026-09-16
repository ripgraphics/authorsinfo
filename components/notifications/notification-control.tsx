'use client'

import { useEffect, useState } from 'react'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { NotificationCenter } from '@/components/notifications/notification-center'
import { supabaseClient } from '@/lib/supabase/client'
import useNotificationStore from '@/lib/stores/notification-store'

export function NotificationControl() {
  const [open, setOpen] = useState(false)
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications)

  useEffect(() => {
    let active = true
    let channel: ReturnType<typeof supabaseClient.channel> | null = null

    void supabaseClient.auth.getUser().then(({ data }) => {
      if (!active || !data.user) return
      channel = supabaseClient
        .channel(`notifications-${data.user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${data.user.id}`,
          },
          () => {
            void fetchNotifications({ read: false })
          }
        )
        .subscribe()
    })

    return () => {
      active = false
      if (channel) void supabaseClient.removeChannel(channel)
    }
  }, [fetchNotifications])

  return (
    <>
      <NotificationBell onClick={() => setOpen(true)} />
      {open ? <NotificationCenter isOpen onClose={() => setOpen(false)} /> : null}
    </>
  )
}