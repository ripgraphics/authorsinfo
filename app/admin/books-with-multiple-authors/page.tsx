import { Suspense } from "react"
import { getBooksWithMultipleAuthors } from "@/app/actions/admin-book-authors"
import { BooksWithMultipleAuthorsClient } from "./client"
import BooksWithMultipleAuthorsLoading from "./loading"

interface BooksWithMultipleAuthorsPageProps {
  searchParams: Promise<{
    page?: string
    pageSize?: string
  }>
}

export default async function BooksWithMultipleAuthorsPage({ searchParams }: BooksWithMultipleAuthorsPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 20

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

    // Transform books to handle cover_image array -> single object
    const transformedBooks = books.map((book: any) => ({
      ...book,
      cover_image: Array.isArray(book.cover_image) && book.cover_image.length > 0 
        ? book.cover_image[0] 
        : book.cover_image || undefined
    }))

    return (
      <div className="p-6">
        <Suspense fallback={<BooksWithMultipleAuthorsLoading />}>
          <BooksWithMultipleAuthorsClient
            initialBooks={transformedBooks}
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
