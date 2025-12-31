'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function FriendRequestsNavButton() {
  const [pendingCount, setPendingCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    fetchPendingCount()

    // Refresh count every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchPendingCount = async () => {
    try {
      const response = await fetch('/api/friends/pending')
      if (response.ok) {
        const data = await response.json()
        setPendingCount(data.requests?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching pending count:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={pathname.startsWith('/friend-requests') ? 'default' : 'ghost'}
      asChild
      className="nav-friend-requests-button relative"
    >
      <Link href="/friend-requests">
        <Users className="h-4 w-4 mr-2" />
        Friend Requests
        {!isLoading && pendingCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {pendingCount}
          </Badge>
        )}
      </Link>
    </Button>
  )
}
