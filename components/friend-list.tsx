'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { UserListLayout } from '@/components/ui/user-list-layout'
import { UserActionButtons } from '@/components/user-action-buttons'
import { 
  Loader2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Users,
  UserPlus
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
    avatar_url?: string | null
  }
  friendshipDate: string
  mutualFriendsCount: number
  followersCount?: number
  friendsCount?: number
  booksReadCount?: number
}

interface FriendListProps {
  userId?: string
  className?: string
  profileOwnerId?: string
  profileOwnerName?: string
  profileOwnerPermalink?: string
}

export function FriendList({ userId, className = '', profileOwnerId, profileOwnerName, profileOwnerPermalink }: FriendListProps) {
  const { user } = useAuth()
  const [friends, setFriends] = useState<Friend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
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



  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading friends...</span>
        </div>
      </div>
    )
  }

  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
    { value: 'mutual', label: 'Mutual Friends' },
  ]

  return (
    <div className={className}>
      <UserListLayout
        title={`Friends · ${friends.length}`}
        items={friends}
        searchPlaceholder="Search friends..."
        sortOptions={sortOptions}
        defaultSort="recent"
        emptyMessage="No friends yet"
        emptySearchMessage="No friends found matching your search"
        renderItem={(friend) => (
          <div className="flex flex-col border rounded-lg hover:bg-accent transition-colors overflow-hidden">
            <Link
              href={getProfileUrlFromUser(friend.friend)}
              className="flex items-center gap-3 p-3 flex-1 min-w-0"
            >
              <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14 bg-muted">
                <Avatar className="h-14 w-14">
                  <AvatarImage 
                    src={friend.friend.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(friend.friend.name)}`} 
                    alt={friend.friend.name}
                  />
                  <AvatarFallback>
                    {friend.friend.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{friend.friend.name}</h3>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <BookOpen className="h-3 w-3 mr-1" />
                  <span>{friend.booksReadCount || 0} {friend.booksReadCount === 1 ? 'book read' : 'books read'}</span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Users className="h-3 w-3 mr-1" />
                  <span>{friend.friendsCount || 0} {friend.friendsCount === 1 ? 'friend' : 'friends'}</span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <UserPlus className="h-3 w-3 mr-1" />
                  <span>{friend.followersCount || 0} {friend.followersCount === 1 ? 'follower' : 'followers'}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Friends since {formatDistanceToNow(new Date(friend.friendshipDate), { addSuffix: true })}
                </p>
                {friend.mutualFriendsCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {friend.mutualFriendsCount} mutual friend{friend.mutualFriendsCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </Link>
            <div className="px-3 pb-3 pt-0 border-t">
              <UserActionButtons
                userId={friend.friend.id}
                userName={friend.friend.name}
                userPermalink={friend.friend.permalink}
                orientation="horizontal"
                size="sm"
                variant="outline"
                showFollow={false}
                onFriendChange={fetchFriends}
                className="justify-center"
              />
            </div>
          </div>
        )}
      />
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-4">
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