'use client'

import { useState, useMemo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ContentSection } from '@/components/ui/content-section'
import { Filter, X } from 'lucide-react'
import { ReusableSearch } from '@/components/ui/reusable-search'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface SortOption {
  value: string
  label: string
}

export interface UserListLayoutProps<T extends { id: string | number }> {
  title: string
  items: T[]
  renderItem: (item: T) => ReactNode
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  sortOptions?: SortOption[]
  defaultSort?: string
  sortValue?: string
  onSortChange?: (value: string) => void
  getSortLabel?: (value: string) => string
  filterItems?: (items: T[], searchQuery: string, sortBy: string) => T[]
  emptyMessage?: string
  emptySearchMessage?: string
  showFilterStatus?: boolean
  className?: string
}

export function UserListLayout<T extends { id: string | number }>({
  title,
  items,
  renderItem,
  searchPlaceholder = 'Search...',
  searchValue: externalSearchValue,
  onSearchChange: externalOnSearchChange,
  sortOptions = [],
  defaultSort = '',
  sortValue: externalSortValue,
  onSortChange: externalOnSortChange,
  getSortLabel,
  filterItems,
  emptyMessage = 'No items yet',
  emptySearchMessage,
  showFilterStatus = true,
  className,
}: UserListLayoutProps<T>) {
  const [internalSearchQuery, setInternalSearchQuery] = useState('')
  const [internalSortBy, setInternalSortBy] = useState(defaultSort)

  const searchQuery = externalSearchValue !== undefined ? externalSearchValue : internalSearchQuery
  const sortBy = externalSortValue !== undefined ? externalSortValue : internalSortBy

  const setSearchQuery = externalOnSearchChange || setInternalSearchQuery
  const setSortBy = externalOnSortChange || setInternalSortBy

  const filteredAndSortedItems = useMemo(() => {
    if (filterItems) {
      return filterItems(items, searchQuery, sortBy)
    }

    let result = [...items]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (item: any) =>
          item.name?.toLowerCase().includes(query) ||
          item.email?.toLowerCase().includes(query) ||
          item.friend?.name?.toLowerCase().includes(query) ||
          item.friend?.email?.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    if (sortBy) {
      result.sort((a: any, b: any) => {
        switch (sortBy) {
          case 'recent':
            return (
              new Date(b.followSince || b.friendshipDate || 0).getTime() -
              new Date(a.followSince || a.friendshipDate || 0).getTime()
            )
          case 'oldest':
            return (
              new Date(a.followSince || a.friendshipDate || 0).getTime() -
              new Date(b.followSince || b.friendshipDate || 0).getTime()
            )
          case 'most_followers':
            return (b.followers_count || 0) - (a.followers_count || 0)
          case 'least_followers':
            return (a.followers_count || 0) - (b.followers_count || 0)
          case 'name_asc':
            return (a.name || a.friend?.name || '').localeCompare(b.name || b.friend?.name || '')
          case 'name_desc':
            return (b.name || b.friend?.name || '').localeCompare(a.name || a.friend?.name || '')
          case 'mutual':
            return (b.mutualFriendsCount || 0) - (a.mutualFriendsCount || 0)
          default:
            return 0
        }
      })
    }

    return result
  }, [items, searchQuery, sortBy, filterItems])

  const getSortLabelInternal = (value: string) => {
    if (getSortLabel) {
      return getSortLabel(value)
    }
    const option = sortOptions.find((opt) => opt.value === value)
    return option ? option.label : value
  }

  const hasActiveFilters = searchQuery || (sortBy && sortBy !== defaultSort)

  return (
    <ContentSection
      title={title}
      headerRight={
        <div className="flex items-center gap-2">
          <div className="relative">
            <ReusableSearch
              paramName="search"
              placeholder={searchPlaceholder}
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
        </div>
      }
      className={className}
    >
      {showFilterStatus && hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span>
            Showing {filteredAndSortedItems.length} of {items.length} items
            {searchQuery && ` matching "${searchQuery}"`}
            {sortBy &&
              sortBy !== defaultSort &&
              ` sorted by ${getSortLabelInternal(sortBy).toLowerCase()}`}
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => {
                setSearchQuery('')
                setSortBy(defaultSort)
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedItems.length > 0 ? (
            filteredAndSortedItems.map((item) => <div key={item.id}>{renderItem(item)}</div>)
          ) : (
            <div className="col-span-3 text-center p-6">
              <p className="text-muted-foreground">
                {searchQuery
                  ? emptySearchMessage || `No items found matching "${searchQuery}"`
                  : emptyMessage}
              </p>
            </div>
          )}
        </div>
      </div>
    </ContentSection>
  )
}
