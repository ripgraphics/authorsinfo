'use client'

import React from 'react'
import { EntityHoverCard, UserHoverCard } from '@/components/entity-hover-cards'

type EntityType = 'user' | 'author' | 'publisher' | 'group' | 'event' | 'book'

interface EntityNameProps {
  type: EntityType
  id: string
  name: string
  avatar_url?: string | null
  permalink?: string | null
  className?: string
  showActions?: boolean
  children?: React.ReactNode
}

export function EntityName({
  type,
  id,
  name,
  avatar_url,
  permalink,
  className,
  showActions = true,
  children,
}: EntityNameProps) {
  const content = (
    <span className={className || 'hover:underline cursor-pointer text-gray-900'}>
      {children ?? name}
    </span>
  )

  if (type === 'user') {
    return (
      <UserHoverCard
        user={
          {
            id,
            name,
            avatar_url: avatar_url || undefined,
            permalink: permalink || undefined,
          } as any
        }
        showActions={showActions}
      >
        {content}
      </UserHoverCard>
    )
  }

  // Generic fallback for non-user entities
  return (
    <EntityHoverCard
      type={type}
      entity={{ id, name, avatar_url: avatar_url || undefined } as any}
      showActions={false}
    >
      {content}
    </EntityHoverCard>
  )
}

export default EntityName
