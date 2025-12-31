'use client'

import { Avatar } from '@/components/ui/avatar'
import Link from 'next/link'

interface AuthorAvatarProps {
  id?: string
  name: string
  imageUrl?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function AuthorAvatar({
  id,
  name,
  imageUrl,
  size = 'md',
  className = '',
}: AuthorAvatarProps) {
  const avatarContent = (
    <Avatar src={imageUrl} alt={name} name={name} size={size} className={className} />
  )

  if (id) {
    return (
      <Link href={`/authors/${id}`} className="block hover:opacity-90 transition-opacity">
        {avatarContent}
      </Link>
    )
  }

  return avatarContent
}
