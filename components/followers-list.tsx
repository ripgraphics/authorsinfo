"use client"

import { Users } from "lucide-react"
import Link from "next/link"

interface Follower {
  id: string
  name: string
  avatar_url?: string | null
  username?: string
}

interface FollowersListProps {
  followers: Follower[]
  followersCount: number
  entityId: string
  entityType: string
}

export function FollowersList({ 
  followers, 
  followersCount, 
  entityId, 
  entityType
}: FollowersListProps) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="space-y-1.5 p-6 flex flex-row items-center justify-between">
        <div className="text-2xl font-semibold leading-none tracking-tight">Followers</div>
        <Link 
          href={`/${entityType}s/${entityId}/followers`}
          className="followers-list__see-all-button inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md px-3 text-sm text-primary hover:bg-primary/10 hover:text-primary"
        >
          See All
        </Link>
      </div>
      <div className="p-6 pt-0">
        <div className="followers-list__header flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="followers-list__title-wrapper space-y-1">
            <div className="tracking-tight followers-list__title text-sm font-medium">
              <div className="followers-list__title-content flex items-center gap-2">
                <Users className="followers-list__icon h-4 w-4" />
                <span className="followers-list__count text-sm text-muted-foreground">{followersCount}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="followers-list__content space-y-4">
          <div className="followers-list__grid grid grid-cols-3 gap-2">
            {followers.slice(-9).map((follower) => (
              <Link
                key={follower.id}
                href={`/profile/${follower.id}`}
                className="followers-list__item flex flex-col items-center text-center p-2 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <span className="followers-list__avatar-wrapper relative flex shrink-0 overflow-hidden rounded-full h-16 w-16 mb-1">
                  <div className="avatar-container relative w-24 h-24 overflow-hidden rounded-full border-2 border-white shadow-md followers-list__avatar">
                    <img
                      alt={follower.name}
                      loading="lazy"
                      width={96}
                      height={96}
                      decoding="async"
                      data-nimg="1"
                      className="object-cover rounded-full"
                      src={follower.avatar_url || "/placeholder.svg?height=100&width=100"}
                      style={{ color: "transparent", aspectRatio: "1 / 1" }}
                    />
                  </div>
                </span>
                <span className="followers-list__item-name text-xs line-clamp-1">{follower.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 