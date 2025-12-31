'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BookOpen, Users } from 'lucide-react'

// Helper function to safely truncate IDs
function truncateId(id: string | number | null | undefined): string {
  if (id === null || id === undefined) return 'N/A'
  const strId = String(id)
  return strId.length > 8 ? `${strId.substring(0, 8)}...` : strId
}

interface Book {
  id: string | number
  title: string
  isbn10?: string
  isbn13?: string
  cover_image?: {
    id: string
    url: string
    alt_text?: string
  }
}

interface BooksWithMultipleAuthorsClientProps {
  initialBooks: Book[]
  totalBooks: number
  initialPage: number
  initialPageSize: number
}

export function BooksWithMultipleAuthorsClient({
  initialBooks,
  totalBooks,
  initialPage,
  initialPageSize,
}: BooksWithMultipleAuthorsClientProps) {
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>(initialBooks)
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    router.push(`/admin/books-with-multiple-authors?page=${newPage}&pageSize=${pageSize}`)
  }

  const totalPages = Math.ceil(totalBooks / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Books With Multiple Authors</h1>
        <Button
          variant="outline"
          onClick={() => router.push('/admin/book-author-connections')}
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          Back to Book-Author Connections
        </Button>
      </div>

      {/* Books Table */}
      <Card>
        <CardHeader>
          <CardTitle>Books With Multiple Authors</CardTitle>
          <CardDescription>These books have more than one author assigned to them</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>ISBN-10</TableHead>
                <TableHead>ISBN-13</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {books.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No books found with multiple authors
                  </TableCell>
                </TableRow>
              ) : (
                books.map((book) => (
                  <TableRow key={String(book.id)}>
                    <TableCell className="font-mono">{truncateId(book.id)}</TableCell>
                    <TableCell>{book.title || 'Untitled'}</TableCell>
                    <TableCell>{book.isbn10 || '—'}</TableCell>
                    <TableCell>{book.isbn13 || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/books/${book.id}`)}
                        className="flex items-center gap-1"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        View Book
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex justify-center py-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
