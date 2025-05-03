import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getRecentBooks, getRecentAuthors, getRecentPublishers } from "./actions/data"
import { BookOpen, User, Building } from "lucide-react"
import { PageContainer } from "@/components/page-container"

async function RecentBooks() {
  const books = await getRecentBooks(6)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {books.length > 0 ? (
          books.map((book) => (
            <Link href={`/books/${book.id}`} key={book.id} className="block">
              <Card className="overflow-hidden h-full transition-transform hover:scale-105">
                {/* Image container with 2:3 aspect ratio */}
                <div className="relative w-full" style={{ aspectRatio: "2/3" }}>
                  {book.cover_image_url ? (
                    <Image
                      src={book.cover_image_url || "/placeholder.svg"}
                      alt={book.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-medium text-sm line-clamp-1">{book.title}</h3>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No books found in the database.</p>
          </div>
        )}
      </div>
      <div className="text-center">
        <Button asChild>
          <Link href="/books">View All Books</Link>
        </Button>
      </div>
    </div>
  )
}

async function RecentAuthors() {
  const authors = await getRecentAuthors(6)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {authors.length > 0 ? (
          authors.map((author) => (
            <Link href={`/authors/${author.id}`} key={author.id} className="block">
              <Card className="overflow-hidden h-full transition-transform hover:scale-105">
                <div className="relative aspect-square w-full">
                  {author.photo_url ? (
                    <Image
                      src={author.photo_url || "/placeholder.svg"}
                      alt={author.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-medium text-sm line-clamp-1">{author.name}</h3>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No authors found in the database.</p>
          </div>
        )}
      </div>
      <div className="text-center">
        <Button asChild>
          <Link href="/authors">View All Authors</Link>
        </Button>
      </div>
    </div>
  )
}

async function RecentPublishers() {
  const publishers = await getRecentPublishers(6)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {publishers.length > 0 ? (
          publishers.map((publisher) => (
            <Link href={`/publishers/${publisher.id}`} key={publisher.id} className="block">
              <Card className="overflow-hidden h-full transition-transform hover:scale-105">
                <div className="relative aspect-[3/2] w-full">
                  {publisher.logo_url ? (
                    <Image
                      src={publisher.logo_url || "/placeholder.svg"}
                      alt={publisher.name}
                      fill
                      className="object-contain p-4"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Building className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-medium text-sm line-clamp-1">{publisher.name}</h3>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No publishers found in the database.</p>
          </div>
        )}
      </div>
      <div className="text-center">
        <Button asChild>
          <Link href="/publishers">View All Publishers</Link>
        </Button>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <PageContainer
      title="Welcome to Author's Info"
      description="Discover books, authors, and publishers in one place"
    >
      <div className="space-y-8">
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/books">
              <BookOpen className="mr-2 h-5 w-5" />
              All Books
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/authors">
              <User className="mr-2 h-5 w-5" />
              All Authors
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/publishers">
              <Building className="mr-2 h-5 w-5" />
              All Publishers
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="books" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="books">Books</TabsTrigger>
            <TabsTrigger value="authors">Authors</TabsTrigger>
            <TabsTrigger value="publishers">Publishers</TabsTrigger>
          </TabsList>

          <TabsContent value="books" className="mt-6">
            <RecentBooks />
          </TabsContent>

          <TabsContent value="authors" className="mt-6">
            <RecentAuthors />
          </TabsContent>

          <TabsContent value="publishers" className="mt-6">
            <RecentPublishers />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  )
}
