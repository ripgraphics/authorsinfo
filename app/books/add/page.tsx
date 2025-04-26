import { notFound, redirect } from "next/navigation"
import Image from "next/image"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getBookByISBN } from "@/lib/isbndb"
import { addBookFromISBNDB } from "@/app/actions/add-book"
import { BookOpen } from "lucide-react"

interface AddBookPageProps {
  searchParams: {
    isbn?: string
  }
}

export default async function AddBookPage({ searchParams }: AddBookPageProps) {
  const { isbn } = searchParams

  // If no ISBN is provided, show a form to enter one
  if (!isbn) {
    return (
      <div className="min-h-screen flex flex-col">
        <PageHeader />
        <main className="flex-1 book-page container py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Add a New Book</h1>
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
        </main>
      </div>
    )
  }

  // Fetch book data from ISBNDB
  const bookData = await getBookByISBN(isbn)

  if (!bookData) {
    notFound()
    return
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
    <div className="min-h-screen flex flex-col">
      <PageHeader />
      <main className="flex-1 book-page container py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Add Book to Library</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Book Cover */}
            <div>
              <Card className="overflow-hidden">
                {bookImage ? (
                  <div className="w-full h-full">
                    <Image
                      src={bookImage || "/placeholder.svg"}
                      alt={bookTitle}
                      width={400}
                      height={600}
                      className="w-full aspect-[2/3] object-cover"
                    />
                  </div>
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
                  <CardTitle>{bookTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bookAuthors && bookAuthors.length > 0 && (
                    <div>
                      <h3 className="font-medium">Author</h3>
                      <p className="text-muted-foreground">{bookAuthors.join(", ")}</p>
                    </div>
                  )}

                  {bookPublisher && (
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

                  {bookSynopsis && (
                    <div>
                      <h3 className="font-medium">Synopsis</h3>
                      <p className="text-muted-foreground">{bookSynopsis}</p>
                    </div>
                  )}

                  <form action={addBook}>
                    <Button type="submit" className="w-full mt-4">
                      Add to Library
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
