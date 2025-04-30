'use client'

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"

interface InteractiveControlsProps {
  locations: string[]
  search?: string
  location?: string
  sort?: string
}

export function InteractiveControls({ locations, search, location, sort }: InteractiveControlsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('search', value)
    } else {
      params.delete('search')
    }
    router.push(`/publishers?${params.toString()}`)
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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search publishers..."
            className="pl-9"
            defaultValue={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>
                Filter publishers by location and sort order.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Select
                  value={location}
                  onValueChange={handleLocationChange}
                >
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
                <Select
                  value={sort}
                  onValueChange={handleSortChange}
                >
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