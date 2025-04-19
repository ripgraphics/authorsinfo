import { Suspense } from "react"
import { getBooksWithMultipleAuthors } from "@/app/actions/admin-book-authors"
import { BooksWithMultipleAuthorsClient } from "./client"
import BooksWithMultipleAuthorsLoading from "./loading"

interface BooksWithMultipleAuthorsPageProps {
  searchParams: {
    page?: string
    pageSize?: string
  }
}

export default async function BooksWithMultipleAuthorsPage({ searchParams }: BooksWithMultipleAuthorsPageProps) {
  const page = Number(searchParams.page) || 1
  const pageSize = Number(searchParams.pageSize) || 20

  try {
    const { books, count, error } = await getBooksWithMultipleAuthors(page, pageSize)

    if (error) {
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Books With Multiple Authors</h1>
          <div className="p-4 bg-red-50 text-red-700 rounded-md">
            <p className="font-semibold">Error loading books:</p>
            <p>{error}</p>
          </div>
        </div>
      )
    }

    return (
      <div className="p-6">
        <Suspense fallback={<BooksWithMultipleAuthorsLoading />}>
          <BooksWithMultipleAuthorsClient
            initialBooks={books}
            totalBooks={count}
            initialPage={page}
            initialPageSize={pageSize}
          />
        </Suspense>
      </div>
    )
  } catch (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Books With Multiple Authors</h1>
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          <p className="font-semibold">Error loading books:</p>
          <p>{String(error)}</p>
        </div>
      </div>
    )
  }
}
