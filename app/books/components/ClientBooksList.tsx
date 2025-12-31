'use client'

import { useMemo } from 'react'
import { BookCard } from '@/components/book-card'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useSearchFilter } from '@/lib/hooks/use-search-filter'
import { bookSearchFields, bookSearchScorer, SearchableBook } from '@/lib/search/book-search-config'

interface Book {
  id: string
  title: string
  cover_image_url: string | null
  [key: string]: any
}

interface ClientBooksListProps {
  initialBooks: Book[]
  initialTotalCount: number
  page: number
  pageSize: number
  language?: string
  year?: string
  sort?: string
  searchValue: string // Current search input value (updates on every keystroke)
}

export function ClientBooksList({
  initialBooks,
  initialTotalCount,
  page,
  pageSize,
  language,
  year,
  sort,
  searchValue,
}: ClientBooksListProps) {
  // Use the reusable search filter hook
  const { filteredItems: filteredBooks } = useSearchFilter<SearchableBook>({
    items: initialBooks as SearchableBook[],
    searchValue,
    fields: bookSearchFields,
    requireAllWords: false, // Match any word
    customScorer: bookSearchScorer,
  })

  // Pagination logic
  const paginatedBooks = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredBooks.slice(startIndex, endIndex)
  }, [filteredBooks, page, pageSize])

  // Calculate pagination for filtered results
  const totalPages = Math.ceil(filteredBooks.length / pageSize)

  // Build pagination URLs
  const buildPageUrl = (pageNum: number) => {
    const params = new URLSearchParams()
    if (searchValue.trim()) params.set('search', searchValue.trim())
    if (language && language !== 'all') params.set('language', language)
    if (year && year !== 'all') params.set('year', year)
    if (sort) params.set('sort', sort)
    if (pageNum > 1) params.set('page', pageNum.toString())
    return `/books${params.toString() ? `?${params.toString()}` : ''}`
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {paginatedBooks.length > 0 ? (
          paginatedBooks.map((book) => (
            <BookCard
              key={book.id}
              id={book.id}
              title={book.title || ''}
              coverImageUrl={book.cover_image_url}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">
              {searchValue.trim()
                ? `No books found matching "${searchValue}". Try adjusting your search.`
                : 'No books found. Try adjusting your filters.'}
            </p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious href={buildPageUrl(page - 1)} />
              </PaginationItem>
            )}

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber =
                page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i

              if (pageNumber <= 0 || pageNumber > totalPages) return null

              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink href={buildPageUrl(pageNumber)} isActive={pageNumber === page}>
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              )
            })}

            {page < totalPages && (
              <PaginationItem>
                <PaginationNext href={buildPageUrl(page + 1)} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
