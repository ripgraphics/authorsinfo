'use client'

import { useMemo } from 'react'
import { UserListLayout } from '@/components/ui/user-list-layout'
import { UserActionButtons } from '@/components/user-action-buttons'
import { UserPlus, Users, BookOpen } from 'lucide-react'
import Link from 'next/link'

interface FollowersListTabProps {
  followers: any[]
  followersCount: number
  entityId: string
  entityType: string
  profileOwnerId?: string
  profileOwnerName?: string
  profileOwnerPermalink?: string
}

export function FollowersListTab({
  followers,
  followersCount,
  entityId,
  entityType,
  profileOwnerId,
  profileOwnerName,
  profileOwnerPermalink,
}: FollowersListTabProps) {
  const sortOptions = [
    { value: 'recent', label: 'Recently Followed' },
    { value: 'oldest', label: 'Oldest Followers' },
    { value: 'most_followers', label: 'Most Followers' },
    { value: 'least_followers', label: 'Least Followers' },
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
  ]

  return (
    <UserListLayout
      title={`Followers · ${followersCount}`}
      items={followers}
      searchPlaceholder="Search followers..."
      sortOptions={sortOptions}
      defaultSort="recent"
      emptyMessage="No followers yet"
      emptySearchMessage="No followers found matching your search"
      renderItem={(follower, compact) => (
        <div className="flex flex-col border rounded-lg hover:bg-accent transition-colors overflow-hidden">
          <Link
            href={follower.permalink ? `/profile/${follower.permalink}` : `/profile/${follower.id}`}
            className="flex items-center gap-3 p-3 flex-1 min-w-0"
          >
            <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14 bg-muted">
              <img
                src={
                  follower.avatar_url ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(follower.name || 'User')}`
                }
                alt={follower.name || 'User'}
                className="aspect-square h-full w-full object-cover rounded-full"
              />
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{follower.name || 'Unknown User'}</h3>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <BookOpen className="h-3 w-3 mr-1" />
                <span>
                  {follower.books_read_count || 0}{' '}
                  {follower.books_read_count === 1 ? 'book read' : 'books read'}
                </span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Users className="h-3 w-3 mr-1" />
                <span>
                  {follower.friends_count || 0}{' '}
                  {follower.friends_count === 1 ? 'friend' : 'friends'}
                </span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <UserPlus className="h-3 w-3 mr-1" />
                <span>
                  {follower.followers_count || 0}{' '}
                  {follower.followers_count === 1 ? 'follower' : 'followers'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Following since{' '}
                {follower.followSince
                  ? new Date(follower.followSince).toLocaleDateString()
                  : 'unknown date'}
              </p>
            </div>
          </Link>
          <div className="px-3 pb-3 pt-3 border-t" data-button-container>
            <UserActionButtons
              userId={follower.id}
              userName={follower.name}
              userPermalink={follower.permalink}
              orientation="horizontal"
              size="sm"
              variant="outline"
              showFollow={false}
              className="justify-center"
              compact={compact}
              removeSelfEntity={{ entityId, entityType }}
            />
          </div>
        </div>
      )}
    />
  )
}
