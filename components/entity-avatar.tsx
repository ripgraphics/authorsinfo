'use client'

import React from 'react'
import { Avatar } from '@/components/ui/avatar'
import { EntityHoverCard, UserHoverCard } from '@/components/entity-hover-cards'

type EntityType = 'user' | 'author' | 'publisher' | 'group' | 'event' | 'book'

interface EntityAvatarProps {
  type: EntityType
  id: string
  name: string
  src?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

export default function EntityAvatar({ type, id, name, src, size = 'sm', className }: EntityAvatarProps) {
  const avatar = (
    <Avatar src={src || undefined} alt={name} name={name} size={size} className={className} />
  )

  if (type === 'user') {
    return (
      <UserHoverCard user={{ id, name, avatar_url: src || undefined } as any}>
        {avatar}
      </UserHoverCard>
    )
  }

  return (
    <EntityHoverCard type={type} entity={{ id, name, avatar_url: src || undefined } as any} showActions={false}>
      {avatar}
    </EntityHoverCard>
  )
}
