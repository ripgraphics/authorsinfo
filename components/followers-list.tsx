'use client'

import { Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getProfileUrlFromUser } from '@/lib/utils/profile-url-client'
import { ContentSection } from '@/components/ui/content-section'

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
  onViewMore?: () => void
  className?: string
}

export function FollowersList({
  followers,
  followersCount,
  entityId,
  entityType,
  onViewMore,
  className,
}: FollowersListProps) {
  const router = useRouter()

  const handleViewMore = () => {
    if (onViewMore) {
      onViewMore()
    } else {
      // Default: navigate to followers tab
      const baseUrl = `/${entityType}s/${entityId}`
      router.push(`${baseUrl}?tab=followers`)
    }
  }

  const followersGrid = (
    <div className="followers-list__content space-y-4">
      <div className="followers-list__header flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="followers-list__title-wrapper space-y-1">
          <div className="tracking-tight followers-list__title text-sm font-medium">
            <div className="followers-list__title-content flex items-center gap-2">
              <Users className="followers-list__icon h-4 w-4" />
              <span className="followers-list__count text-sm text-muted-foreground">
                {followersCount}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="followers-list__grid grid grid-cols-3 gap-2">
        {followers.slice(-9).map((follower) => (
          <Link
            key={follower.id}
            href={getProfileUrlFromUser(follower)}
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
                  src={
                    follower.avatar_url ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(follower.name || 'User')}`
                  }
                  style={{ color: 'transparent', aspectRatio: '1 / 1' }}
                />
              </div>
            </span>
            <span className="followers-list__item-name text-xs line-clamp-1">{follower.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )

  return (
    <ContentSection
      title="Followers"
      onViewMore={handleViewMore}
      viewMoreText="See All"
      className={className}
    >
      {followersGrid}
    </ContentSection>
  )
}
