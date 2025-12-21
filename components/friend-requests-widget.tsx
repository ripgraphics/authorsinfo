'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  UserPlus, 
  Check, 
  X, 
  Loader2,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { getProfileUrlFromUser } from '@/lib/utils/profile-url-client'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface FriendRequest {
  id: string
  user_id: string
  friend_id: string
  requested_at: string
  user: {
    id: string
    name: string
    email: string
    permalink?: string
  }
}

interface FriendRequestsWidgetProps {
  maxRequests?: number
  className?: string
}

export function FriendRequestsWidget({ maxRequests = 3, className = '' }: FriendRequestsWidgetProps) {
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  const fetchPendingRequests = useCallback(async () => {
    // Don't fetch if user is not authenticated
    if (!user) {
      setIsLoading(false)
      setRequests([])
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/friends/pending')
      
      if (response.ok) {
        const data = await response.json()
        setRequests((data.requests || []).slice(0, maxRequests))
      } else if (response.status === 401) {
        // 401 is expected when user is not logged in - silently handle
        setRequests([])
      } else {
        // Only log non-401 errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch pending requests:', response.status, response.statusText)
        }
      }
    } catch (error) {
      // Only log errors in development, and skip network errors for 401s
      if (process.env.NODE_ENV === 'development' && error instanceof Error && !error.message.includes('401')) {
        console.error('Error fetching pending requests:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [user, maxRequests])

  useEffect(() => {
    fetchPendingRequests()
  }, [fetchPendingRequests])

  const handleRequestAction = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      setProcessingRequest(requestId)
      const response = await fetch('/api/friends', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, action }),
      })

      if (response.ok) {
        // Remove the request from the list
        setRequests(prev => prev.filter(req => req.id !== requestId))
        
        toast({
          title: `Friend request ${action}ed!`,
          description: action === 'accept' 
            ? 'You are now friends!' 
            : 'Friend request rejected',
        })
      } else {
        toast({
          title: "Error",
          description: `Failed to ${action} friend request`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error(`Error ${action}ing friend request:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action} friend request`,
        variant: 'destructive',
      })
    } finally {
      setProcessingRequest(null)
    }
  }

  if (isLoading) {
    return (
      <Card className={cn("friend-requests-widget", className)}>
        <CardContent className={cn("friend-requests-widget__loading-content", "p-4")}>
          <div className={cn("friend-requests-widget__loading-spinner", "flex items-center justify-center")}>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="ml-2 text-sm">Loading...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (requests.length === 0) {
    return null // Don't show widget if no requests
  }

  return (
    <Card className={cn("friend-requests-widget", "w-full", className)}>
      <CardHeader className={cn("friend-requests-widget__header", "pb-3 px-4 pt-4")}>
        <CardTitle className={cn("friend-requests-widget__title", "flex items-center justify-between text-sm gap-2")}>
          <div className={cn("friend-requests-widget__title-content", "flex items-center space-x-2 min-w-0")}>
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Friend Requests</span>
          </div>
          <Badge variant="secondary" className={cn("friend-requests-widget__badge", "text-xs flex-shrink-0")}>
            {requests.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className={cn("friend-requests-widget__content", "space-y-3 px-4 pb-4")}>
        {requests.map((request) => (
          <div key={request.id} className={cn("friend-requests-widget__request-item", "flex items-center gap-2 p-3 rounded-lg border")}>
            <Avatar className={cn("friend-requests-widget__request-avatar", "h-10 w-10 flex-shrink-0")}>
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(request.user.name)}`} />
              <AvatarFallback>
                {request.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className={cn("friend-requests-widget__request-details", "flex-1 min-w-0 overflow-hidden")}>
              <Link 
                href={getProfileUrlFromUser(request.user)}
                className={cn("friend-requests-widget__request-name", "font-medium text-sm hover:underline block truncate")}
              >
                {request.user.name}
              </Link>
              <p className={cn("friend-requests-widget__request-time", "text-xs text-muted-foreground truncate")}>
                {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
              </p>
            </div>
            
            <div className={cn("friend-requests-widget__request-actions", "flex items-center gap-1 flex-shrink-0")}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRequestAction(request.id, 'reject')}
                disabled={processingRequest === request.id}
                className={cn("friend-requests-widget__reject-button", "h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50")}
                aria-label="Reject friend request"
              >
                {processingRequest === request.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRequestAction(request.id, 'accept')}
                disabled={processingRequest === request.id}
                className={cn("friend-requests-widget__accept-button", "h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50")}
                aria-label="Accept friend request"
              >
                {processingRequest === request.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        ))}
        
        {requests.length > 0 && (
          <div className={cn("friend-requests-widget__footer", "pt-3 border-t")}>
            <Button variant="outline" size="sm" className={cn("friend-requests-widget__view-all-button", "w-full")} asChild>
              <Link href="/friend-requests">
                <UserPlus className="h-4 w-4 mr-2" />
                View All Requests
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 