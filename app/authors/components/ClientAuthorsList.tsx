'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useSearchFilter } from '@/lib/hooks/use-search-filter'
import { authorSearchFields, authorSearchScorer, SearchableAuthor } from '@/lib/search/author-search-config'

interface Author {
  id: string
  name: string
  nationality?: string
  birth_date?: string
  photo_url?: string | null
  [key: string]: any
}

interface ClientAuthorsListProps {
  initialAuthors: Author[]
  initialTotalCount: number
  page: number
  pageSize: number
  nationality?: string
  sort?: string
  searchValue: string // Current search input value (updates on every keystroke)
}

export function ClientAuthorsList({
  initialAuthors,
  initialTotalCount,
  page,
  pageSize,
  nationality,
  sort,
  searchValue,
}: ClientAuthorsListProps) {
  // Use the reusable search filter hook
  const { filteredItems: filteredAuthors } = useSearchFilter<SearchableAuthor>({
    items: initialAuthors as SearchableAuthor[],
    searchValue,
    fields: authorSearchFields,
    requireAllWords: false, // Match any word
    customScorer: authorSearchScorer,
  })

  // Apply nationality filter client-side if provided
  const nationalityFilteredAuthors = useMemo(() => {
    if (!nationality || nationality === 'all') {
      return filteredAuthors
    }
    return filteredAuthors.filter((author) => author.nationality === nationality)
  }, [filteredAuthors, nationality])

  // Apply sorting client-side
  const sortedAuthors = useMemo(() => {
    const sorted = [...nationalityFilteredAuthors]
    
    if (sort === 'name_asc') {
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    } else if (sort === 'name_desc') {
      sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''))
    } else if (sort === 'birth_date_asc') {
      sorted.sort((a, b) => {
        const dateA = a.birth_date ? new Date(a.birth_date).getTime() : 0
        const dateB = b.birth_date ? new Date(b.birth_date).getTime() : 0
        return dateA - dateB || (a.name || '').localeCompare(b.name || '')
      })
    } else if (sort === 'birth_date_desc') {
      sorted.sort((a, b) => {
        const dateA = a.birth_date ? new Date(a.birth_date).getTime() : 0
        const dateB = b.birth_date ? new Date(b.birth_date).getTime() : 0
        return dateB - dateA || (a.name || '').localeCompare(b.name || '')
      })
    } else {
      // Default: name_asc
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }
    
    return sorted
  }, [nationalityFilteredAuthors, sort])

  // Pagination logic
  const paginatedAuthors = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    return sortedAuthors.slice(startIndex, endIndex)
  }, [sortedAuthors, page, pageSize])

  // Calculate pagination for filtered results
  const totalPages = Math.ceil(sortedAuthors.length / pageSize)

  // Build pagination URLs
  const buildPageUrl = (pageNum: number) => {
    const params = new URLSearchParams()
    if (searchValue.trim()) params.set('search', searchValue.trim())
    if (nationality && nationality !== 'all') params.set('nationality', nationality)
    if (sort) params.set('sort', sort)
    if (pageNum > 1) params.set('page', pageNum.toString())
    return `/authors${params.toString() ? `?${params.toString()}` : ''}`
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {paginatedAuthors.length > 0 ? (
          paginatedAuthors.map((author) => (
            <Link href={`/authors/${author.id}`} key={author.id} className="block">
              <Card className="overflow-hidden h-full transition-transform hover:scale-105">
                <div className="relative w-full" style={{ aspectRatio: '1/1' }}>
                  {author.photo_url ? (
                    <Image
                      src={author.photo_url}
                      alt={author.name || "Author"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-1">{author.name}</h3>
                  {author.nationality && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{author.nationality}</p>
                  )}
                  {author.birth_date && <p className="text-xs text-muted-foreground mt-1">{author.birth_date}</p>}
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">
              {searchValue.trim()
                ? `No authors found matching "${searchValue}". Try adjusting your search.`
                : 'No authors found. Try adjusting your filters.'}
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
                page <= 3
                  ? i + 1
                  : page >= totalPages - 2
                    ? totalPages - 4 + i
                    : page - 2 + i

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

