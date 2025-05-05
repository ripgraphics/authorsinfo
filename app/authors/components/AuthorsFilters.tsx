"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

export function AuthorsFilters({ 
  search, 
  nationality, 
  sort,
  nationalities 
}: { 
  search?: string, 
  nationality?: string, 
  sort?: string,
  nationalities: string[] 
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateSearchParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`/authors?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/authors')
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <Input
          type="search"
          placeholder="Search authors..."
          defaultValue={search}
          onChange={(e) => updateSearchParams('search', e.target.value || null)}
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
              Filter authors by nationality and sort order.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Select
                defaultValue={nationality}
                onValueChange={(value) => updateSearchParams('nationality', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All nationalities</SelectItem>
                  {nationalities.map((nat) => (
                    <SelectItem key={nat} value={nat}>
                      {nat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort">Sort by</Label>
              <Select
                defaultValue={sort}
                onValueChange={(value) => updateSearchParams('sort', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sort order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                  <SelectItem value="birth_date_asc">Birth Date (Oldest first)</SelectItem>
                  <SelectItem value="birth_date_desc">Birth Date (Newest first)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button onClick={clearFilters} variant="outline">
                Clear filters
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
} 