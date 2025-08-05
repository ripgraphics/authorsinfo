'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Search, 
  Filter, 
  UserMinus, 
  MessageCircle, 
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { getProfileUrlFromUser } from '@/lib/utils/profile-url-client'

interface Friend {
  id: string
  friend: {
    id: string
    name: string
    email: string
    permalink?: string
  }
  friendshipDate: string
  mutualFriendsCount: number
}

interface FriendListProps {
  userId?: string
  className?: string
}

export function FriendList({ userId, className = '' }: FriendListProps) {
  const { user } = useAuth()
  const [friends, setFriends] = useState<Friend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [removingFriend, setRemovingFriend] = useState<string | null>(null)
  const retryCount = useRef(0)
  
  const { toast } = useToast()

  useEffect(() => {
    fetchFriends()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user?.id, currentPage])

  const fetchFriends = async () => {
    try {
      setIsLoading(true)
      const targetId = userId && userId !== 'undefined' ? userId : user?.id
      if (!targetId) {
        setIsLoading(false)
        return;
      }
      const response = await fetch(`/api/friends/list?userId=${targetId}&page=${currentPage}`)
      
      if (response.ok) {
        const data = await response.json()
        setFriends(data.friends || [])
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        console.error('Failed to fetch friends')
      }
          } catch (error) {
        console.error('Error fetching friends:', error)
        if (retryCount.current < 3) {
          retryCount.current++
          setTimeout(fetchFriends, 1000 * retryCount.current)
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load friends. Please try again later.',
            variant: 'destructive',
          })
        }
      } finally {
        setIsLoading(false)
      }
  }

  const handleRemoveFriend = async (friendId: string) => {
    try {
      setRemovingFriend(friendId)
      const response = await fetch(`/api/friends?friendId=${friendId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setFriends(prev => prev.filter(friend => friend.friend.id !== friendId))
        toast({
          title: "Friend removed",
          description: "Friend has been removed from your list",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to remove friend",
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error removing friend:', error)
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: 'destructive',
      })
    } finally {
      setRemovingFriend(null)
    }
  }

  const filteredAndSortedFriends = friends
    .filter(friend => 
      friend.friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      friend.friend.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.friend.name.localeCompare(b.friend.name)
        case 'recent':
          return new Date(b.friendshipDate).getTime() - new Date(a.friendshipDate).getTime()
        case 'mutual':
          return b.mutualFriendsCount - a.mutualFriendsCount
        default:
          return 0
      }
    })

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading friends...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Friends</h2>
          <p className="text-muted-foreground">
            {friends.length} friend{friends.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Badge variant="secondary">
          <Users className="h-4 w-4 mr-1" />
          {friends.length}
        </Badge>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search friends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="mutual">Mutual Friends</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Friends List */}
      <div className="space-y-3">
        {filteredAndSortedFriends.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? 'No friends found' : 'No friends yet'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Start connecting with other users to build your network'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedFriends.map((friend) => (
            <Card key={friend.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(friend.friend.name)}`} />
                      <AvatarFallback>
                        {friend.friend.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <Link 
                        href={getProfileUrlFromUser(friend.friend)}
                        className="font-semibold hover:underline"
                      >
                        {friend.friend.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        Friends since {formatDistanceToNow(new Date(friend.friendshipDate), { addSuffix: true })}
                      </p>
                      {friend.mutualFriendsCount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {friend.mutualFriendsCount} mutual friend{friend.mutualFriendsCount !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/messages/${friend.friend.id}`}>
                        <MessageCircle className="h-4 w-4" />
                      </Link>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFriend(friend.friend.id)}
                      disabled={removingFriend === friend.friend.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {removingFriend === friend.friend.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserMinus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
} 