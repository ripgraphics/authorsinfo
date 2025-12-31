'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Filter } from 'lucide-react'
import { ReusableSearch } from '@/components/ui/reusable-search'

interface InteractiveControlsProps {
  languages: string[]
  years: string[]
  search: string | undefined
  language: string | undefined
  sort: string | undefined
  year: string | undefined
  onSearchChange?: (value: string) => void
}

export function InteractiveControls({
  languages,
  years,
  search,
  language,
  sort,
  year,
  onSearchChange,
}: InteractiveControlsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`/books?${params.toString()}`)
  }

  const handleSearchChange = (value: string) => {
    // Dispatch custom event for instant results update
    window.dispatchEvent(new CustomEvent('searchValueUpdate', { detail: value }))
    // Also call the prop callback if provided
    if (onSearchChange) {
      onSearchChange(value)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <ReusableSearch
        paramName="search"
        placeholder="Search books..."
        debounceMs={300}
        basePath="/books"
        preserveParams={['language', 'year', 'sort']}
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
            <SheetDescription>Filter books by language, year, and sort order.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                defaultValue={language}
                onValueChange={(value) => handleFilterChange('language', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All languages</SelectItem>
                  {languages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Publication Year</Label>
              <Select
                defaultValue={year}
                onValueChange={(value) => handleFilterChange('year', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort">Sort by</Label>
              <Select
                defaultValue={sort}
                onValueChange={(value) => handleFilterChange('sort', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sort order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title_asc">Title (A-Z)</SelectItem>
                  <SelectItem value="title_desc">Title (Z-A)</SelectItem>
                  <SelectItem value="date_asc">Publication Date (Oldest first)</SelectItem>
                  <SelectItem value="date_desc">Publication Date (Newest first)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button
                onClick={() => {
                  router.push('/books')
                }}
                variant="outline"
              >
                Clear filters
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
