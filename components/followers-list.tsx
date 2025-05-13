"use client"

import { useState } from "react"
import { Avatar } from "@/components/ui/avatar"
import { Users } from "lucide-react"
import Link from "next/link"

interface Follower {
  id: string
  name: string
  avatar_url?: string | null
  username?: string
}

type EntityType = 'book' | 'author' | 'publisher' | 'user' | 'event' | 'group'

interface FollowersListProps {
  followers: Follower[]
  followersCount: number
  entityId: string
  entityType: EntityType
  showCard?: boolean
}

export function FollowersList({ 
  followers, 
  followersCount, 
  entityId, 
  entityType,
  showCard = true 
}: FollowersListProps) {
  // Helper function to get the correct URL path for each entity type
  const getEntityPath = (type: EntityType, id: string) => {
    switch (type) {
      case 'user':
        return `/profile/${id}`
      case 'event':
        return `/events/${id}`
      case 'group':
        return `/groups/${id}`
      default:
        return `/${type}s/${id}`
    }
  }

  const content = (
    <>
      <div className="followers-list__header flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="followers-list__title-wrapper space-y-1">
          <div className="tracking-tight followers-list__title text-sm font-medium">
            <div className="followers-list__title-content flex items-center gap-2">
              <Users className="followers-list__icon h-4 w-4" />
              Followers
            </div>
          </div>
          <span className="followers-list__count text-sm text-muted-foreground">{followersCount}</span>
        </div>
        <Link 
          href={`${getEntityPath(entityType, entityId)}/followers`}
          className="followers-list__see-all-button inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md px-3 text-sm text-primary hover:bg-primary/10 hover:text-primary"
        >
          See All
        </Link>
      </div>
      <div className="followers-list__content space-y-4">
        <div className="followers-list__grid grid grid-cols-3 gap-2">
          {followers.length > 0 ? (
            followers.slice(0, 9).map((follower) => (
              <Link
                key={follower.id}
                href={`/profile/${follower.id}`}
                className="followers-list__item flex flex-col items-center text-center"
              >
                <span className="followers-list__avatar-wrapper relative flex shrink-0 overflow-hidden rounded-full h-16 w-16 mb-1">
                  <Avatar 
                    src={follower.avatar_url || "/placeholder.svg?height=100&width=100"} 
                    alt={follower.name || 'User'} 
                    name={follower.name} 
                    size="md" 
                    id={follower.id} 
                    className="followers-list__avatar" 
                  />
                </span>
                <span className="followers-list__item-name text-xs line-clamp-1">{follower.name || 'Unknown User'}</span>
              </Link>
            ))
          ) : (
            <div className="col-span-3 text-center p-6">
              <p className="text-muted-foreground">No followers yet</p>
            </div>
          )}
        </div>
      </div>
    </>
  )

  if (showCard) {
    return (
      <div className="rounded-lg bg-card text-card-foreground followers-list__card border shadow-sm hover:shadow-md transition-shadow">
        <div className="p-6">
          {content}
        </div>
      </div>
    )
  }

  return content
} 