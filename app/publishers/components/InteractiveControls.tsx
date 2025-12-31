'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { ReusableSearch } from '@/components/ui/reusable-search'

interface InteractiveControlsProps {
  locations: string[]
  search?: string
  location?: string
  sort?: string
  onSearchChange?: (value: string) => void
}

export function InteractiveControls({
  locations,
  search,
  location,
  sort,
  onSearchChange,
}: InteractiveControlsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSearchChange = (value: string) => {
    // Dispatch custom event for instant results update
    window.dispatchEvent(new CustomEvent('searchValueUpdate', { detail: value }))
    // Also call the prop callback if provided
    if (onSearchChange) {
      onSearchChange(value)
    }
  }

  const handleLocationChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set('location', value)
    } else {
      params.delete('location')
    }
    router.push(`/publishers?${params.toString()}`)
  }

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'name_asc') {
      params.set('sort', value)
    } else {
      params.delete('sort')
    }
    router.push(`/publishers?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <ReusableSearch
          paramName="search"
          placeholder="Search publishers..."
          debounceMs={300}
          basePath="/publishers"
          preserveParams={['location', 'sort']}
          onSearchChange={handleSearchChange}
        />
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>Filter publishers by location and sort order.</SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Select value={location} onValueChange={handleLocationChange}>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sort">Sort By</Label>
                <Select value={sort} onValueChange={handleSortChange}>
                  <SelectTrigger id="sort">
                    <SelectValue placeholder="Select sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button type="submit">Apply Filters</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
