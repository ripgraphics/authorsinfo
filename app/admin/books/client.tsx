'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BookFilterSidebar } from '@/components/admin/book-filter-sidebar'
import { BookDataTable } from '@/components/admin/book-data-table'
import type { BookFilter } from '@/app/actions/admin-books'
import { Button } from '@/components/ui/button'
import { Filter } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Book {
  id: string
  title: string
  isbn13?: string
  isbn10?: string
  author?: { id: string; name: string }
  publisher?: { id: string; name: string }
  language?: string
  average_rating?: number
  cover_image?: { url: string; alt_text: string }
  [key: string]: any
}

interface BookManagementClientProps {
  books: Book[]
  totalBooks: number
  initialPage: number
  initialPageSize: number
  initialSortField: string
  initialSortDirection: 'asc' | 'desc'
  initialFilters: BookFilter
  genres: { id: string; name: string }[]
  formatTypes: { id: string; name: string }[]
  bindingTypes: { id: string; name: string }[]
  languages: string[]
}

export function BookManagementClient({
  books,
  totalBooks,
  initialPage,
  initialPageSize,
  initialSortField,
  initialSortDirection,
  initialFilters,
  genres,
  formatTypes,
  bindingTypes,
  languages,
}: BookManagementClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [sortField, setSortField] = useState(initialSortField)
  const [sortDirection, setSortDirection] = useState(initialSortDirection)
  const [filters, setFilters] = useState<BookFilter>(initialFilters)

  // Update URL when filters or pagination changes
  useEffect(() => {
    const params = new URLSearchParams()

    // Add pagination and sorting
    params.set('page', page.toString())
    params.set('pageSize', pageSize.toString())
    params.set('sort', sortField)
    params.set('direction', sortDirection)

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value))
      }
    })

    router.push(`/admin/books?${params.toString()}`)
  }, [page, pageSize, sortField, sortDirection, filters, router])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setSortField(field)
    setSortDirection(direction)
  }

  const handleApplyFilters = (newFilters: BookFilter) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page when filters change
  }

  const handleResetFilters = () => {
    setFilters({})
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <BookDataTable
        books={books}
        totalBooks={totalBooks}
        page={page}
        pageSize={pageSize}
        sortField={sortField}
        sortDirection={sortDirection}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        filterButton={
          <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Filter Books</DialogTitle>
              </DialogHeader>
              <BookFilterSidebar
                genres={genres}
                formatTypes={formatTypes}
                bindingTypes={bindingTypes}
                languages={languages}
                initialFilters={filters}
                onApplyFilters={(newFilters) => {
                  handleApplyFilters(newFilters)
                  setIsFilterOpen(false)
                }}
                onResetFilters={handleResetFilters}
              />
            </DialogContent>
          </Dialog>
        }
      />
    </div>
  )
}
