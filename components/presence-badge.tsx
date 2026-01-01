'use client'

import { useEffect } from 'react'
import { useRealtimeStore } from '@/lib/stores/realtime-store'
import { useAuth } from '@/hooks/useAuth'

export function PresenceIndicator() {
  const { user } = useAuth()
  const { userPresence, updatePresence } = useRealtimeStore()

  useEffect(() => {
    if (!user?.id) return

    const handleVisibilityChange = () => {
      const status = document.hidden ? 'away' : 'online'
      updatePresence(status as 'online' | 'away', false)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user?.id, updatePresence])

  const onlineCount = Array.from(userPresence.values()).filter(
    (p) => p.status === 'online'
  ).length

  return (
    <div className="flex items-center gap-2">
      <div className="relative inline-flex items-center">
        <div className="absolute inset-0 rounded-full bg-green-500 opacity-75 animate-pulse"></div>
        <div className="relative inline-flex items-center justify-center w-3 h-3 bg-green-500 rounded-full"></div>
      </div>
      <span className="text-sm text-gray-600">{onlineCount} online</span>
    </div>
  )
}
