import type React from "react"
import Link from "next/link"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookOpen, Calendar, MapPin } from "lucide-react"
import type { Author } from "@/types/database"

interface AuthorHoverCardProps {
  author: Author
  bookCount: number
  children: React.ReactNode
}

export function AuthorHoverCard({ author, bookCount, children }: AuthorHoverCardProps) {
  // Determine the image URL to use
  const imageUrl = author.author_image?.url || author.photo_url || "/placeholder.svg"

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={imageUrl || "/placeholder.svg"} alt={author.name} />
            <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{author.name}</h4>
            {author.birth_date && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="mr-1 h-3 w-3" />
                <span>Born {new Date(author.birth_date).getFullYear()}</span>
              </div>
            )}
            {author.nationality && (
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="mr-1 h-3 w-3" />
                <span>{author.nationality}</span>
              </div>
            )}
            <div className="flex items-center text-xs text-muted-foreground">
              <BookOpen className="mr-1 h-3 w-3" />
              <span>{bookCount} books</span>
            </div>
          </div>
        </div>
        {author.bio && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground line-clamp-3">{author.bio}</p>
          </div>
        )}
        <div className="mt-2">
          <Link href={`/authors/${author.id}`} className="text-xs text-blue-600 hover:underline hover:text-blue-800">
            View full profile
          </Link>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
