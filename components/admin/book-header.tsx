import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Camera, BookOpen, Users, MapPin, Globe, User } from 'lucide-react'
import Link from 'next/link'
import { Database } from '@/types/database'
import { EntityHoverCard } from '@/components/entity-hover-cards'
import { formatDate } from '@/utils/dateUtils'

type Book = Database['public']['Tables']['books']['Row']
type Author = Database['public']['Tables']['authors']['Row']
type Publisher = Database['public']['Tables']['publishers']['Row']

interface BookHeaderProps {
  book: Book & {
    author?: Author
    publisher?: Publisher
    cover_image?: {
      url: string
      alt_text: string
    }
  }
  mainAuthor?: any // Add optional mainAuthor prop to use when book.author is not available
  bookCount?: number // Optional book count for hover card
}

// Add a function to get author image URL
function getAuthorImageUrl(author?: Author): string {
  // First check if author has photo_url directly
  if (author?.photo_url) {
    return author.photo_url
  }

  // Then check for author_image from the joined table
  if (author?.author_image?.url) {
    return author.author_image.url
  }

  // Default placeholder
  return '/placeholder.svg'
}

export function BookHeader({ book, mainAuthor, bookCount = 0 }: BookHeaderProps) {
  // Use mainAuthor if provided, otherwise use book.author
  const author = mainAuthor || book.author

  return (
    <div className="book-header-container bg-white rounded-lg shadow-sm overflow-hidden mb-6">
      <div className="book-header-cover-image relative h-auto aspect-[1344/500]">
        {book.cover_image?.url ? (
          <Image
            src={book.cover_image.url}
            alt={book.cover_image.alt_text || book.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
          />
        ) : (
          <div className="book-header-cover-placeholder absolute inset-0 bg-muted flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="book-header-change-cover-btn absolute bottom-4 right-4 bg-white/80 hover:bg-white"
        >
          <Camera className="h-4 w-4 mr-2" />
          Change Cover
        </Button>
      </div>

      <div className="book-header-content px-6 pb-6">
        <div className="book-header-profile flex flex-col md:flex-row md:items-end -mt-10 relative z-10">
          <div className="book-header-author-image-container relative">
            <div className="book-header-author-image relative flex shrink-0 overflow-hidden h-32 w-32 md:h-40 md:w-40 border-4 border-white rounded-full">
              {author ? (
                <Image
                  src={getAuthorImageUrl(author)}
                  alt={`Photo of ${author.name}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 128px, 160px"
                />
              ) : (
                <div className="book-header-author-placeholder flex h-full w-full items-center justify-center bg-muted">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="book-header-change-author-image absolute bottom-2 right-2 rounded-full h-8 w-8 bg-white/80 hover:bg-white"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          <div className="book-header-info mt-4 md:mt-0 md:ml-6 flex-1">
            <div className="book-header-title-section flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="book-header-title text-[1.1rem] font-bold truncate">{book.title}</h1>
                {author ? (
                  <p className="book-header-author text-muted-foreground">
                    by{' '}
                    <EntityHoverCard
                      type="author"
                      entity={{
                        id: author.id,
                        name: author.name,
                        author_image: author.author_image,
                        bookCount: bookCount,
                      }}
                    >
                      <span className="hover:underline cursor-pointer">{author.name}</span>
                    </EntityHoverCard>
                  </p>
                ) : (
                  <p className="book-header-author-unknown text-muted-foreground">
                    by <span>Unknown Author</span>
                  </p>
                )}
              </div>
              <div className="book-header-actions flex space-x-2 mt-4 md:mt-0">
                <Button className="book-header-read-btn">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Read
                </Button>
                <Button variant="outline" className="book-header-share-btn">
                  <Users className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            <div className="book-header-metadata flex flex-wrap gap-x-6 gap-y-2 mt-4">
              {book.publisher && (
                <div className="book-header-publisher flex items-center text-muted-foreground">
                  <BookOpen className="h-4 w-4 mr-1" />
                  <Link href={`/publishers/${book.publisher.id}`} className="hover:underline">
                    {book.publisher.name}
                  </Link>
                </div>
              )}
              {book.publication_date && (
                <div className="book-header-publication-date flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>Published {formatDate(book.publication_date)}</span>
                </div>
              )}
              {book.language && (
                <div className="book-header-language flex items-center text-muted-foreground">
                  <Globe className="h-4 w-4 mr-1" />
                  <span>{book.language}</span>
                </div>
              )}
              {book.pages && (
                <div className="book-header-pages flex items-center text-muted-foreground">
                  <BookOpen className="h-4 w-4 mr-1" />
                  <span>{book.pages} pages</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="book-header-nav border-t">
        <div className="container">
          <div className="book-header-tabs grid grid-cols-4 h-auto mt-0 bg-transparent">
            <button className="book-header-tab inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12">
              Timeline
            </button>
            <button className="book-header-tab book-header-tab-active inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12 border-b-2 border-primary">
              Detail
            </button>
            <button className="book-header-tab inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12">
              Reviews
            </button>
            <button className="book-header-tab inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12">
              Similar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
