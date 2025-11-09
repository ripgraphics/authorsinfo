import { Suspense } from "react"
import { getBooksWithoutAuthors, getAuthorBookStats } from "@/app/actions/admin-book-authors"
import { BookAuthorConnectionsClient, ImportBooksButton } from "./client"
import BookAuthorConnectionsLoading from "./loading"
import { DebugStats } from "./debug"
import { importNewestBooks } from "@/app/actions/bulk-import-books"

interface BookAuthorConnectionsPageProps {
  searchParams: Promise<{
    page?: string
    pageSize?: string
  }>
}

export default async function BookAuthorConnectionsPage({ searchParams }: BookAuthorConnectionsPageProps) {
  // Await searchParams before accessing its properties
  const params = await searchParams
  const page = params?.page ? Number(params.page) : 1
  const pageSize = params?.pageSize ? Number(params.pageSize) : 20

  const handleImport = async () => {
    try {
      await importNewestBooks()
      alert("Books imported successfully!")
    } catch (error) {
      console.error("Error importing books:", error)
      alert("Failed to import books.")
    }
  }

  try {
    // Fetch books and stats in parallel
    const [booksResult, statsResult] = await Promise.all([getBooksWithoutAuthors(page, pageSize), getAuthorBookStats()])

    const { books, count, error } = booksResult
    const { booksWithoutAuthors, authorsWithoutBooks, booksWithMultipleAuthors, totalBooks, totalAuthors } = statsResult

    if (error) {
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Book-Author Connections</h1>
          <div className="p-4 bg-red-50 text-red-700 rounded-md">
            <p className="font-semibold">Error loading books:</p>
            <p>{error}</p>
          </div>
        </div>
      )
    }

    // Transform books to match the expected Book interface
    const transformedBooks = books.map(book => ({
      ...book,
      cover_image: book.cover_image?.[0] || undefined // Take the first cover image or undefined if none
    }))

    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Book-Author Connections</h1>
        <ImportBooksButton />
        <Suspense fallback={<BookAuthorConnectionsLoading />}>
          <BookAuthorConnectionsClient
            initialBooks={transformedBooks}
            totalBooks={count}
            initialPage={page}
            initialPageSize={pageSize}
            stats={{
              booksWithoutAuthors,
              authorsWithoutBooks,
              booksWithMultipleAuthors,
              totalBooks,
              totalAuthors,
            }}
          />
          <DebugStats />
        </Suspense>
      </div>
    )
  } catch (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Book-Author Connections</h1>
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          <p className="font-semibold">Error loading books:</p>
          <p>{String(error)}</p>
        </div>
      </div>
    )
  }
}
