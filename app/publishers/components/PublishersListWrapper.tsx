'use client'

import { useState, useEffect } from 'react'
import { ClientPublishersList } from './ClientPublishersList'

interface Publisher {
  id: number
  name: string
  country_id?: number | null
  country_details?: {
    id: number
    name: string
    code: string
  }
  publisher_image?: {
    url: string
  }
  [key: string]: any
}

interface PublishersListWrapperProps {
  initialPublishers: Publisher[]
  initialTotalCount: number
  page: number
  pageSize: number
  location?: string
  sort?: string
  initialSearch?: string
}

export function PublishersListWrapper({
  initialPublishers,
  initialTotalCount,
  page,
  pageSize,
  location,
  sort,
  initialSearch = '',
}: PublishersListWrapperProps) {
  // Track search value for instant client-side filtering
  const [searchValue, setSearchValue] = useState(initialSearch)

  return (
    <>
      <ClientPublishersList
        initialPublishers={initialPublishers}
        initialTotalCount={initialTotalCount}
        page={page}
        pageSize={pageSize}
        location={location}
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

