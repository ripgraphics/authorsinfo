import { PageHeader } from "@/components/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { searchBooks } from "@/lib/isbndb"
import { getRecentBooks, getRecentAuthors, getRecentPublishers } from "../actions/data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { BookOpen, User, Building, Plus } from "lucide-react"

interface SearchPageProps {
  searchParams: {
    q?: string
    type?: string
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || ""
  const type = searchParams.type || "books"

  // For demonstration purposes, we'll just show recent items
  // In a real app, you would implement actual search functionality
  let books = []
  let authors = []
  let publishers = []
  let isbndbBooks = []

  if (query) {
    // Search in ISBNDB
    if (type === "books" || type === "all") {
      isbndbBooks = await searchBooks(query)
    }

    // In a real app, you would search your Supabase database here
    books = await getRecentBooks(12)
    authors = await getRecentAuthors(12)
    publishers = await getRecentPublishers(12)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader />
      <main className="flex-1 container py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Search Results</h1>
            {query ? (
              <p className="text-muted-foreground">Showing results for "{query}"</p>
            ) : (
              <p className="text-muted-foreground">Enter a search term to find books, authors, and publishers</p>
            )}
          </div>

          {query ? (
            <Tabs defaultValue={type} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" asChild>
                  <Link href={`/search?q=${query}&type=all`}>All</Link>
                </TabsTrigger>
                <TabsTrigger value="books" asChild>
                  <Link href={`/search?q=${query}&type=books`}>Books</Link>
                </TabsTrigger>
                <TabsTrigger value="authors" asChild>
                  <Link href={`/search?q=${query}&type=authors`}>Authors</Link>
                </TabsTrigger>
                <TabsTrigger value="publishers" asChild>
                  <Link href={`/search?q=${query}&type=publishers`}>Publishers</Link>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6 space-y-8">
                {/* ISBNDB Results */}
                {isbndbBooks.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">ISBNDB Results</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {isbndbBooks.slice(0, 4).map((book, index) => (
                        <Link
                          key={index}
                          href={`/books/add?isbn=${book.isbn13 || book.isbn}`}
                          className="block relative group"
                        >
                          <Card className="overflow-hidden h-full transition-transform hover:scale-105">
                            {/* Image container with 2:3 aspect ratio */}
                            <div className="relative w-full" style={{ aspectRatio: "2/3" }}>
                              {book.image ? (
                                <Image
                                  src={book.image || "/placeholder.svg"}
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
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button className="bg-blue-600 hover:bg-blue-700">
                              <Plus className="h-4 w-4 mr-2" />
                              Add to Library
                            </Button>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Books */}
                {books.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Books</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {books.slice(0, 4).map((book) => (
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
                      ))}
                    </div>
                    {books.length > 4 && (
                      <div className="text-center mt-4">
                        <Button variant="outline" asChild>
                          <Link href={`/search?q=${query}&type=books`}>View All Books</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Authors */}
                {authors.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Authors</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {authors.slice(0, 4).map((author) => (
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
                      ))}
                    </div>
                    {authors.length > 4 && (
                      <div className="text-center mt-4">
                        <Button variant="outline" asChild>
                          <Link href={`/search?q=${query}&type=authors`}>View All Authors</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Publishers */}
                {publishers.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Publishers</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {publishers.slice(0, 4).map((publisher) => (
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
                      ))}
                    </div>
                    {publishers.length > 4 && (
                      <div className="text-center mt-4">
                        <Button variant="outline" asChild>
                          <Link href={`/search?q=${query}&type=publishers`}>View All Publishers</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {isbndbBooks.length === 0 && books.length === 0 && authors.length === 0 && publishers.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No results found for "{query}"</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="books" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                  {/* ISBNDB Results */}
                  {isbndbBooks.map((book, index) => (
                    <Link
                      key={`isbndb-${index}`}
                      href={`/books/add?isbn=${book.isbn13 || book.isbn}`}
                      className="block relative group"
                    >
                      <Card className="overflow-hidden h-full transition-transform hover:scale-105">
                        {/* Image container with 2:3 aspect ratio */}
                        <div className="relative w-full" style={{ aspectRatio: "2/3" }}>
                          {book.image ? (
                            <Image
                              src={book.image || "/placeholder.svg"}
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
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Add to Library
                        </Button>
                      </div>
                    </Link>
                  ))}

                  {/* Books from Supabase */}
                  {books.map((book) => (
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
                  ))}

                  {isbndbBooks.length === 0 && books.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <p className="text-muted-foreground">No books found for "{query}"</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="authors" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
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
                      <p className="text-muted-foreground">No authors found for "{query}"</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="publishers" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
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
                      <p className="text-muted-foreground">No publishers found for "{query}"</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Enter a search term to find books, authors, and publishers</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
