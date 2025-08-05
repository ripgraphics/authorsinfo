'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Bell, 
  UserPlus, 
  Check, 
  X, 
  Loader2,
  Users
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { getProfileUrlFromUser } from '@/lib/utils/profile-url-client'

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

export function FriendRequestNotification() {
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    fetchPendingRequests()
    
    // Poll for new requests every 30 seconds
    const interval = setInterval(fetchPendingRequests, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch('/api/friends/pending')
      
      if (response.ok) {
        const data = await response.json()
        console.log('FriendRequestNotification - Received data:', data)
        setRequests(data.requests || [])
      } else {
        console.error('Failed to fetch pending requests')
        console.error('Response status:', response.status)
        console.error('Response status text:', response.statusText)
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
      console.log('Sending request to update friend request:', { requestId, action })
      
      const response = await fetch('/api/friends', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, action }),
      })

      console.log('Response status:', response.status)
      const responseData = await response.json()
      console.log('Response data:', responseData)

      if (response.ok) {
        // Remove the request from the list
        setRequests(prev => prev.filter(req => req.id !== requestId))
        
        // Refresh the pending requests to ensure we have the latest data
        await fetchPendingRequests()
        
        toast({
          title: `Friend request ${action}ed!`,
          description: action === 'accept' 
            ? 'You are now friends!' 
            : 'Friend request rejected',
        })
      } else {
        console.error('Failed to update friend request:', responseData)
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

  const pendingCount = requests.length

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {pendingCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {pendingCount > 9 ? '9+' : pendingCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Friend Requests</span>
          {pendingCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {pendingCount} new
            </Badge>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-4 text-center">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No pending friend requests</p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {requests.map((request) => (
              <div key={request.id} className="p-3 border-b last:border-b-0">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(request.user.name)}`} />
                    <AvatarFallback>
                      {request.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    {request.user.name === 'Unknown User' ? (
                      <span className="font-medium text-sm truncate block">
                        {request.user.name}
                      </span>
                    ) : (
                      <Link 
                        href={getProfileUrlFromUser(request.user)}
                        className="font-medium text-sm hover:underline truncate block"
                        onClick={() => setIsOpen(false)}
                      >
                        {request.user.name}
                      </Link>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Sent {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
                    </p>
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
              </div>
            ))}
          </div>
        )}
        
        {requests.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/friend-requests" onClick={() => setIsOpen(false)}>
                <UserPlus className="h-4 w-4 mr-2" />
                View All Requests
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 