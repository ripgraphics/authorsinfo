'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Check, X, UserPlus, Loader2, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { getProfileUrlFromUser } from '@/lib/utils/profile-url-client'

interface PendingRequest {
  id: string
  user_id: string
  friend_id: string
  requested_by: string
  status: string
  requested_at: string
  responded_at?: string
  user: {
    id: string
    name: string
    email: string
  }
}

export function PendingFriendRequests() {
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  
  const { toast } = useToast()

  useEffect(() => {
    fetchPendingRequests()
  }, [])

  const fetchPendingRequests = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/friends/pending')
      
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      } else {
        console.error('Failed to fetch pending requests')
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

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

      const data = await response.json()

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
          description: data.error || `Failed to ${action} friend request`,
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
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading friend requests...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No pending friend requests</h3>
            <p className="text-muted-foreground">
              When someone sends you a friend request, it will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Friend Requests</h2>
        <Badge variant="secondary">{requests.length} pending</Badge>
      </div>
      
      <div className="space-y-3">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(request.user.name)}`} />
                    <AvatarFallback>
                      {request.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <Link 
                      href={getProfileUrlFromUser(request.user)}
                      className="font-semibold hover:underline"
                    >
                      {request.user.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Sent {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRequestAction(request.id, 'reject')}
                    disabled={processingRequest === request.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {processingRequest === request.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => handleRequestAction(request.id, 'accept')}
                    disabled={processingRequest === request.id}
                  >
                    {processingRequest === request.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Accept
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 