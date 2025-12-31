'use client'

import { useState, useEffect } from 'react'
import { ClientBooksList } from './ClientBooksList'

interface Book {
  id: string
  title: string
  cover_image_url: string | null
  [key: string]: any
}

interface BooksListWrapperProps {
  initialBooks: Book[]
  initialTotalCount: number
  page: number
  pageSize: number
  language?: string
  year?: string
  sort?: string
  initialSearch?: string
}

export function BooksListWrapper({
  initialBooks,
  initialTotalCount,
  page,
  pageSize,
  language,
  year,
  sort,
  initialSearch = '',
}: BooksListWrapperProps) {
  // Track search value for instant client-side filtering
  const [searchValue, setSearchValue] = useState(initialSearch)

  return (
    <>
      <ClientBooksList
        initialBooks={initialBooks}
        initialTotalCount={initialTotalCount}
        page={page}
        pageSize={pageSize}
        language={language}
        year={year}
        sort={sort}
        searchValue={searchValue}
      />
      {/* Hidden component to receive search updates */}
      <SearchValueReceiver onSearchChange={setSearchValue} />
    </>
  )
}

// Component to receive search value from InteractiveControls
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
