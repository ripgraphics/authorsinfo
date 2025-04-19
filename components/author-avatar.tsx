import Image from "next/image"
import Link from "next/link"
import { User } from "lucide-react"

interface AuthorImageProps {
  id?: string
  name: string
  imageUrl?: string
  size?: "sm" | "md" | "lg" | "xl"
  linkToProfile?: boolean
  className?: string
}

export function AuthorAvatar({
  id,
  name,
  imageUrl,
  size = "md",
  linkToProfile = true,
  className = "",
}: AuthorImageProps) {
  // Size mapping for different avatar sizes
  const sizeMap = {
    sm: {
      container: "w-12 h-12",
      icon: "h-6 w-6",
    },
    md: {
      container: "w-24 h-24",
      icon: "h-10 w-10",
    },
    lg: {
      container: "w-32 h-32",
      icon: "h-14 w-14",
    },
    xl: {
      container: "w-40 h-40",
      icon: "h-16 w-16",
    },
  }

  const avatarContent = (
    <div
      className={`author-avatar-container relative ${sizeMap[size].container} overflow-hidden rounded-full border-2 border-white shadow-md ${className}`}
    >
      {imageUrl ? (
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={`Photo of ${name}`}
          fill
          className="author-avatar-image object-cover rounded-full"
        />
      ) : (
        <div className="author-avatar-placeholder w-full h-full bg-muted flex items-center justify-center rounded-full">
          <User className={`${sizeMap[size].icon} text-muted-foreground`} />
        </div>
      )}
    </div>
  )

  // If linkToProfile is true and we have an id, wrap the avatar in a link
  if (linkToProfile && id) {
    return (
      <Link href={`/authors/${id}`} className="author-avatar-link block hover:opacity-90 transition-opacity">
        {avatarContent}
      </Link>
    )
  }

  // Otherwise, just return the avatar
  return avatarContent
}
