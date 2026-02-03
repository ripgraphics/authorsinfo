import type React from 'react'
import { useState, useRef } from 'react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CloseButton } from '@/components/ui/close-button'
import {
  Users,
  MapPin,
  Globe,
  Calendar,
  BookOpen,
  MessageSquare,
  MoreHorizontal,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FollowButton } from '@/components/follow-button'
import { AddFriendButton } from '@/components/add-friend-button'
import { FollowersDisplay } from '@/components/followers-display'
import { MutualFriendsDisplay } from '@/components/mutual-friends-display'
import { useAuth } from '@/hooks/useAuth'
import { useUserStats } from '@/hooks/useUserStats'
import { useButtonOverflow } from '@/hooks/use-button-overflow'
import { ResponsiveActionButton } from '@/components/ui/responsive-action-button'

// Enterprise-grade type definitions
type EntityType = 'user' | 'author' | 'publisher' | 'group' | 'event' | 'book'

interface BaseEntity {
  id: string
  name: string
  created_at?: string
}

interface UserEntity extends BaseEntity {
  avatar_url?: string
  email?: string
  friend_count?: number
  followers_count?: number
  books_read_count?: number
  mutual_friends?: number
  permalink?: string
  location?: string
  website?: string
}

interface AuthorEntity extends BaseEntity {
  author_image?: {
    url: string
  }
  bookCount: number
  followersCount?: number
  mutualFriendsCount?: number
  bio?: string
}

interface PublisherEntity extends BaseEntity {
  publisher_image?: {
    url: string
  }
  logo_url?: string
  bookCount: number
  authorCount?: number
  followersCount?: number
  mutualFriendsCount?: number
  location?: string
}

interface GroupEntity extends BaseEntity {
  group_image?: {
    url: string
  }
  member_count?: number
  joined_at?: string
  description?: string
}

interface EventCreatorEntity extends BaseEntity {
  avatar_url?: string
  event_count?: number
  location?: string
}

interface BookEntity extends BaseEntity {
  cover_image?: {
    url: string
  }
  author_name?: string
  publisher_name?: string
  publication_year?: number
  genre?: string
}

type Entity =
  | UserEntity
  | AuthorEntity
  | PublisherEntity
  | GroupEntity
  | EventCreatorEntity
  | BookEntity

interface EntityHoverCardProps {
  type: EntityType
  entity: Entity
  children: React.ReactNode
  showActions?: boolean
  userStats?: {
    booksRead: number
    friendsCount: number
    followersCount: number
    mutualFriendsCount?: number
    location: string | null
    website: string | null
    joinedDate: string
  }
}

