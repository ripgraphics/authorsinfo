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
import { useUser } from '@/contexts/UserContext'

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
  const { user } = useUser()
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { toast } = useToast()

  useEffect(() => {
    // Only fetch if user is authenticated
    if (user) {
      fetchPendingRequests()
      
      // Poll for new requests every 30 seconds
      const interval = setInterval(fetchPendingRequests, 30000)
      return () => clearInterval(interval)
    } else {
      setIsLoading(false)
    }
  }, [user])

  const fetchPendingRequests = async () => {
    // Don't fetch if user is not authenticated
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      console.log('🔍 Fetching pending friend requests for user:', user.id)
      console.log('🔍 API endpoint: /api/friends/pending')
      
      // Test the API endpoint first
      try {
        const testResponse = await fetch('/api/test-friends', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout for test
        })
        
        if (testResponse.ok) {
          const testData = await testResponse.json()
          console.log('✅ Test endpoint response:', testData)
        } else {
          console.warn('⚠️ Test endpoint failed:', testResponse.status, testResponse.statusText)
        }
      } catch (testError) {
        console.warn('⚠️ Test endpoint error:', testError)
      }
      
      const response = await fetch('/api/friends/pending', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      console.log('📡 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ FriendRequestNotification - Received data:', data)
        setRequests(data.requests || [])
      } else {
        console.error('❌ Failed to fetch pending requests')
        console.error('Response status:', response.status)
        console.error('Response status text:', response.statusText)
        
        // Try to get error details from response
        try {
          const errorData = await response.json()
          console.error('Error response data:', errorData)
        } catch (parseError) {
          console.error('Could not parse error response:', parseError)
        }
        
        if (response.status === 401) {
          setError('Authentication required')
        } else if (response.status === 403) {
          setError('Access denied')
        } else if (response.status >= 500) {
          setError('Server error')
        } else {
          setError(`Request failed (${response.status})`)
        }
      }
    } catch (error) {
      console.error('❌ Error fetching pending requests:', error)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setError('Request timed out')
        } else if (error.message.includes('Failed to fetch')) {
          console.error('🔍 Network error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
          })
          setError('Network error - please check your connection')
        } else {
          setError('An unexpected error occurred')
        }
      } else {
        setError('An unknown error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestAction = async (requestId: string, action: 'accept' | 'reject') => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please log in to perform this action",
        variant: 'destructive',
      })
      return
    }

    try {
      setProcessingRequest(requestId)
      console.log('Sending request to update friend request:', { requestId, action })
      
      const response = await fetch('/api/friends', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, action }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
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
      
      if (error instanceof Error && error.name === 'AbortError') {
        toast({
          title: "Request Timeout",
          description: "The request took too long. Please try again.",
          variant: 'destructive',
        })
      } else {
        toast({
          title: "Error",
          description: `Failed to ${action} friend request`,
          variant: 'destructive',
        })
      }
    } finally {
      setProcessingRequest(null)
    }
  }

  const pendingCount = requests.length

  // Don't render if user is not authenticated
  if (!user) {
    return null
  }

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
              {pendingCount}
            </Badge>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Loading...</span>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchPendingRequests}
              className="w-full"
            >
              Retry
            </Button>
          </div>
        ) : pendingCount === 0 ? (
          <div className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No pending friend requests</p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {requests.map((request) => (
              <div key={request.id} className="p-3 border-b last:border-b-0">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`/api/users/${request.user.id}/avatar`} />
                    <AvatarFallback>
                      {request.user.name?.charAt(0) || request.user.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={getProfileUrlFromUser(request.user)}
                      className="font-medium text-sm hover:underline truncate block"
                      onClick={() => setIsOpen(false)}
                    >
                      {request.user.name || request.user.email}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleRequestAction(request.id, 'accept')}
                    disabled={processingRequest === request.id}
                  >
                    {processingRequest === request.id ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Check className="h-3 w-3 mr-1" />
                    )}
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleRequestAction(request.id, 'reject')}
                    disabled={processingRequest === request.id}
                  >
                    {processingRequest === request.id ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <X className="h-3 w-3 mr-1" />
                    )}
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 