'use client'

import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useWebSocketStore } from '@/lib/stores/websocket-store'
import { useAuth } from '@/hooks/useAuth'

export function SocketInitializer() {
  const { connect, disconnect } = useWebSocketStore()
  const { user, session } = useAuth()

  useEffect(() => {
    // Initialize socket if not already done
    if (typeof window !== 'undefined' && !(window as any).socket) {
      const socketUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      
      // Create socket instance
      const socket = io(socketUrl, {
        autoConnect: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        path: '/socket.io', // Default path
        transports: ['websocket', 'polling'],
      });

      (window as any).socket = socket;
    }

    // Connect if user is authenticated
    if (user && session?.access_token) {
      connect(session.access_token)
    } else {
      disconnect()
    }

    // Cleanup on unmount is tricky because this is likely in the root layout
    // We generally want the socket to persist across navigation
  }, [user, session, connect, disconnect])

  return null
}
