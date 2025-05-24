"use client"

import Image from "next/image"
import Link from "next/link"
import { User } from "lucide-react"

interface AvatarProps {
  id?: string
  src?: string
  alt?: string
  name?: string
  size?: "sm" | "md" | "lg" | "xl"
  linkToProfile?: boolean
  className?: string
}

const sizeMap = {
  sm: {
    container: "w-10 h-10",
    icon: "h-5 w-5",
    img: 40,
  },
  md: {
    container: "w-24 h-24",
    icon: "h-10 w-10",
    img: 96,
  },
  lg: {
    container: "w-32 h-32",
    icon: "h-14 w-14",
    img: 128,
  },
  xl: {
    container: "w-40 h-40",
    icon: "h-16 w-16",
    img: 160,
  },
}

export function Avatar({
  id,
  src,
  alt = "Avatar",
  name = "",
  size = "sm",
  linkToProfile = false,
  className = "",
}: AvatarProps) {
  const avatarContent = (
    <div
      className={`avatar-container relative ${sizeMap[size].container} overflow-hidden rounded-full border-2 border-white shadow-md ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={alt || name || "Avatar"}
          width={sizeMap[size].img}
          height={sizeMap[size].img}
          className="object-cover rounded-full"
          style={{ aspectRatio: '1 / 1' }}
        />
      ) : (
        <div className="avatar-placeholder w-full h-full bg-muted flex items-center justify-center rounded-full">
          {name ? (
            <span className="text-lg font-semibold text-muted-foreground">{name.charAt(0)}</span>
          ) : (
            <User className={`${sizeMap[size].icon} text-muted-foreground`} />
          )}
        </div>
      )}
    </div>
  )

  if (linkToProfile && id) {
    return (
      <Link href={`/authors/${id}`} className="avatar-link block hover:opacity-90 transition-opacity">
        {avatarContent}
      </Link>
    )
  }

  return avatarContent
}

export function AvatarImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img {...props} />;
}

export function AvatarFallback({ children }: { children: React.ReactNode }) {
  return <span>{children}</span>;
}
