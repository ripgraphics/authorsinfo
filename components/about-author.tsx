import Link from 'next/link'
import type { Author } from '@/types/book'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import EntityAvatar from '@/components/entity-avatar'
import { EntityHoverCard } from '@/components/entity-hover-cards'
import { Pencil } from 'lucide-react'

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
  return author.author_image?.url || ''
}

export function AboutAuthor({
  authors,
  bookId,
  showEditButton = true,
  className = '',
  books = [],
  authorBookCounts = {},
}: AboutAuthorProps) {
  return (
    <Card className={`about-author-card ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>About the Author{authors.length > 1 ? 's' : ''}</CardTitle>
        {showEditButton && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
            <Link
              href={
                authors && authors.length > 0
                  ? `/authors/${authors[0].id}/edit`
                  : bookId
                    ? `/authors/new?book_id=${bookId}`
                    : '/authors/new'
              }
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">
                {authors && authors.length > 0 ? 'Edit Author' : 'Add Author'}
              </span>
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
                <EntityAvatar
                  type="author"
                  id={author.id}
                  name={author.name}
                  src={getAuthorImageUrl(author)}
                  size="md"
                  className="mx-auto hover:border-app-theme-blue transition-colors"
                />
              </div>

              {/* Author Name with HoverCard */}
              <EntityHoverCard
                type="author"
                entity={{
                  id: author.id,
                  name: author.name,
                  author_image: author.author_image ? { url: author.author_image.url } : undefined,
                  bookCount: authorBookCounts[author.id] || books.length || 0,
                }}
              >
                <span className="text-muted-foreground">{author.name}</span>
              </EntityHoverCard>

              {/* Author Bio - Truncated */}
              {author.bio && (
                <p className="author-bio text-sm mt-2 line-clamp-5 text-muted-foreground text-left">
                  {author.bio}
                </p>
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
