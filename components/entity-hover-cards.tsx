import type React from "react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserPlus, MessageCircle, MoreHorizontal, X, BookOpen, Users, Calendar } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

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
  mutual_friends?: number
  permalink?: string
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

type Entity = UserEntity | AuthorEntity | PublisherEntity | GroupEntity | EventCreatorEntity | BookEntity

interface EntityHoverCardProps {
  type: EntityType
  entity: Entity
  children: React.ReactNode
  showActions?: boolean
}

export function EntityHoverCard({ type, entity, children, showActions = true }: EntityHoverCardProps) {
  const router = useRouter()

  const getEntityInfo = () => {
    switch (type) {
      case 'user':
        const userEntity = entity as UserEntity
        return {
          icon: <Users className="mr-1 h-3 w-3" />,
          countText: userEntity.friend_count ? `${userEntity.friend_count} friends` : 'New user',
          href: userEntity.permalink ? `/profile/${userEntity.permalink}` : `/profile/${entity.id}`,
          imageUrl: userEntity.avatar_url || `/api/avatar/${entity.id}`,
          subtitle: userEntity.created_at ? `Joined ${new Date(userEntity.created_at).toLocaleDateString('en-US', { 
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}` : undefined
        }
      case 'author':
        const authorEntity = entity as AuthorEntity
        return {
          icon: <BookOpen className="mr-1 h-3 w-3" />,
          countText: `${authorEntity.bookCount} books`,
          href: `/authors/${entity.id}`,
          imageUrl: authorEntity.author_image?.url,
          subtitle: authorEntity.bio
        }
      case 'publisher':
        const publisherEntity = entity as PublisherEntity
        return {
          icon: <BookOpen className="mr-1 h-3 w-3" />,
          countText: `${publisherEntity.bookCount} books`,
          href: `/publishers/${entity.id}`,
          imageUrl: publisherEntity.publisher_image?.url || publisherEntity.logo_url,
          subtitle: publisherEntity.location
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
          subtitle: groupEntity.description
        }
      }
      case 'event':
        const eventEntity = entity as EventCreatorEntity
        return {
          icon: <Calendar className="mr-1 h-3 w-3" />,
          countText: `${eventEntity.event_count || 0} events`,
          href: `/users/${entity.id}`,
          imageUrl: eventEntity.avatar_url,
          subtitle: eventEntity.location
        }
      case 'book':
        const bookEntity = entity as BookEntity
        return {
          icon: <BookOpen className="mr-1 h-3 w-3" />,
          countText: bookEntity.publication_year ? `Published ${bookEntity.publication_year}` : 'Book',
          href: `/books/${entity.id}`,
          imageUrl: bookEntity.cover_image?.url,
          subtitle: bookEntity.author_name ? `by ${bookEntity.author_name}` : undefined
        }
    }
  }

  const handleClick = () => {
    const info = getEntityInfo()
    router.push(info.href)
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
  const imageUrl = info.imageUrl || "/placeholder.svg"

  return (
    <HoverCard openOnClick>
      <HoverCardTrigger asChild>
        <span 
          className="hover:underline cursor-pointer text-muted-foreground"
          onClick={handleClick}
        >
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="p-0 bg-white border border-gray-200 shadow-xl">
        {/* Header with close button */}
        <div className="relative p-4">
          <button className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
          
          {/* Horizontal Layout: Avatar on left, Entity info on right */}
          <div className="flex items-start gap-4">
            {/* Avatar on the left */}
            <Avatar className="h-20 w-20 flex-shrink-0">
              <AvatarImage 
                src={imageUrl} 
                alt={entity.name} 
              />
              <AvatarFallback className="text-xl font-semibold">
                {entity.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Entity info on the right */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{entity.name}</h3>
              {info.subtitle && (
                <p className="text-sm text-gray-500 mb-2">{info.subtitle}</p>
              )}
              <div className="flex items-center text-sm text-gray-500">
                {info.icon}
                <span>{info.countText}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Only show for users */}
        {showActions && type === 'user' && (
          <div className="px-4 pb-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={handleAddFriend}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Friend
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={handleMessage}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="px-3"
                onClick={handleMoreOptions}
              >
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
}

export function UserHoverCard({ user, children, showActions = true }: UserHoverCardProps) {
  return (
    <EntityHoverCard
      type="user"
      entity={user}
      showActions={showActions}
    >
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
    <EntityHoverCard
      type="author"
      entity={author}
      showActions={false}
    >
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
    <EntityHoverCard
      type="publisher"
      entity={publisher}
      showActions={false}
    >
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
    <EntityHoverCard
      type="group"
      entity={group}
      showActions={false}
    >
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
    <EntityHoverCard
      type="event"
      entity={creator}
      showActions={false}
    >
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
    <EntityHoverCard
      type="book"
      entity={book}
      showActions={false}
    >
      {children}
    </EntityHoverCard>
  )
} 