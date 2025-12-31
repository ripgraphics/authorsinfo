'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth' // Import the useAuth hook
import { usePathname } from 'next/navigation'

interface Notification {
  id: string
  type: 'friend_request' | 'friend_accepted' | 'friend_rejected'
  title: string
  message: string
  timestamp: string
  read: boolean
}

export function RealTimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { toast } = useToast()
  const { user, loading } = useAuth() // Get user and loading state from useAuth
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return // Don't do anything while auth state is loading

    if (!user) {
      // Clear notifications and stop polling if user logs out
      setNotifications([])
      return
    }

    // Temporarily disable friend request notifications to prevent toast loop
    // TODO: Re-enable once the toast loop issue is resolved
    return

    // Don't show friend request toasts when user is on friend-requests page
    if (pathname === '/friend-requests') {
      setNotifications([]) // Clear any existing notifications
      return
    }

    const interval = setInterval(checkForNewNotifications, 10000)
    checkForNewNotifications() // Initial check

    return () => clearInterval(interval)
  }, [user, loading, pathname]) // Re-run effect when user, loading state, or pathname changes

  const checkForNewNotifications = async () => {
    if (!user) return // Only fetch if user is logged in

    try {
      const response = await fetch('/api/friends/pending')

      if (response.ok) {
        const data = await response.json()
        const newRequests = data.requests || []

        // Get current request IDs to prevent showing existing requests as new
        const currentRequestIds = newRequests.map((r: any) => r.id)

        // Only show toasts for truly new requests (not already in notifications)
        newRequests.forEach((request: any) => {
          const isNew = !notifications.some(
            (n) => n.type === 'friend_request' && n.id === request.id
          )

          if (isNew) {
            toast({
              title: 'New Friend Request',
              description: `${request.user.name} sent you a friend request`,
              action: (
                <button onClick={() => (window.location.href = '/friend-requests')}>View</button>
              ),
            })

            // Add to notifications list
            setNotifications((prev) => [
              ...prev,
              {
                id: request.id,
                type: 'friend_request',
                title: 'New Friend Request',
                message: `${request.user.name} sent you a friend request`,
                timestamp: request.requested_at,
                read: false,
              },
            ])
          }
        })

        // Update notifications list to include all current requests
        // This prevents showing the same requests as "new" in future polls
        setNotifications((prev) => {
          const existingNotifications = prev.filter((n) => n.type !== 'friend_request')
          const currentNotifications = currentRequestIds.map((id: string) => {
            const request = newRequests.find((r: any) => r.id === id)
            return {
              id: id,
              type: 'friend_request' as const,
              title: 'New Friend Request',
              message: `${request?.user?.name || 'Unknown User'} sent you a friend request`,
              timestamp: request?.requested_at || new Date().toISOString(),
              read: false,
            }
          })
          return [...existingNotifications, ...currentNotifications]
        })
      }
    } catch (error) {
      console.error('Error checking notifications:', error)
    }
  }

  // Listen for friend request actions
  useEffect(() => {
    const handleFriendAction = (event: CustomEvent) => {
      const { action, friendName } = event.detail

      toast({
        title: `Friend Request ${action === 'accept' ? 'Accepted' : 'Rejected'}`,
        description:
          action === 'accept'
            ? `You are now friends with ${friendName}!`
            : `Friend request from ${friendName} rejected`,
      })
    }

    window.addEventListener('friend-request-action', handleFriendAction as EventListener)

    return () => {
      window.removeEventListener('friend-request-action', handleFriendAction as EventListener)
    }
  }, [toast])

  return null // This component doesn't render anything visible
}
