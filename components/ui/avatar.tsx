'use client'

import Image from 'next/image'
import Link from 'next/link'
import { User } from 'lucide-react'

interface AvatarProps {
  id?: string
  src?: string
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  linkToProfile?: boolean
  className?: string
}

const sizeMap = {
  xs: {
    container: 'w-8 h-8',
    icon: 'h-4 w-4',
    img: 32,
  },
  sm: {
    container: 'w-10 h-10',
    icon: 'h-5 w-5',
    img: 40,
  },
  md: {
    container: 'w-24 h-24',
    icon: 'h-10 w-10',
    img: 96,
  },
  lg: {
    container: 'w-32 h-32',
    icon: 'h-14 w-14',
    img: 128,
  },
  xl: {
    container: 'w-40 h-40',
    icon: 'h-16 w-16',
    img: 160,
  },
}

export function Avatar({
  id,
  src,
  alt = 'Avatar',
  name = '',
  size = 'sm',
  linkToProfile = false,
  className = '',
  children,
}: AvatarProps & { children?: React.ReactNode }) {
  const conf = (sizeMap as any)[size] || sizeMap.sm

  // If children are provided (shadcn/ui style), render them
  if (children) {
    return (
      <div
        className={`avatar-container relative ${conf.container} overflow-hidden rounded-full border-2 border-white shadow-md ${className}`}
      >
        {children}
      </div>
    )
  }

  const avatarContent = (
    <div
      className={`avatar-container relative ${conf.container} overflow-hidden rounded-full border-2 border-white shadow-md ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={alt || name || 'Avatar'}
          width={conf.img}
          height={conf.img}
          className="object-cover rounded-full"
          style={{ aspectRatio: '1 / 1' }}
          unoptimized={src.startsWith('/api/avatar/')}
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88f8fAARNAf/5H5H6AAAAAElFTkSuQmCC"
        />
      ) : (
        <div className="avatar-placeholder w-full h-full bg-muted flex items-center justify-center rounded-full">
          {name && name.length > 0 && name !== 'You' ? (
            <span className="text-lg font-semibold text-muted-foreground uppercase">
              {name.charAt(0)}
            </span>
          ) : (
            <User className={`${conf.icon} text-muted-foreground`} />
          )}
        </div>
      )}
    </div>
  )

  if (linkToProfile && id) {
    return (
      <Link
        href={`/authors/${id}`}
        className="avatar-link block hover:opacity-90 transition-opacity"
      >
        {avatarContent}
      </Link>
    )
  }

  return avatarContent
}

export function AvatarImage({
  src,
  alt = 'Avatar',
  className,
  ...props
}: Omit<React.ComponentPropsWithoutRef<typeof Image>, 'src' | 'alt'> & {
  src?: string | null
  alt?: string
}) {
  if (!src) return null
  return (
    <Image
      src={src}
      alt={alt}
      className={`aspect-square h-full w-full object-cover ${className || ''}`}
      fill
      sizes="100px"
      {...props}
    />
  )
}

export function AvatarFallback({ children }: { children: React.ReactNode }) {
  return <span>{children}</span>
}
