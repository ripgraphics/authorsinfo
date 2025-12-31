'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Building } from 'lucide-react'

interface PublisherAvatarProps {
  publisherId: string
  name: string
  avatarUrl?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showName?: boolean
  nameClassName?: string
  linkToProfile?: boolean
  className?: string
}

const sizeMap = {
  xs: {
    container: 'w-8 h-8',
    icon: 'h-4 w-4',
    img: 32,
    nameSize: 'text-xs',
  },
  sm: {
    container: 'w-10 h-10',
    icon: 'h-5 w-5',
    img: 40,
    nameSize: 'text-xs',
  },
  md: {
    container: 'w-24 h-24',
    icon: 'h-10 w-10',
    img: 96,
    nameSize: 'text-sm',
  },
  lg: {
    container: 'w-32 h-32',
    icon: 'h-14 w-14',
    img: 128,
    nameSize: 'text-base',
  },
  xl: {
    container: 'w-40 h-40',
    icon: 'h-16 w-16',
    img: 160,
    nameSize: 'text-lg',
  },
}

export function PublisherAvatar({
  publisherId,
  name,
  avatarUrl,
  size = 'md',
  showName = true,
  nameClassName = '',
  linkToProfile = true,
  className = '',
}: PublisherAvatarProps) {
  const conf = sizeMap[size] || sizeMap.md

  const avatarContent = (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className="avatar-container relative overflow-hidden rounded-full border-2 border-white shadow-md"
        style={{ width: conf.img, height: conf.img }}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={`${name} avatar`}
            width={conf.img}
            height={conf.img}
            className="object-cover rounded-full"
            style={{ aspectRatio: '1 / 1' }}
          />
        ) : (
          <div className="avatar-placeholder w-full h-full bg-muted flex items-center justify-center rounded-full">
            {name && name.length > 0 ? (
              <span className={`${conf.nameSize} font-semibold text-muted-foreground uppercase`}>
                {name.charAt(0)}
              </span>
            ) : (
              <Building className={`${conf.icon} text-muted-foreground`} />
            )}
          </div>
        )}
      </div>
      {showName && (
        <p
          className={`mt-2 font-medium text-center line-clamp-2 ${conf.nameSize} ${nameClassName}`}
        >
          {name}
        </p>
      )}
    </div>
  )

  if (linkToProfile) {
    return (
      <Link
        href={`/publishers/${publisherId}`}
        className="publisher-avatar-link block hover:opacity-90 transition-opacity"
      >
        {avatarContent}
      </Link>
    )
  }

  return avatarContent
}
