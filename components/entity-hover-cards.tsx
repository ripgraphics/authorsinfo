import type React from 'react'
import { useState } from 'react'
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
  UserPlus,
  MessageCircle,
  MoreHorizontal,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  bio?: string
}

interface PublisherEntity extends BaseEntity {
  publisher_image?: {
    url: string
  }
  logo_url?: string
  bookCount: number
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
  const router = useRouter()
  const handleClose = () => {}

  const handleClick = () => {
    const info = getEntityInfo()
    if (info.href) {
      router.push(info.href)
    }
  }

  const getEntityInfo = () => {
    switch (type) {
      case 'user':
        const userEntity = entity as UserEntity
        const joinDate = userEntity.created_at
          ? new Date(userEntity.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : undefined

        return {
          icon: <Users className="mr-1 h-3 w-3" />,
          countText: userEntity.friend_count
            ? `${userEntity.friend_count} friends`
            : joinDate
              ? `Joined ${joinDate}`
              : '',
          href: userEntity.permalink ? `/profile/${userEntity.permalink}` : `/profile/${entity.id}`,
          imageUrl: userEntity.avatar_url || `/api/avatar/${entity.id}`,
          subtitle: joinDate ? `Joined ${joinDate}` : undefined,
          // Additional user stats - only show if we have real data
          friendsCount: userEntity.friend_count || 0,
          followersCount: userEntity.followers_count || 0,
          booksReadCount: userEntity.books_read_count || 0,
        } as const
      case 'author':
        const authorEntity = entity as AuthorEntity
        // Extract image URL - handle null, undefined, and empty strings
        const authorImageUrl = authorEntity.author_image?.url?.trim()
        return {
          icon: <BookOpen className="mr-1 h-3 w-3" />,
          countText: `${authorEntity.bookCount} books`,
          href: `/authors/${entity.id}`,
          imageUrl: authorImageUrl && authorImageUrl !== '' ? authorImageUrl : undefined,
          subtitle: authorEntity.bio,
        }
      case 'publisher':
        const publisherEntity = entity as PublisherEntity
        // Extract image URL - try publisher_image first, then logo_url, handling null, undefined, and empty strings
        const publisherImageUrl = publisherEntity.publisher_image?.url?.trim() || publisherEntity.logo_url?.trim()
        return {
          icon: <BookOpen className="mr-1 h-3 w-3" />,
          countText: `${publisherEntity.bookCount} books`,
          href: `/publishers/${entity.id}`,
          imageUrl: publisherImageUrl && publisherImageUrl !== '' ? publisherImageUrl : undefined,
          subtitle: publisherEntity.location,
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

  const handleAddFriend = (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Implement add friend functionality using the new API
    console.log('Add friend:', entity.id)
    // This could be enhanced to use the new /api/friends endpoint
  }

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Implement message functionality
    console.log('Message:', entity.id)
  }

  const handleMoreOptions = (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Implement more options menu
    console.log('More options:', entity.id)
  }

  const info = getEntityInfo()
  // Ensure imageUrl is a valid non-empty string, otherwise use placeholder
  const imageUrl = (info.imageUrl && info.imageUrl.trim() !== '') ? info.imageUrl : '/placeholder.svg'

  // Use userStats prop if available, otherwise use entity data
  const displayStats = userStats || {
    booksRead: (entity as UserEntity).books_read_count || 0,
    friendsCount: (entity as UserEntity).friend_count || 0,
    followersCount: (entity as UserEntity).followers_count || 0,
    location: (entity as UserEntity).location || null,
    website: (entity as UserEntity).website || null,
    joinedDate: (entity as UserEntity).created_at || null,
  }

  // Temporary debug logging to see what data we're getting
  console.log('🔍 Hover Card Debug:', {
    entityId: entity.id,
    entityName: entity.name,
    userStats: userStats,
    displayStats: displayStats,
    hasUserStats: !!userStats,
    entityData: {
      books_read_count: (entity as UserEntity).books_read_count,
      friend_count: (entity as UserEntity).friend_count,
      followers_count: (entity as UserEntity).followers_count,
    },
  })

  // Format join date
  const formatJoinDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const joinDate = formatJoinDate(displayStats.joinedDate)

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span
          className="hover:underline cursor-pointer text-muted-foreground inline-block"
          onClick={handleClick}
        >
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="p-0 bg-white border border-gray-200 shadow-xl">
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
              <div className="flex items-center text-sm text-gray-500">
                {info.icon}
                <span>{info.countText}</span>
              </div>

              {/* User stats - only the 4 items you specified in correct order */}
              {type === 'user' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="space-y-1">
                    {/* 1. Join Date (first, replacing "New user") */}
                    {joinDate && (
                      <div className="text-sm text-gray-500">
                        <span>Joined: </span>
                        <span className="font-semibold text-gray-900">{joinDate}</span>
                      </div>
                    )}

                    {/* 2. Total Friends - show even if 0 */}
                    <div className="text-sm text-gray-500">
                      <span>Friends: </span>
                      <span className="font-semibold text-gray-900">
                        {displayStats.friendsCount}
                      </span>
                    </div>

                    {/* 3. Followers - show even if 0 */}
                    <div className="text-sm text-gray-500">
                      <span>Followers: </span>
                      <span className="font-semibold text-gray-900">
                        {displayStats.followersCount}
                      </span>
                    </div>

                    {/* 4. Books Read - show even if 0 */}
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
        {/* Action Buttons - Only show for users */}
        {showActions && type === 'user' && (
          <div className="px-4 pb-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleAddFriend}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Friend
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={handleMessage}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
              <Button variant="outline" size="sm" className="px-3" onClick={handleMoreOptions}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
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

interface AuthorHoverCardProps {
  author: AuthorEntity
  children: React.ReactNode
}

export function AuthorHoverCard({ author, children }: AuthorHoverCardProps) {
  return (
    <EntityHoverCard type="author" entity={author} showActions={false}>
      {children}
    </EntityHoverCard>
  )
}

interface PublisherHoverCardProps {
  publisher: PublisherEntity
  children: React.ReactNode
}

export function PublisherHoverCard({ publisher, children }: PublisherHoverCardProps) {
  return (
    <EntityHoverCard type="publisher" entity={publisher} showActions={false}>
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
