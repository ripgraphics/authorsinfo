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
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
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
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Friend Requests</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {requests.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {requests.map((request) => (
          <div key={request.id} className="flex items-center justify-between p-2 rounded-lg border">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(request.user.name)}`} />
                <AvatarFallback>
                  {request.user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <Link 
                  href={getProfileUrlFromUser(request.user)}
                  className="font-medium text-sm hover:underline truncate block"
                >
                  {request.user.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRequestAction(request.id, 'reject')}
                disabled={processingRequest === request.id}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {processingRequest === request.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRequestAction(request.id, 'accept')}
                disabled={processingRequest === request.id}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                {processingRequest === request.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        ))}
        
        {requests.length > 0 && (
          <div className="pt-2 border-t">
            <Button variant="outline" size="sm" className="w-full" asChild>
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