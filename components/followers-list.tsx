'use client'

import { Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getProfileUrlFromUser } from '@/lib/utils/profile-url-client'
import { ContentSection } from '@/components/ui/content-section'
import { Card, CardContent } from '@/components/ui/card'

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
          <Link key={follower.id} href={getProfileUrlFromUser(follower)} className="block">
            <Card className="overflow-hidden h-full transition-transform hover:scale-105">
              <div className="relative w-full" style={{ aspectRatio: '1/1' }}>
                <img
                  alt={follower.name}
                  loading="lazy"
                  width={256}
                  height={256}
                  decoding="async"
                  className="h-full w-full object-cover"
                  src={
                    follower.avatar_url ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(follower.name || 'User')}`
                  }
                  style={{ color: 'transparent' }}
                />
              </div>
              <CardContent className="p-3 text-center">
                <span className="text-xs line-clamp-1">{follower.name}</span>
              </CardContent>
            </Card>
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
