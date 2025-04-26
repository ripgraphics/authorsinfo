import Link from "next/link"
import type { Author } from "@/types/book"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthorAvatar } from "@/components/author-avatar"
import { AuthorHoverCard } from "@/components/author-hover-card"
import { Pencil } from "lucide-react"

interface AboutAuthorProps {
  authors: Author[]
  bookId?: string
  showEditButton?: boolean
  className?: string
  books?: any[] // Added books prop to pass book count
  authorBookCounts?: Record<string, number> // Added authorBookCounts to get accurate book counts
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

export function AboutAuthor({ 
  authors, 
  bookId, 
  showEditButton = true, 
  className = "", 
  books = [],
  authorBookCounts = {} 
}: AboutAuthorProps) {
  return (
    <Card className={`about-author-card ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>About the Author{authors.length > 1 ? "s" : ""}</CardTitle>
        {showEditButton && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
            <Link
              href={
                authors && authors.length > 0
                  ? `/authors/${authors[0].id}/edit`
                  : bookId
                    ? `/authors/new?book_id=${bookId}`
                    : "/authors/new"
              }
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">{authors && authors.length > 0 ? "Edit Author" : "Add Author"}</span>
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {authors.length > 0 ? (
          authors.map((author) => (
            <div key={author.id} className="author-profile flex flex-col items-center text-center">
              {/* Author Image */}
              <div className="mb-3">
                <AuthorAvatar
                  id={author.id}
                  name={author.name}
                  imageUrl={getAuthorImageUrl(author)}
                  size="md"
                  className="mx-auto hover:border-blue-500 transition-colors"
                />
              </div>

              {/* Author Name with HoverCard */}
              <AuthorHoverCard 
                author={author} 
                bookCount={authorBookCounts[author.id] || books.length || 0}
              >
                <span className="author-name font-medium text-lg hover:underline">{author.name}</span>
              </AuthorHoverCard>

              {/* Author Bio - Truncated */}
              {author.bio && (
                <p className="author-bio text-sm mt-2 line-clamp-5 text-muted-foreground text-left">{author.bio}</p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Author information unavailable</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
