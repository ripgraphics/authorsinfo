import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Camera, BookOpen, Users, MapPin, Globe } from "lucide-react"
import Link from "next/link"
import { Database } from "@/types/database"

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
}

export function BookHeader({ book }: BookHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
      <div className="relative h-[300px]">
        {book.cover_image?.url ? (
          <Image
            src={book.cover_image.url}
            alt={book.cover_image.alt_text || book.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="absolute bottom-4 right-4 bg-white/80 hover:bg-white"
        >
          <Camera className="h-4 w-4 mr-2" />
          Change Cover
        </Button>
      </div>
      
      <div className="px-6 pb-6">
        <div className="flex flex-col md:flex-row md:items-end -mt-16 md:-mt-20 relative z-10">
          <div className="relative">
            <div className="relative flex shrink-0 overflow-hidden h-32 w-32 md:h-40 md:w-40 border-4 border-white rounded-lg">
              {book.cover_image?.url ? (
                <Image
                  src={book.cover_image.url}
                  alt={book.cover_image.alt_text || book.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-2 right-2 rounded-full h-8 w-8 bg-white/80 hover:bg-white"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mt-4 md:mt-0 md:ml-6 flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold">{book.title}</h1>
                {book.author && (
                  <p className="text-muted-foreground">
                    by{" "}
                    <Link href={`/authors/${book.author.id}`} className="hover:underline">
                      {book.author.name}
                    </Link>
                  </p>
                )}
              </div>
              <div className="flex space-x-2 mt-4 md:mt-0">
                <Button>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Read
                </Button>
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
              {book.publisher && (
                <div className="flex items-center text-muted-foreground">
                  <BookOpen className="h-4 w-4 mr-1" />
                  <Link href={`/publishers/${book.publisher.id}`} className="hover:underline">
                    {book.publisher.name}
                  </Link>
                </div>
              )}
              {book.publication_date && (
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>Published {new Date(book.publication_date).toLocaleDateString()}</span>
                </div>
              )}
              {book.language && (
                <div className="flex items-center text-muted-foreground">
                  <Globe className="h-4 w-4 mr-1" />
                  <span>{book.language}</span>
                </div>
              )}
              {book.pages && (
                <div className="flex items-center text-muted-foreground">
                  <BookOpen className="h-4 w-4 mr-1" />
                  <span>{book.pages} pages</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t">
        <div className="container">
          <div className="grid grid-cols-4 h-auto mt-0 bg-transparent">
            <button className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12 border-b-2 border-primary">
              Overview
            </button>
            <button className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12">
              Details
            </button>
            <button className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12">
              Reviews
            </button>
            <button className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12">
              Similar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 