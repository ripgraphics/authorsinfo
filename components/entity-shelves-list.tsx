'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ContentSection } from '@/components/ui/content-section'
import { ReusableSearch } from '@/components/ui/reusable-search'
import { Loader2, ChevronLeft, ChevronRight, Plus, Filter, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { CustomShelf } from '@/types/phase3'
import { ShelfCard } from './shelf-card'
import { ShelfCreateDialog } from './shelf-create-dialog'
import { ShelfView } from './shelf-view'
import { ShelfAnalytics } from './shelf-analytics'
import { ShelfBulkActions } from './shelf-bulk-actions'

interface Shelf extends CustomShelf {
  bookCount?: number
}

interface EntityShelvesListProps {
  profileOwnerId?: string
  profileOwnerName?: string
  profileOwnerPermalink?: string
  isOwnEntity?: boolean
  initialShelves?: any[]
  initialCount?: number
  className?: string
}

const PAGE_SIZE = 20

const normalizeShelfEntry = (entry: any): Shelf | null => {
  if (!entry) return null

  return {
    id: entry.id,
    userId: entry.userId || entry.user_id,
    name: entry.name,
    description: entry.description,
    icon: entry.icon,
    color: entry.color || '#3B82F6',
    isDefault: entry.isDefault ?? entry.is_default ?? false,
    isPublic: entry.isPublic ?? entry.is_public ?? true,
    displayOrder: entry.displayOrder ?? entry.display_order ?? 0,
    createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(entry.created_at),
    updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(entry.updated_at),
    bookCount: entry.bookCount ?? entry.book_count ?? 0,
  }
}

export function EntityShelvesList({
  profileOwnerId,
  profileOwnerName,
  profileOwnerPermalink,
  isOwnEntity = false,
  initialShelves = [],
  initialCount = 0,
  className = '',
}: EntityShelvesListProps) {
  const { user } = useAuth()
  const initialShelvesRef = useRef(initialShelves)
  const initialCountRef = useRef(initialCount)

  if (JSON.stringify(initialShelves) !== JSON.stringify(initialShelvesRef.current)) {
    initialShelvesRef.current = initialShelves
  }
  if (initialCount !== initialCountRef.current) {
    initialCountRef.current = initialCount
  }

  const normalizedInitialShelves = useMemo(
    () => (initialShelvesRef.current || []).map(normalizeShelfEntry).filter(Boolean) as Shelf[],
    [JSON.stringify(initialShelvesRef.current)]
  )

  const [shelves, setShelves] = useState<Shelf[]>(() => normalizedInitialShelves)
  const [isLoading, setIsLoading] = useState(() => normalizedInitialShelves.length === 0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(() =>
    Math.max(1, Math.ceil((initialCountRef.current || normalizedInitialShelves.length || 0) / PAGE_SIZE))
  )
  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedShelves, setSelectedShelves] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const retryCount = useRef(0)
  const hasInitialServerData = useRef(normalizedInitialShelves.length > 0)
  const hasInitialized = useRef(false)

  const { toast } = useToast()

  // Sort options (static)
  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
    { value: 'most_books', label: 'Most Books' },
    { value: 'least_books', label: 'Least Books' },
  ]

  // Filter function (pure function)
  const filterItems = (items: Shelf[], searchQuery: string, sortBy: string) => {
    let result = [...items]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (shelf) =>
          shelf.name?.toLowerCase().includes(query) ||
          shelf.description?.toLowerCase().includes(query)
      )
    }

    if (sortBy) {
      result.sort((a, b) => {
        switch (sortBy) {
          case 'recent':
            return b.updatedAt.getTime() - a.updatedAt.getTime()
          case 'name_asc':
            return a.name.localeCompare(b.name)
          case 'name_desc':
            return b.name.localeCompare(a.name)
          case 'most_books':
            return (b.bookCount || 0) - (a.bookCount || 0)
          case 'least_books':
            return (a.bookCount || 0) - (b.bookCount || 0)
          default:
            return 0
        }
      })
    }

    return result
  }

  // Computed values - must be declared before conditional returns
  const filteredAndSortedShelves = useMemo(() => {
    return filterItems(shelves, searchQuery, sortBy)
  }, [shelves, searchQuery, sortBy])

  const selectedShelf = shelves.find((s) => s.id === selectedShelfId)
  const hasActiveFilters = searchQuery || (sortBy && sortBy !== 'recent')

  useEffect(() => {
    if (hasInitialized.current && normalizedInitialShelves.length === 0) {
      return
    }
    hasInitialized.current = true

    if (normalizedInitialShelves.length > 0) {
      setShelves(normalizedInitialShelves)
      setTotalPages(
        Math.max(1, Math.ceil((initialCountRef.current || normalizedInitialShelves.length || 0) / PAGE_SIZE))
      )
      setIsLoading(false)
      hasInitialServerData.current = true
    }
  }, [normalizedInitialShelves.length])

  useEffect(() => {
    const shouldSkipFetch = hasInitialServerData.current && currentPage === 1
    if (shouldSkipFetch) {
      hasInitialServerData.current = false
      return
    }
    fetchShelves(currentPage)
  }, [currentPage])

  const hasFetchedRef = useRef(false)
  const lastFetchedUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    const targetId = profileOwnerId || user?.id
    if (!targetId || normalizedInitialShelves.length > 0) {
      return
    }
    if (hasFetchedRef.current && lastFetchedUserIdRef.current === targetId) {
      return
    }
    hasFetchedRef.current = true
    lastFetchedUserIdRef.current = targetId
    fetchShelves(1, { replace: true })
  }, [user?.id, profileOwnerId])

  const fetchShelves = async (page = currentPage, options: { replace?: boolean } = {}) => {
    try {
      setIsLoading(true)
      const targetId = profileOwnerId || user?.id
      if (!targetId) {
        setIsLoading(false)
        return
      }

      const url = `/api/shelves?userId=${targetId}&page=${page}&limit=${PAGE_SIZE}`
      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()
        const normalized = (data.data || [])
          .map(normalizeShelfEntry)
          .filter(Boolean) as Shelf[]

        setShelves((prev) => {
          if (options.replace || page === 1) {
            return normalized
          }
          const merged = new Map(prev.map((shelf) => [shelf.id, shelf]))
          normalized.forEach((shelf) => {
            if (shelf?.id) {
              merged.set(shelf.id, shelf)
            }
          })
          return Array.from(merged.values())
        })

        if (data.pagination?.totalPages) {
          setTotalPages(Math.max(1, data.pagination.totalPages))
        } else if (data.pagination?.total) {
          setTotalPages(Math.max(1, Math.ceil(data.pagination.total / PAGE_SIZE)))
        } else if (data.pagination?.limit && data.pagination?.total) {
          setTotalPages(Math.max(1, Math.ceil(data.pagination.total / data.pagination.limit)))
        }
      } else {
        console.error('Failed to fetch shelves')
      }
    } catch (error) {
      console.error('Error fetching shelves:', error)
      if (retryCount.current < 3) {
        retryCount.current++
        setTimeout(() => fetchShelves(page, options), 1000 * retryCount.current)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load shelves. Please try again later.',
          variant: 'destructive',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleShelfCreated = (shelf: CustomShelf) => {
    // Add the new shelf to the list
    const normalizedShelf = normalizeShelfEntry(shelf)
    if (normalizedShelf) {
      setShelves((prev) => [...prev, normalizedShelf])
      // Refresh shelves to get accurate counts
      fetchShelves(1, { replace: true })
    }
  }

  const handleShelfSelect = (shelfId: string) => {
    setSelectedShelfId(shelfId)
  }

  const handleBulkDelete = async (shelfIds: string[]) => {
    // Optimistic update - remove shelves immediately
    const shelvesToDelete = shelfIds.map((id) =>
      shelves.find((s) => s.id === id)
    ).filter(Boolean) as Shelf[]
    setShelves((prev) => prev.filter((s) => !shelfIds.includes(s.id)))
    setSelectedShelves(new Set())

    try {
      // Delete in parallel
      await Promise.all(
        shelfIds.map(async (id) => {
          const response = await fetch(`/api/shelves/${id}`, {
            method: 'DELETE',
          })
          if (!response.ok) {
            throw new Error(`Failed to delete shelf ${id}`)
          }
        })
      )
      // Refresh to ensure consistency
      await fetchShelves(currentPage, { replace: true })
    } catch (error) {
      // Rollback optimistic update
      setShelves((prev) => [...prev, ...shelvesToDelete].sort((a, b) => {
        if (a.isDefault !== b.isDefault) {
          return a.isDefault ? -1 : 1
        }
        return a.displayOrder - b.displayOrder
      }))
      throw error
    }
  }

  const handleBulkPrivacyChange = async (shelfIds: string[], isPublic: boolean) => {
    // Optimistic update
    const previousShelves = shelves.map((s) =>
      shelfIds.includes(s.id) ? { ...s, isPublic } : s
    )
    setShelves(previousShelves)

    try {
      // Update in parallel
      await Promise.all(
        shelfIds.map(async (id) => {
          const response = await fetch(`/api/shelves/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isPublic }),
          })
          if (!response.ok) {
            throw new Error(`Failed to update shelf ${id}`)
          }
        })
      )
      // Refresh to ensure consistency
      await fetchShelves(currentPage, { replace: true })
    } catch (error) {
      // Rollback optimistic update
      setShelves(shelves)
      throw error
    }
  }

  if (isLoading && shelves.length === 0) {
    return (
      <div className={className}>
        <ContentSection title={`Shelves · ${initialCount || 0}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="border rounded-lg p-4 space-y-3 animate-pulse"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-32" />
                </div>
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
                <div className="flex items-center gap-2">
                  <div className="h-3 bg-muted rounded w-16" />
                  <div className="h-3 bg-muted rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        </ContentSection>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Analytics Dashboard - Owner Only */}
      {isOwnEntity && shelves.length > 0 && (
        <ShelfAnalytics
          userId={profileOwnerId}
          shelves={shelves.map((s) => ({
            id: s.id,
            name: s.name,
            bookCount: s.bookCount,
            isDefault: s.isDefault,
          }))}
          className="mb-6"
        />
      )}

      <ContentSection
        title={`Shelves · ${initialCount || shelves.length}`}
        headerRight={
          <div className="flex items-center gap-2">
            <div className="relative">
              <ReusableSearch
                paramName="search"
                placeholder="Search shelves..."
                debounceMs={0}
                updateUrl={false}
                className="w-[200px]"
                onSearchChange={(value) => setSearchQuery(value)}
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
            {sortOptions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {sortOptions.map((option) => (
                    <DropdownMenuItem key={option.value} onClick={() => setSortBy(option.value)}>
                      {sortBy === option.value && '✓ '}
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {isOwnEntity && (
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="gap-2"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                New Shelf
              </Button>
            )}
          </div>
        }
      >
        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <span>
              Showing {filteredAndSortedShelves.length} of {shelves.length} shelves
              {searchQuery && ` matching "${searchQuery}"`}
              {sortBy &&
                sortBy !== 'recent' &&
                ` sorted by ${sortOptions.find((o) => o.value === sortBy)?.label.toLowerCase() || sortBy}`}
            </span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  setSearchQuery('')
                  setSortBy('recent')
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* Bulk Actions Toolbar */}
        {isOwnEntity && (
          <ShelfBulkActions
            shelves={shelves}
            selectedShelves={selectedShelves}
            onSelectionChange={setSelectedShelves}
            onBulkDelete={handleBulkDelete}
            onBulkPrivacyChange={handleBulkPrivacyChange}
            className="mb-4"
          />
        )}

        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedShelves.length > 0 ? (
              filteredAndSortedShelves.map((shelf) => (
                <ShelfCard
                  key={shelf.id}
                  shelf={shelf}
                  onSelect={() => handleShelfSelect(shelf.id)}
                  onSettings={() => {}}
                  onDelete={() => {}}
                  isSelected={selectedShelfId === shelf.id}
                  isOwnEntity={isOwnEntity}
                  isSelectable={isOwnEntity}
                  isSelectedForBulk={selectedShelves.has(shelf.id)}
                  onBulkSelect={(selected) => {
                    const newSelection = new Set(selectedShelves)
                    if (selected) {
                      newSelection.add(shelf.id)
                    } else {
                      newSelection.delete(shelf.id)
                    }
                    setSelectedShelves(newSelection)
                  }}
                />
              ))
            ) : (
              <div className="col-span-3 text-center p-4">
                <p className="text-muted-foreground">
                  {searchQuery
                    ? `No shelves found matching "${searchQuery}"`
                    : isOwnEntity
                      ? 'No shelves yet. Create your first shelf to organize your books'
                      : `This user hasn't created any public shelves yet`}
                </p>
              </div>
            )}
          </div>
        </div>
      </ContentSection>

      {selectedShelf && (
        <div className="mt-6">
          <ShelfView shelfId={selectedShelf.id} editable={isOwnEntity} />
        </div>
      )}

      {isOwnEntity && (
        <ShelfCreateDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onCreated={handleShelfCreated}
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

