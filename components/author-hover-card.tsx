import type React from "react"
import Link from "next/link"
import { CalendarDays, BookOpen, MapPin } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { AuthorAvatar } from "@/components/author-avatar"

interface Author {
  id: string
  name: string
  bio?: string
  birth_date?: string
  nationality?: string
  photo_url?: string
  author_image?: {
    id: string
    url: string
    alt_text?: string
    img_type_id?: string
  }
}

interface AuthorHoverCardProps {
  author: Author
  bookCount: number // Remove the optional ? mark
  children: React.ReactNode
  className?: string
}

// Helper function to get author image URL
function getAuthorImageUrl(author: Author): string {
  // First check if author has photo_url directly
  if (author.photo_url) {
    return author.photo_url
  }

  // Then check for author_image from the joined table
  if (author.author_image && author.author_image.url) {
    return author.author_image.url
  }

  // Default placeholder
  return "/placeholder.svg"
}

export function AuthorHoverCard({ author, bookCount, children, className = "" }: AuthorHoverCardProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span className={`author-hover-trigger cursor-pointer ${className}`}>{children}</span>
      </HoverCardTrigger>
      <HoverCardContent className="author-hover-content w-120 p-0">
        <Link href={`/authors/${author.id}`} className="block p-4 hover:bg-gray-50 transition-colors rounded-md">
          <div className="flex justify-between space-x-4">
            <div className="flex-shrink-0">
              <AuthorAvatar
                id={author.id}
                name={author.name}
                imageUrl={getAuthorImageUrl(author)}
                size="md"
                linkToProfile={false}
              />
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="text-sm font-semibold">{author.name}</h4>
              {author.bio && <p className="text-sm line-clamp-2">{author.bio}</p>}

              <div className="flex flex-col gap-1 pt-1">
                {author.nationality && (
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-3.5 w-3.5 opacity-70" />
                    <span className="text-xs text-muted-foreground">{author.nationality}</span>
                  </div>
                )}

                {author.birth_date && (
                  <div className="flex items-center">
                    <CalendarDays className="mr-2 h-3.5 w-3.5 opacity-70" />
                    <span className="text-xs text-muted-foreground">Born {author.birth_date}</span>
                  </div>
                )}

                <div className="flex items-center">
                  <BookOpen className="mr-2 h-3.5 w-3.5 opacity-70" />
                  <span className="text-xs text-muted-foreground">{bookCount} books</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </HoverCardContent>
    </HoverCard>
  )
}
