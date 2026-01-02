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
  const { user } = useAuth()
  // Stabilize the initialFriends reference to prevent infinite loops
  const initialFriendsRef = useRef(initialFriends)
  const initialCountRef = useRef(initialCount)
  
  // Only update refs if the actual data changed (not just reference)
  if (JSON.stringify(initialFriends) !== JSON.stringify(initialFriendsRef.current)) {
    initialFriendsRef.current = initialFriends
  }
  if (initialCount !== initialCountRef.current) {
    initialCountRef.current = initialCount
  }
  
  const normalizedInitialFriends = useMemo(
    () => (initialFriendsRef.current || []).map(normalizeFriendEntry).filter(Boolean) as Friend[],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(initialFriendsRef.current)]
  )
  const [friends, setFriends] = useState<Friend[]>(() => normalizedInitialFriends)
  const [isLoading, setIsLoading] = useState(() => normalizedInitialFriends.length === 0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(() =>
    Math.max(1, Math.ceil((initialCountRef.current || normalizedInitialFriends.length || 0) / PAGE_SIZE))
  )
  const retryCount = useRef(0)
  const hasInitialServerData = useRef(normalizedInitialFriends.length > 0)
  const hasInitialized = useRef(false)

  const { toast } = useToast()

  // Only run this effect once on mount or when initialFriends actually changes with new data
  useEffect(() => {
    // Skip if already initialized and no new data
    if (hasInitialized.current && normalizedInitialFriends.length === 0) {
      return
    }
    hasInitialized.current = true
    
    if (normalizedInitialFriends.length > 0) {
      setFriends(normalizedInitialFriends)
      setTotalPages(
        Math.max(1, Math.ceil((initialCountRef.current || normalizedInitialFriends.length || 0) / PAGE_SIZE))
      )
      setIsLoading(false)
      hasInitialServerData.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedInitialFriends.length])

  useEffect(() => {
    const shouldSkipFetch = hasInitialServerData.current && currentPage === 1
    if (shouldSkipFetch) {
      hasInitialServerData.current = false
      return
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchFriends(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  // Track whether we've already fetched to avoid duplicate fetches
  const hasFetchedRef = useRef(false)
  const lastFetchedUserIdRef = useRef<string | null>(null)

  // Fetch friends when user data becomes available
  useEffect(() => {
    const targetId = userId && userId !== 'undefined' ? userId : user?.id
    // Skip if no target ID, or if we already have initial data, or if we already fetched for this user
    if (!targetId || normalizedInitialFriends.length > 0) {
      return
    }
    // Skip if we already fetched for this user
    if (hasFetchedRef.current && lastFetchedUserIdRef.current === targetId) {
      return
    }
    hasFetchedRef.current = true
    lastFetchedUserIdRef.current = targetId
    fetchFriends(1, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, userId])

  const fetchFriends = async (page = currentPage, options: { replace?: boolean } = {}) => {
    try {
      setIsLoading(true)
      const targetId = userId && userId !== 'undefined' ? userId : user?.id
      if (!targetId) {
        setIsLoading(false)
        return
      }
      const response = await fetch(`/api/friends/list?userId=${targetId}&page=${page}`)

      if (response.ok) {
        const data = await response.json()
        const normalized = (data.friends || [])
          .map(normalizeFriendEntry)
          .filter(Boolean) as Friend[]

        setFriends((prev) => {
          if (options.replace || page === 1) {
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
        } else if (data.pagination?.limit && data.pagination?.total && data.pagination?.limit > 0) {
          setTotalPages(Math.max(1, Math.ceil(data.pagination.total / data.pagination.limit)))
        }
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
                  fetchFriends(1, { replace: true })
                  hasInitialServerData.current = true
                  setCurrentPage(1)
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
