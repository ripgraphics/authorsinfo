import Link from 'next/link'
import { BookOpen, User, FileText, Tag, Calendar } from 'lucide-react'

export default function RetrieveBooksPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Book Retrieval Options</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/admin/new-books" className="border rounded-lg p-4 hover:bg-gray-100">
          <BookOpen className="h-8 w-8 mb-4" />
          <h2 className="text-lg font-semibold">Newest Books</h2>
          <p className="text-gray-500">Fetch books added since last run, in batches.</p>
        </Link>

        <Link href="/admin/fetch-by-author" className="border rounded-lg p-4 hover:bg-gray-100">
          <User className="h-8 w-8 mb-4" />
          <h2 className="text-lg font-semibold">Books by Author</h2>
          <p className="text-gray-500">
            Fetch books for authors in your system, batch or selected.
          </p>
        </Link>

        <Link href="/admin/fetch-by-isbn" className="border rounded-lg p-4 hover:bg-gray-100">
          <FileText className="h-8 w-8 mb-4" />
          <h2 className="text-lg font-semibold">Fetch by ISBN</h2>
          <p className="text-gray-500">Retrieve books by one or more ISBN numbers.</p>
        </Link>

        <Link href="/admin/fetch-by-title" className="border rounded-lg p-4 hover:bg-gray-100">
          <Tag className="h-8 w-8 mb-4" />
          <h2 className="text-lg font-semibold">Fetch by Title</h2>
          <p className="text-gray-500">Search and fetch books by title keywords.</p>
        </Link>

        <Link href="/admin/fetch-by-year" className="border rounded-lg p-4 hover:bg-gray-100">
          <Calendar className="h-8 w-8 mb-4" />
          <h2 className="text-lg font-semibold">Fetch by Publication Date</h2>
          <p className="text-gray-500">Retrieve books published in a specific year or month.</p>
        </Link>
      </div>
    </div>
  )
}
