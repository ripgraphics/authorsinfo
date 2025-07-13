import { notFound, redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getBookByISBN } from "@/lib/isbndb"
import { addBookFromISBNDB } from "@/app/actions/add-book"
import { BookOpen, CheckCircle } from "lucide-react"
import { supabaseAdmin } from "@/lib/supabase/server"
import { cleanSynopsis } from "@/utils/textUtils"

interface AddBookPageProps {
  searchParams: {
    isbn?: string
  }
}

export default async function AddBookPage({ searchParams }: AddBookPageProps) {
  const params = await searchParams
  const { isbn } = params

  // If no ISBN is provided, show a form to enter one
  if (!isbn) {
    return (
      <div className="space-y-6">
        <div className="py-6">
          <h1 className="text-3xl font-bold tracking-tight">Add a New Book</h1>
          <p className="text-muted-foreground mt-2">Search for books or provide an ISBN number to add to your library</p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Enter Book Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">To add a book, please search for it first or provide an ISBN number.</p>
              <Button asChild>
                <a href="/search">Search for Books</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Fetch book data from ISBNDB
  const bookData = await getBookByISBN(isbn)

  if (!bookData) {
    notFound()
    return
  }

  // Check if book already exists in database and get full details
  let existingBook = null
  let otherBooksByAuthor = []
  let otherBooksByPublisher = []
  
  if (bookData.isbn) {
    const { data } = await supabaseAdmin
      .from("books")
      .select(`
        id,
        title,
        cover_image_id,
        cover_image:cover_image_id(url, alt_text),
        author_id,
        author:author_id(id, name),
        publisher_id,
        publisher:publisher_id(id, name)
      `)
      .eq("isbn10", bookData.isbn)
      .single()
    if (data) {
      existingBook = data
      
      // Fetch other books by the same author
      if (data.author_id) {
        const { data: authorBooks } = await supabaseAdmin
          .from("books")
          .select(`
            id,
            title,
            cover_image_id,
            cover_image:cover_image_id(url, alt_text)
          `)
          .eq("author_id", data.author_id)
          .neq("id", data.id)
          .limit(6)
        if (authorBooks) otherBooksByAuthor = authorBooks
      }
      
      // Fetch other books by the same publisher
      if (data.publisher_id) {
        const { data: publisherBooks } = await supabaseAdmin
          .from("books")
          .select(`
            id,
            title,
            cover_image_id,
            cover_image:cover_image_id(url, alt_text)
          `)
          .eq("publisher_id", data.publisher_id)
          .neq("id", data.id)
          .limit(6)
        if (publisherBooks) otherBooksByPublisher = publisherBooks
      }
    }
  } else if (bookData.isbn13) {
    const { data } = await supabaseAdmin
      .from("books")
      .select(`
        id,
        title,
        cover_image_id,
        cover_image:cover_image_id(url, alt_text),
        author_id,
        author:author_id(id, name),
        publisher_id,
        publisher:publisher_id(id, name)
      `)
      .eq("isbn13", bookData.isbn13)
      .single()
    if (data) {
      existingBook = data
      
      // Fetch other books by the same author
      if (data.author_id) {
        const { data: authorBooks } = await supabaseAdmin
          .from("books")
          .select(`
            id,
            title,
            cover_image_id,
            cover_image:cover_image_id(url, alt_text)
          `)
          .eq("author_id", data.author_id)
          .neq("id", data.id)
          .limit(6)
        if (authorBooks) otherBooksByAuthor = authorBooks
      }
      
      // Fetch other books by the same publisher
      if (data.publisher_id) {
        const { data: publisherBooks } = await supabaseAdmin
          .from("books")
          .select(`
            id,
            title,
            cover_image_id,
            cover_image:cover_image_id(url, alt_text)
          `)
          .eq("publisher_id", data.publisher_id)
          .neq("id", data.id)
          .limit(6)
        if (publisherBooks) otherBooksByPublisher = publisherBooks
      }
    }
  }

  // Destructure fields for later use (ensures non-nullable)
  const {
    title: bookTitle,
    isbn: bookIsbn,
    isbn13: bookIsbn13,
    authors: bookAuthors,
    publisher: bookPublisher,
    publish_date: bookPublishDate,
    image: bookImage,
    synopsis: bookSynopsis,
  } = bookData

  // Clean the synopsis for display
  const cleanedSynopsis = bookSynopsis ? cleanSynopsis(bookSynopsis) : null

  // Function to handle adding the book to the database
  async function addBook(formData: FormData) {
    "use server"

    const result = await addBookFromISBNDB({
      title: bookTitle,
      isbn: bookIsbn,
      isbn13: bookIsbn13,
      authors: bookAuthors,
      publisher: bookPublisher,
      publish_date: bookPublishDate,
      image: bookImage,
      synopsis: bookSynopsis,
    })

    if (result.success && result.bookId) {
      return redirect(`/books/${result.bookId}`)
    }

    return { error: result.error || "Failed to add book" }
  }

  return (
    <div className="space-y-6">
      <div className="py-6">
        <h1 className="text-3xl font-bold tracking-tight">Add Book to Library</h1>
        <p className="text-muted-foreground mt-2">Review the book details and add it to your library</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Book Cover */}
          <div>
            <Card className="overflow-hidden">
              {existingBook && existingBook.cover_image?.url ? (
                <Link href={`/books/${existingBook.id}`}>
                  <div className="w-full h-full cursor-pointer hover:opacity-90 transition-opacity">
                    <Image
                      src={existingBook.cover_image.url}
                      alt={existingBook.cover_image.alt_text || existingBook.title}
                      width={400}
                      height={600}
                      className="w-full aspect-[2/3] object-cover"
                    />
                  </div>
                </Link>
              ) : (
                <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </Card>
          </div>

          {/* Book Details */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {existingBook ? (
                    <Link 
                      href={`/books/${existingBook.id}`}
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
                      {existingBook.title}
                    </Link>
                  ) : (
                    bookTitle
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {existingBook?.author ? (
                  <div>
                    <h3 className="font-medium">Author</h3>
                    <Link 
                      href={`/authors/${existingBook.author.id}`}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {existingBook.author.name}
                    </Link>
                  </div>
                ) : bookAuthors && bookAuthors.length > 0 && (
                  <div>
                    <h3 className="font-medium">Author</h3>
                    <p className="text-muted-foreground">{bookAuthors.join(", ")}</p>
                  </div>
                )}

                {existingBook?.publisher ? (
                  <div>
                    <h3 className="font-medium">Publisher</h3>
                    <Link 
                      href={`/publishers/${existingBook.publisher.id}`}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {existingBook.publisher.name}
                    </Link>
                  </div>
                ) : bookPublisher && (
                  <div>
                    <h3 className="font-medium">Publisher</h3>
                    <p className="text-muted-foreground">{bookPublisher}</p>
                  </div>
                )}

                {bookPublishDate && (
                  <div>
                    <h3 className="font-medium">Publication Date</h3>
                    <p className="text-muted-foreground">{bookPublishDate}</p>
                  </div>
                )}

                {bookIsbn && (
                  <div>
                    <h3 className="font-medium">ISBN</h3>
                    <p className="text-muted-foreground">{bookIsbn}</p>
                  </div>
                )}

                {bookIsbn13 && (
                  <div>
                    <h3 className="font-medium">ISBN-13</h3>
                    <p className="text-muted-foreground">{bookIsbn13}</p>
                  </div>
                )}

                {cleanedSynopsis && (
                  <div>
                    <h3 className="font-medium">Synopsis</h3>
                    <div 
                      className="text-muted-foreground prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: cleanedSynopsis }}
                    />
                  </div>
                )}

                {existingBook ? (
                  <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-green-800 font-medium">Book Already in System</p>
                      <p className="text-green-600 text-sm">This book is already in our system.</p>
                    </div>
                  </div>
                ) : (
                  <form action={addBook}>
                    <Button type="submit" className="w-full mt-4">
                      Add to Library
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Books Sections */}
        {existingBook && (otherBooksByAuthor.length > 0 || otherBooksByPublisher.length > 0) && (
          <div className="space-y-8">
            {/* Other Books by Author */}
            {otherBooksByAuthor.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  Other Books by {existingBook.author?.name}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {otherBooksByAuthor.map((book) => (
                    <Link key={book.id} href={`/books/${book.id}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="aspect-[2/3] relative">
                          {book.cover_image?.url ? (
                            <Image
                              src={book.cover_image.url}
                              alt={book.cover_image.alt_text || book.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <BookOpen className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-3">
                          <p className="text-sm font-medium line-clamp-2">{book.title}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Other Books by Publisher */}
            {otherBooksByPublisher.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  Other Books by {existingBook.publisher?.name}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {otherBooksByPublisher.map((book) => (
                    <Link key={book.id} href={`/books/${book.id}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="aspect-[2/3] relative">
                          {book.cover_image?.url ? (
                            <Image
                              src={book.cover_image.url}
                              alt={book.cover_image.alt_text || book.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <BookOpen className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-3">
                          <p className="text-sm font-medium line-clamp-2">{book.title}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
