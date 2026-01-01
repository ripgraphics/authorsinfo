'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { UserListLayout } from '@/components/ui/user-list-layout'
import { UserActionButtons } from '@/components/user-action-buttons'
import { Loader2, ChevronLeft, ChevronRight, BookOpen, Users, UserPlus } from 'lucide-react'
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
  initialFriends?: any[]
  initialCount?: number
}

const PAGE_SIZE = 20

const normalizeFriendEntry = (entry: any): Friend | null => {
  if (!entry) return null

  const baseFriend = entry.friend || entry.user || entry
  const friendId = baseFriend?.id || entry.friend_id || entry.user_id || entry.id

  if (!friendId) {
    return null
  }

  return {
    id: entry.id || friendId,
    friend: {
      id: friendId,
      name: baseFriend?.name || baseFriend?.email || entry.name || 'Unknown User',
      email: baseFriend?.email || entry.email || '',
      permalink: baseFriend?.permalink || entry.permalink,
      avatar_url: baseFriend?.avatar_url ?? entry.avatar_url ?? null,
    },
    friendshipDate:
      entry.friendshipDate || entry.responded_at || entry.created_at || new Date().toISOString(),
    mutualFriendsCount: entry.mutualFriendsCount ?? entry.mutual_friends ?? 0,
    followersCount: entry.followersCount ?? entry.followers_count ?? 0,
    friendsCount: entry.friendsCount ?? entry.friends_count ?? 0,
    booksReadCount: entry.booksReadCount ?? entry.books_read_count ?? 0,
  }
}

export function FriendList({
  userId,
  className = '',
  profileOwnerId,
  profileOwnerName,
  profileOwnerPermalink,
  initialFriends = [],
  initialCount = 0,
}: FriendListProps) {
  const { user, loading: authLoading } = useAuth()
  const normalizedInitialFriends = useMemo(
    () => (initialFriends || []).map(normalizeFriendEntry).filter(Boolean) as Friend[],
    [initialFriends]
  )
  const [friends, setFriends] = useState<Friend[]>(normalizedInitialFriends)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(
    Math.max(1, Math.ceil((initialCount || normalizedInitialFriends.length || 0) / PAGE_SIZE))
  )
  const retryCount = useRef(0)
  const hasFetched = useRef(false)

  const { toast } = useToast()

  // Single fetch function that takes targetId as required parameter
  const fetchFriends = async (targetId: string, page: number = 1, replace: boolean = true) => {
    try {
      setIsLoading(true)
      console.log('[FriendList] Fetching friends for:', targetId, 'page:', page)
      const response = await fetch(`/api/friends/list?userId=${targetId}&page=${page}`)

      if (response.ok) {
        const data = await response.json()
        console.log('[FriendList] Response:', data)
        const normalized = (data.friends || [])
          .map(normalizeFriendEntry)
          .filter(Boolean) as Friend[]

        setFriends((prev) => {
          if (replace || page === 1) {
            return normalized
          }
          const merged = new Map(prev.map((friend) => [friend.id, friend]))
          normalized.forEach((friend) => {
            if (friend?.id) {
              merged.set(friend.id, friend)
            }
          })
          return Array.from(merged.values())
        })

        if (data.pagination?.totalPages) {
          setTotalPages(Math.max(1, data.pagination.totalPages))
        } else if (data.pagination?.total) {
          setTotalPages(Math.max(1, Math.ceil(data.pagination.total / PAGE_SIZE)))
        }
      } else {
        console.error('[FriendList] Failed to fetch friends:', response.status)
      }
    } catch (error) {
      console.error('[FriendList] Error fetching friends:', error)
      if (retryCount.current < 3) {
        retryCount.current++
        setTimeout(() => fetchFriends(targetId, page, replace), 1000 * retryCount.current)
        return // Don't set loading to false, we're retrying
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

  // Main effect: fetch friends when we have a target user ID
  useEffect(() => {
    // Skip if auth is still loading
    if (authLoading) {
      console.log('[FriendList] Auth still loading, waiting...')
      return
    }

    // Determine the target user ID
    const targetId = userId && userId !== 'undefined' ? userId : user?.id
    console.log('[FriendList] Auth loaded. targetId:', targetId, 'userId prop:', userId, 'user?.id:', user?.id)

    if (!targetId) {
      console.log('[FriendList] No target ID, stopping loading')
      setIsLoading(false)
      return
    }

    // If we have initial friends data, use that and don't fetch
    if (normalizedInitialFriends.length > 0 && !hasFetched.current) {
      console.log('[FriendList] Using initial friends data:', normalizedInitialFriends.length)
      setFriends(normalizedInitialFriends)
      setIsLoading(false)
      return
    }

    // Fetch friends
    if (!hasFetched.current) {
      hasFetched.current = true
      fetchFriends(targetId, 1, true)
    }
  }, [authLoading, userId, user?.id, normalizedInitialFriends])

  // Page change effect
  useEffect(() => {
    if (currentPage === 1) return // First page is handled by main effect
    
    const targetId = userId && userId !== 'undefined' ? userId : user?.id
    if (targetId) {
      fetchFriends(targetId, currentPage, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

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
        title={`Friends · ${initialCount || friends.length}`}
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
                <Avatar
                  src={
                    friend.friend.avatar_url ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(friend.friend.name)}`
                  }
                  alt={friend.friend.name}
                  name={friend.friend.name}
                  size="lg"
                  className="h-14 w-14"
                />
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{friend.friend.name}</h3>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <BookOpen className="h-3 w-3 mr-1" />
                  <span>
                    {friend.booksReadCount || 0}{' '}
                    {friend.booksReadCount === 1 ? 'book read' : 'books read'}
                  </span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Users className="h-3 w-3 mr-1" />
                  <span>
                    {friend.friendsCount || 0} {friend.friendsCount === 1 ? 'friend' : 'friends'}
                  </span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <UserPlus className="h-3 w-3 mr-1" />
                  <span>
                    {friend.followersCount || 0}{' '}
                    {friend.followersCount === 1 ? 'follower' : 'followers'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Friends since{' '}
                  {formatDistanceToNow(new Date(friend.friendshipDate), { addSuffix: true })}
                </p>
                {friend.mutualFriendsCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {friend.mutualFriendsCount} mutual friend
                    {friend.mutualFriendsCount !== 1 ? 's' : ''}
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
                onFriendChange={() => {
                  const targetId = userId && userId !== 'undefined' ? userId : user?.id
                  if (targetId) {
                    hasFetched.current = false
                    setCurrentPage(1)
                    fetchFriends(targetId, 1, true)
                  }
                }}
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
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