export function EntityHoverCard({
  type,
  entity,
  children,
  showActions = true,
  userStats,
}: EntityHoverCardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isHoverCardOpen, setIsHoverCardOpen] = useState(false)
  const actionsContainerRef = useRef<HTMLDivElement>(null)
  const isCompact = useButtonOverflow(actionsContainerRef, 350)
  const isOwnUser = type === 'user' && !!user && entity.id === user.id

  // Fetch user stats when not provided - ensures same data everywhere
  const needsFetch = type === 'user' && !userStats && !!entity.id
  const { userStats: fetchedUserStats } = useUserStats(needsFetch ? entity.id : undefined, {
    enabled: needsFetch && isHoverCardOpen,
    currentUserId: user?.id ?? null,
  })

  const handleClose = () => {}

  const handleClick = () => {
    const info = getEntityInfo()
    if (info.href) {
      router.push(info.href)
    }
  }

  const handleHoverCardOpenChange = (open: boolean) => {
    // Keep hover card open if dropdown is open
    if (isDropdownOpen && !open) {
      return
    }
    setIsHoverCardOpen(open)
  }

  // Single source of truth: passed userStats > fetched userStats > entity fallback
  const displayStats =
    type === 'user'
      ? userStats ||
        fetchedUserStats || {
          booksRead: (entity as UserEntity).books_read_count || 0,
          friendsCount: (entity as UserEntity).friend_count || 0,
          followersCount: (entity as UserEntity).followers_count || 0,
          mutualFriendsCount: (entity as UserEntity).mutual_friends,
          location: (entity as UserEntity).location || null,
          website: (entity as UserEntity).website || null,
          joinedDate: (entity as UserEntity).created_at || null,
        }
      : null

  const formatJoinDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const joinDate = displayStats ? formatJoinDate(displayStats.joinedDate) : null

  const getEntityInfo = () => {
    switch (type) {
      case 'user': {
        const userEntity = entity as UserEntity
        // Use displayStats for countText/subtitle so every user hover card shows identical content
        const countText = displayStats?.friendsCount
          ? `${displayStats.friendsCount} friends`
          : joinDate
            ? `Joined ${joinDate}`
            : ''
        const subtitle = joinDate ? `Joined ${joinDate}` : undefined

        return {
          icon: <Users className="mr-1 h-3 w-3" />,
          countText,
          href: userEntity.permalink ? `/profile/${userEntity.permalink}` : `/profile/${entity.id}`,
          imageUrl: userEntity.avatar_url || `/api/avatar/${entity.id}`,
          subtitle,
        } as const
      }
      case 'author':
        const authorEntity = entity as AuthorEntity
        // Extract image URL - handle null, undefined, and empty strings
        const authorImageUrl = authorEntity.author_image?.url?.trim()
        
        // Proper pluralization: "1 Book" vs "2 Books"
        const bookText = authorEntity.bookCount === 1 ? 'book' : 'books'
        
        // Build subtitle - keep it simple, we'll show followers/mutual friends separately
        return {
          icon: <BookOpen className="mr-1 h-3 w-3" />,
          countText: `${authorEntity.bookCount} ${bookText}`,
          href: `/authors/${entity.id}`,
          imageUrl: authorImageUrl && authorImageUrl !== '' ? authorImageUrl : undefined,
          subtitle: undefined,
          // Pass followers and mutual friends counts for separate component display
          followersCount: authorEntity.followersCount,
          mutualFriendsCount: authorEntity.mutualFriendsCount,
        }
      case 'publisher':
        const publisherEntity = entity as PublisherEntity
        // Extract image URL - try publisher_image first, then logo_url, handling null, undefined, and empty strings
        const publisherImageUrl = (publisherEntity.publisher_image?.url && publisherEntity.publisher_image.url.trim() !== '') 
          ? publisherEntity.publisher_image.url.trim()
          : (publisherEntity.logo_url && publisherEntity.logo_url.trim() !== '')
            ? publisherEntity.logo_url.trim()
            : undefined
        
        // Build subtitle - show author count, followers and mutual friends will be shown separately
        const bookCountText = `${publisherEntity.bookCount} ${publisherEntity.bookCount === 1 ? 'book' : 'books'}`
        const authorCountText = publisherEntity.authorCount !== undefined && publisherEntity.authorCount > 0
          ? `${publisherEntity.authorCount} ${publisherEntity.authorCount === 1 ? 'author' : 'authors'}`
          : null
        
        return {
          icon: <BookOpen className="mr-1 h-3 w-3" />,
          countText: bookCountText,
          href: `/publishers/${entity.id}`,
          imageUrl: publisherImageUrl,
          subtitle: authorCountText || undefined,
          // Pass followers and mutual friends counts for separate component display
          followersCount: publisherEntity.followersCount,
          mutualFriendsCount: publisherEntity.mutualFriendsCount,
        }
      case 'group': {
        const groupEntity = entity as GroupEntity
        return {
          icon: <Users className="mr-1 h-3 w-3" />,
          countText: groupEntity.joined_at
            ? `Joined ${new Date(groupEntity.joined_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
            : `${groupEntity.member_count || 0} members`,
          href: `/groups/${entity.id}`,
          imageUrl: groupEntity.group_image?.url || `/api/avatar/${entity.id}`,
          subtitle: groupEntity.description,
        }
      }
      case 'event':
        const eventEntity = entity as EventCreatorEntity
        return {
          icon: <Calendar className="mr-1 h-3 w-3" />,
          countText: `${eventEntity.event_count || 0} events`,
          href: `/users/${entity.id}`,
          imageUrl: eventEntity.avatar_url,
          subtitle: eventEntity.location,
        }
      case 'book':
        const bookEntity = entity as BookEntity
        return {
          icon: <BookOpen className="mr-1 h-3 w-3" />,
          countText: bookEntity.publication_year
            ? `Published ${bookEntity.publication_year}`
            : 'Book',
          href: `/books/${entity.id}`,
          imageUrl: bookEntity.cover_image?.url,
          subtitle: bookEntity.author_name ? `by ${bookEntity.author_name}` : undefined,
        }
    }
  }

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation()
    // For authors and publishers, navigate to their page for messaging
    if (type === 'author' || type === 'publisher') {
      const info = getEntityInfo()
      if (info.href) {
        router.push(info.href)
      }
    } else {
      // TODO: Implement message functionality for users
      console.log('Message:', entity.id)
    }
  }

  const info = getEntityInfo()
  // Ensure imageUrl is a valid non-empty string, otherwise use placeholder
  const imageUrl = (info.imageUrl && info.imageUrl.trim() !== '') ? info.imageUrl : '/placeholder.svg'

  console.log('EntityHoverCard Debug:', {
    entityId: entity.id,
    entityName: entity.name,
    entityType: type,
    infoImageUrl: info.imageUrl,
    finalImageUrl: imageUrl,
    isHoverCardOpen: isHoverCardOpen,
    isDropdownOpen: isDropdownOpen,
  })

  return (
    <HoverCard open={isHoverCardOpen || isDropdownOpen} onOpenChange={handleHoverCardOpenChange}>
      <HoverCardTrigger asChild>
        <span
          className="hover:underline cursor-pointer text-muted-foreground inline-block"
          onClick={handleClick}
        >
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent 
        className="p-0 bg-white border border-gray-200 shadow-xl"
        onPointerDownOutside={(e) => {
          // Don't close if clicking on dropdown menu
          const target = e.target as HTMLElement
          if (target.closest('[data-radix-dropdown-menu-content]')) {
            e.preventDefault()
          }
        }}
      >
        <div className="relative p-4">
          <CloseButton onClick={handleClose} variant="primary" className="absolute top-2 right-2" />

          <div className="flex items-start gap-4">
            <div
              className="h-24 w-24 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleClick}
            >
              <Avatar
                src={imageUrl}
                alt={entity.name}
                name={entity.name}
                size="md"
                className="!w-24 !h-24"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3
                className="text-lg font-semibold text-gray-900 mb-1 cursor-pointer hover:text-primary transition-colors"
                onClick={handleClick}
              >
                {entity.name}
              </h3>
              {info.subtitle && <p className="text-sm text-gray-500 mb-2">{info.subtitle}</p>}
              {/* Display followers and mutual friends for author and publisher using reusable components */}
              {(type === 'author' || type === 'publisher') && (
                (() => {
                  const hasFollowers = info.followersCount !== undefined && info.followersCount > 0
                  // Only show mutual friends if user is logged in (mutual friends require a logged-in user to compare)
                  const hasMutualFriends = user && info.mutualFriendsCount !== undefined && info.mutualFriendsCount > 0
                  
                  if (!hasFollowers && !hasMutualFriends) {
                    return null
                  }
                  
                  return (
                    <p className="text-sm text-gray-500 mb-2">
                      {hasFollowers && <FollowersDisplay count={info.followersCount} variant="compact" className="inline" />}
                      {hasFollowers && hasMutualFriends && <span className="mx-1">•</span>}
                      {hasMutualFriends && <MutualFriendsDisplay count={info.mutualFriendsCount} variant="compact" className="inline" />}
                    </p>
                  )
                })()
              )}
              <div className="flex items-center text-sm text-gray-500">
                {info.icon}
                <span>{info.countText}</span>
                {type === 'user' &&
                  displayStats?.mutualFriendsCount != null &&
                  displayStats.mutualFriendsCount > 0 && (
                    <>
                      <span className="mx-1">•</span>
                      <span>
                        {displayStats.mutualFriendsCount === 1
                          ? '1 mutual friend'
                          : `${displayStats.mutualFriendsCount} mutual friends`}
                      </span>
                    </>
                  )}
              </div>

              {/* User stats - Followers and Books only (Joined and Friends shown in top summary) */}
              {type === 'user' && displayStats && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500">
                      <span>Followers: </span>
                      <span className="font-semibold text-gray-900">
                        {displayStats.followersCount}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      <span>Books: </span>
                      <span className="font-semibold text-gray-900">{displayStats.booksRead}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Action Buttons - Show for users, authors, and publishers (only when logged in). Hide for own user. */}
        {user && showActions && !isOwnUser && (type === 'user' || type === 'author' || type === 'publisher') && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div ref={actionsContainerRef} className="flex gap-2 mt-3">
              {type === 'user' ? (
                <AddFriendButton
                  targetUserId={entity.id}
                  targetUserName={entity.name}
                  className="flex-1"
                  variant="outline"
                  size="sm"
                  compact={isCompact}
                />
              ) : (
                <FollowButton
                  entityId={entity.id}
                  targetType={type === 'author' ? 'author' : 'publisher'}
                  entityName={entity.name}
                  className="flex-1"
                  showText={!isCompact}
                />
              )}
              <ResponsiveActionButton
                icon={<MessageSquare className="h-4 w-4" />}
                label="Message"
                tooltip="Message"
                compact={isCompact}
                variant="default"
                size="sm"
                onClick={handleMessage}
                className="flex-1 flex items-center"
              />
              <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="px-3"
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end"
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onEscapeKeyDown={(e) => {
                    // Close dropdown but keep hover card open
                    setIsDropdownOpen(false)
                    e.preventDefault()
                  }}
                >
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}

// Specific entity hover card wrappers for type safety
interface UserHoverCardProps {
  user: UserEntity
  children: React.ReactNode
  showActions?: boolean
  userStats?: {
    booksRead: number
    friendsCount: number
    followersCount: number
    mutualFriendsCount?: number
    location: string | null
    website: string | null
    joinedDate: string
  }
}

export function UserHoverCard({
  user,
  children,
  showActions = true,
  userStats,
}: UserHoverCardProps) {
  return (
    <EntityHoverCard type="user" entity={user} showActions={showActions} userStats={userStats}>
      {children}
    </EntityHoverCard>
  )
}


interface GroupHoverCardProps {
  group: GroupEntity
  children: React.ReactNode
}

export function GroupHoverCard({ group, children }: GroupHoverCardProps) {
  return (
    <EntityHoverCard type="group" entity={group} showActions={false}>
      {children}
    </EntityHoverCard>
  )
}

interface EventCreatorHoverCardProps {
  creator: EventCreatorEntity
  children: React.ReactNode
}

export function EventCreatorHoverCard({ creator, children }: EventCreatorHoverCardProps) {
  return (
    <EntityHoverCard type="event" entity={creator} showActions={false}>
      {children}
    </EntityHoverCard>
  )
}

interface BookHoverCardProps {
  book: BookEntity
  children: React.ReactNode
}

export function BookHoverCard({ book, children }: BookHoverCardProps) {
  return (
    <EntityHoverCard type="book" entity={book} showActions={false}>
      {children}
    </EntityHoverCard>
  )
}
