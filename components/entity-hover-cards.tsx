import type React from "react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import Link from "next/link"
import { Avatar } from "@/components/ui/avatar"
import { BookOpen, Users, Calendar } from "lucide-react"

type EntityType = 'author' | 'publisher' | 'group' | 'event'

type AuthorEntity = {
  id: string
  name: string
  author_image?: {
    url: string
  }
  bookCount: number
}

type PublisherEntity = {
  id: string
  name: string
  publisher_image?: {
    url: string
  }
  logo_url?: string
  bookCount: number
}

type GroupEntity = {
  id: string
  name: string
  group_image?: {
    url: string
  }
  member_count?: number
  joined_at?: string
}

type EventCreatorEntity = {
  id: string
  name: string
  avatar_url?: string
  event_count?: number
}

type Entity = AuthorEntity | PublisherEntity | GroupEntity | EventCreatorEntity

interface EntityHoverCardProps {
  type: EntityType
  entity: Entity
  children: React.ReactNode
}

export function EntityHoverCard({ type, entity, children }: EntityHoverCardProps) {
  const getEntityInfo = () => {
    switch (type) {
      case 'author':
        return {
          icon: <BookOpen className="mr-1 h-3 w-3" />,
          countText: `${(entity as AuthorEntity).bookCount} books`,
          href: `/authors/${entity.id}`,
          imageUrl: (entity as AuthorEntity).author_image?.url
        }
      case 'publisher':
        return {
          icon: <BookOpen className="mr-1 h-3 w-3" />,
          countText: `${(entity as PublisherEntity).bookCount} books`,
          href: `/publishers/${entity.id}`,
          imageUrl: (entity as PublisherEntity).publisher_image?.url
        }
      case 'group': {
        const groupEntity = entity as GroupEntity
        return {
          icon: <Users className="mr-1 h-3 w-3" />,
          countText: groupEntity.joined_at 
            ? `Joined ${new Date(groupEntity.joined_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
            : `${groupEntity.member_count || 0} members`,
          href: `/profile/${entity.id}`,
          imageUrl: groupEntity.group_image?.url || `/api/avatar/${entity.id}`
        }
      }
      case 'event':
        return {
          icon: <Calendar className="mr-1 h-3 w-3" />,
          countText: `${(entity as EventCreatorEntity).event_count || 0} events`,
          href: `/users/${entity.id}`,
          imageUrl: (entity as EventCreatorEntity).avatar_url
        }
    }
  }

  const info = getEntityInfo()
  const imageUrl = info.imageUrl || "/placeholder.svg"

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-80">
        <Link href={info.href} className="no-underline">
          <div className="flex items-start space-x-4">
            <Avatar 
              src={imageUrl}
              alt={entity.name}
              name={entity.name}
              size="sm"
              className="h-10 w-10"
            />
            <div className="flex flex-col">
              <h4 className="text-sm font-semibold">{entity.name}</h4>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {info.icon}
                <span>{info.countText}</span>
              </div>
            </div>
          </div>
        </Link>
      </HoverCardContent>
    </HoverCard>
  )
}

// Author Hover Card
interface AuthorHoverCardProps {
  author: {
    id: string
    name: string
    author_image?: {
      url: string
    }
  }
  bookCount: number
  children: React.ReactNode
}

export function AuthorHoverCard({ author, bookCount, children }: AuthorHoverCardProps) {
  return (
    <EntityHoverCard
      type="author"
      entity={{
        id: author.id,
        name: author.name,
        author_image: author.author_image,
        bookCount: bookCount
      }}
    >
      {children}
    </EntityHoverCard>
  )
}

// Publisher Hover Card
interface PublisherHoverCardProps {
  publisher: {
    id: string
    name: string
    publisher_image?: {
      url: string
    }
    logo_url?: string
  }
  bookCount: number
  children: React.ReactNode
}

export function PublisherHoverCard({ publisher, bookCount, children }: PublisherHoverCardProps) {
  return (
    <EntityHoverCard
      type="publisher"
      entity={{
        id: publisher.id,
        name: publisher.name,
        publisher_image: publisher.publisher_image,
        logo_url: publisher.publisher_image?.url,
        bookCount: bookCount
      }}
    >
      {children}
    </EntityHoverCard>
  )
}

// Group Hover Card
interface GroupHoverCardProps {
  group: {
    id: string
    name: string
    group_image?: {
      url: string
    }
    member_count?: number
  }
  children: React.ReactNode
}

export function GroupHoverCard({ group, children }: GroupHoverCardProps) {
  return (
    <EntityHoverCard
      type="group"
      entity={{
        id: group.id,
        name: group.name,
        group_image: group.group_image,
        member_count: group.member_count
      }}
    >
      {children}
    </EntityHoverCard>
  )
}

// Event Creator Hover Card
interface EventCreatorHoverCardProps {
  creator: {
    id: string
    name: string
    avatar_url?: string
    event_count?: number
  }
  children: React.ReactNode
}

export function EventCreatorHoverCard({ creator, children }: EventCreatorHoverCardProps) {
  return (
    <EntityHoverCard
      type="event"
      entity={{
        id: creator.id,
        name: creator.name,
        avatar_url: creator.avatar_url,
        event_count: creator.event_count
      }}
    >
      {children}
    </EntityHoverCard>
  )
} 