'use client'

import { useState, useMemo } from 'react'
import { BookOpen, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ReusableSearch } from '@/components/ui/reusable-search'
import { BookCard } from '@/components/book-card'

export type BookStatusFilter = 'all' | 'read' | 'reading' | 'want'

export interface ProfileBook {
  id: string
  title: string
  coverImageUrl?: string | null
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'abandoned'
  rating?: number | null
  progress_percentage?: number | null
  author?: {
    id: string
    name: string
  } | null
}

export interface ProfileBooksListProps {
  books: ProfileBook[]
  title?: string
  emptyMessage?: string
  emptySearchMessage?: string
  showFilterStatus?: boolean
  className?: string
}

/**
 * Reusable component for displaying a filtered and searchable list of books on a profile page.
 * Supports filtering by reading status (Read, Reading, Want to Read) and searching by title/author.
 */
export function ProfileBooksList({
  books,
  title = 'My Books',
  emptyMessage = 'No books yet',
  emptySearchMessage = 'No books found matching your search',
  showFilterStatus = true,
  className,
}: ProfileBooksListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookStatusFilter>('all')

  // Map UI filter values to database status values
  const getStatusFromFilter = (filter: BookStatusFilter): string | null => {
    switch (filter) {
      case 'read':
        return 'completed'
      case 'reading':
        return 'in_progress'
      case 'want':
        return 'not_started'
      case 'all':
      default:
        return null
    }
  }

  // Filter books based on search query and status filter
  const filteredBooks = useMemo(() => {
    let result = [...books]

    // Filter by status
    if (statusFilter !== 'all') {
      const targetStatus = getStatusFromFilter(statusFilter)
      if (targetStatus) {
        result = result.filter((book) => book.status === targetStatus)
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter((book) => {
        const titleMatch = book.title?.toLowerCase().includes(query) || false
        const authorMatch = book.author?.name?.toLowerCase().includes(query) || false
        return titleMatch || authorMatch
      })
    }

    return result
  }, [books, searchQuery, statusFilter])

  const hasActiveFilters = searchQuery.trim() || statusFilter !== 'all'

  const handleClearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
  }

  return (
    <div className={className}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">{title}</h2>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <ReusableSearch
              paramName="search"
              placeholder="Search books..."
              debounceMs={300}
              updateUrl={false}
              onSearchChange={setSearchQuery}
              className="w-full"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full w-8 hover:bg-transparent"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as BookStatusFilter)}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Books</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="reading">Reading</SelectItem>
                <SelectItem value="want">Want to Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {showFilterStatus && hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span>
            Showing {filteredBooks.length} of {books.length} books
            {searchQuery && ` matching "${searchQuery}"`}
            {statusFilter !== 'all' && ` (${statusFilter === 'read' ? 'Read' : statusFilter === 'reading' ? 'Reading' : 'Want to Read'})`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={handleClearFilters}
          >
            Clear filters
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mt-6">
        {filteredBooks.length > 0 ? (
          filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              id={book.id}
              title={book.title}
              coverImageUrl={book.coverImageUrl || undefined}
              pages={(book as { pages?: number; page_count?: number }).pages ?? (book as { pages?: number; page_count?: number }).page_count ?? null}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {searchQuery.trim() || statusFilter !== 'all'
                ? emptySearchMessage
                : emptyMessage}
            </p>
            {searchQuery.trim() || statusFilter !== 'all' ? (
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search or filters
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">
                Start reading to see your books here
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

