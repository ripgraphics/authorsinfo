'use client'

import { useMemo } from 'react'
import { PublisherAvatar } from '@/components/publisher-avatar'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useSearchFilter } from '@/lib/hooks/use-search-filter'
import {
  publisherSearchFields,
  publisherSearchScorer,
  SearchablePublisher,
} from '@/lib/search/publisher-search-config'

interface Publisher {
  id: number
  name: string
  country_id?: number | null
  country_details?: {
    id: number
    name: string
    code: string
  }
  founded_year?: number
  publisher_image?: {
    url: string
  }
  [key: string]: any
}

interface ClientPublishersListProps {
  initialPublishers: Publisher[]
  initialTotalCount: number
  page: number
  pageSize: number
  location?: string
  sort?: string
  searchValue: string // Current search input value (updates on every keystroke)
}

export function ClientPublishersList({
  initialPublishers,
  initialTotalCount,
  page,
  pageSize,
  location,
  sort,
  searchValue,
}: ClientPublishersListProps) {
  // Use the reusable search filter hook
  const { filteredItems: filteredPublishers } = useSearchFilter<SearchablePublisher>({
    items: initialPublishers as unknown as SearchablePublisher[],
    searchValue,
    fields: publisherSearchFields,
    requireAllWords: false, // Match any word
    customScorer: publisherSearchScorer,
  })

  // Apply location filter client-side if provided
  const locationFilteredPublishers = useMemo(() => {
    if (!location || location === 'all') {
      return filteredPublishers
    }
    // Filter by location (country name)
    return filteredPublishers.filter((publisher) => {
      const pub = publisher as any
      return pub.country_details?.name === location || pub.location === location
    })
  }, [filteredPublishers, location])

  // Apply sorting client-side
  const sortedPublishers = useMemo(() => {
    const sorted = [...locationFilteredPublishers]

    if (sort === 'name_asc') {
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    } else if (sort === 'name_desc') {
      sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''))
    } else {
      // Default: name_asc
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }

    return sorted
  }, [locationFilteredPublishers, sort])

  // Pagination logic
  const paginatedPublishers = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    return sortedPublishers.slice(startIndex, endIndex)
  }, [sortedPublishers, page, pageSize])

  // Calculate pagination for filtered results
  const totalPages = Math.ceil(sortedPublishers.length / pageSize)

  // Build pagination URLs
  const buildPageUrl = (pageNum: number) => {
    const params = new URLSearchParams()
    if (searchValue.trim()) params.set('search', searchValue.trim())
    if (location && location !== 'all') params.set('location', location)
    if (sort) params.set('sort', sort)
    if (pageNum > 1) params.set('page', pageNum.toString())
    return `/publishers${params.toString() ? `?${params.toString()}` : ''}`
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {paginatedPublishers.length > 0 ? (
          paginatedPublishers.map((publisher) => (
            <PublisherAvatar
              key={publisher.id}
              publisherId={publisher.id}
              name={publisher.name || 'Unknown Publisher'}
              avatarUrl={(publisher as any).publisher_image?.url}
              size="md"
              showName={true}
              linkToProfile={true}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">
              {searchValue.trim()
                ? `No publishers found matching "${searchValue}". Try adjusting your search.`
                : 'No publishers found. Try adjusting your filters.'}
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
