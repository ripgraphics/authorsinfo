import { useState, useEffect } from 'react'

/**
 * Hook to manage search state with URL synchronization
 * Works with ReusableSearch component for instant results
 */
export function useSearchState(initialValue: string = '') {
  const [searchValue, setSearchValue] = useState(initialValue)

  // Listen for search updates from ReusableSearch component
  useEffect(() => {
    const handleSearchUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string>
      setSearchValue(customEvent.detail)
    }

    window.addEventListener('searchValueUpdate', handleSearchUpdate as EventListener)
    return () => {
      window.removeEventListener('searchValueUpdate', handleSearchUpdate as EventListener)
    }
  }, [])

  return [searchValue, setSearchValue] as const
}

