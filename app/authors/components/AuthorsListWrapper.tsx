'use client'

import { useState, useEffect } from 'react'
import { ClientAuthorsList } from './ClientAuthorsList'

interface Author {
  id: string
  name: string
  nationality?: string
  birth_date?: string
  photo_url?: string | null
  [key: string]: any
}

interface AuthorsListWrapperProps {
  initialAuthors: Author[]
  initialTotalCount: number
  page: number
  pageSize: number
  nationality?: string
  sort?: string
  initialSearch?: string
}

export function AuthorsListWrapper({
  initialAuthors,
  initialTotalCount,
  page,
  pageSize,
  nationality,
  sort,
  initialSearch = '',
}: AuthorsListWrapperProps) {
  // Track search value for instant client-side filtering
  const [searchValue, setSearchValue] = useState(initialSearch)

  return (
    <>
      <ClientAuthorsList
        initialAuthors={initialAuthors}
        initialTotalCount={initialTotalCount}
        page={page}
        pageSize={pageSize}
        nationality={nationality}
        sort={sort}
        searchValue={searchValue}
      />
      {/* Hidden component to receive search updates */}
      <SearchValueReceiver onSearchChange={setSearchValue} />
    </>
  )
}

// Component to receive search value from AuthorsFilters
function SearchValueReceiver({ onSearchChange }: { onSearchChange: (value: string) => void }) {
  // Use custom event to receive search updates
  useEffect(() => {
    const handleSearchUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string>
      onSearchChange(customEvent.detail)
    }

    window.addEventListener('searchValueUpdate', handleSearchUpdate as EventListener)
    return () => {
      window.removeEventListener('searchValueUpdate', handleSearchUpdate as EventListener)
    }
  }, [onSearchChange])

  return null
}

