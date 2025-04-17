import { Suspense } from "react"
import { getBooksWithoutAuthors, getAuthorBookStats } from "@/app/actions/admin-book-authors"
import { BookAuthorConnectionsClient } from "./client"
import BookAuthorConnectionsLoading from "./loading"
import { DebugStats } from "./debug"

interface BookAuthorConnectionsPageProps {
  searchParams: {
    page?: string
    pageSize?: string
  }
}

export default async function BookAuthorConnectionsPage({ searchParams }: BookAuthorConnectionsPageProps) {
  const page = Number(searchParams.page) || 1
  const pageSize = Number(searchParams.pageSize) || 20

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

    return (
      <div className="p-6">
        <Suspense fallback={<BookAuthorConnectionsLoading />}>
          <BookAuthorConnectionsClient
            initialBooks={books}
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
