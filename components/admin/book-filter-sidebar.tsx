'use client'

import type React from 'react'

import { useState, useEffect } from 'react'
import type { BookFilter } from '@/app/actions/admin-books'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react'

interface BookFilterSidebarProps {
  genres: { id: string; name: string }[]
  formatTypes: { id: string; name: string }[]
  bindingTypes: { id: string; name: string }[]
  languages: string[]
  initialFilters: BookFilter
  onApplyFilters: (filters: BookFilter) => void
  onResetFilters: () => void
}

export function BookFilterSidebar({
  genres,
  formatTypes,
  bindingTypes,
  languages,
  initialFilters,
  onApplyFilters,
  onResetFilters,
}: BookFilterSidebarProps) {
  const [filters, setFilters] = useState<BookFilter>(initialFilters)
  const [expanded, setExpanded] = useState({
    basic: true,
    format: false,
    rating: false,
    advanced: false,
  })

  // Update filters when initialFilters change
  useEffect(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleRatingChange = (value: number[]) => {
    setFilters((prev) => ({
      ...prev,
      minRating: value[0],
      maxRating: value[1] || 5,
    }))
  }

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const handleApplyFilters = () => {
    onApplyFilters(filters)
  }

  const handleResetFilters = () => {
    setFilters({})
    onResetFilters()
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        <Button variant="ghost" size="sm" onClick={handleResetFilters}>
          <X className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
        {/* Basic Filters Section */}
        <div className="border rounded-md">
          <button
            className="w-full flex items-center justify-between p-3 text-sm font-medium"
            onClick={() => toggleSection('basic')}
          >
            <span>Basic Filters</span>
            {expanded.basic ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expanded.basic && (
            <div className="p-3 border-t space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Search by title"
                    value={filters.title || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    name="author"
                    placeholder="Search by author"
                    value={filters.author || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publisher">Publisher</Label>
                  <Input
                    id="publisher"
                    name="publisher"
                    placeholder="Search by publisher"
                    value={filters.publisher || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    name="isbn"
                    placeholder="Search by ISBN"
                    value={filters.isbn || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publishedYear">Publication Year</Label>
                  <Input
                    id="publishedYear"
                    name="publishedYear"
                    placeholder="e.g. 2020"
                    value={filters.publishedYear || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Format and Type Filters */}
        <div className="border rounded-md">
          <button
            className="w-full flex items-center justify-between p-3 text-sm font-medium"
            onClick={() => toggleSection('format')}
          >
            <span>Format & Type</span>
            {expanded.format ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expanded.format && (
            <div className="p-3 border-t space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={filters.language || ''}
                    onValueChange={(value) => handleSelectChange('language', value)}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="All languages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All languages</SelectItem>
                      {languages.map((language) => (
                        <SelectItem key={language} value={language}>
                          {language}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Select
                    value={filters.genre || ''}
                    onValueChange={(value) => handleSelectChange('genre', value)}
                  >
                    <SelectTrigger id="genre">
                      <SelectValue placeholder="All genres" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All genres</SelectItem>
                      {genres.map((genre) => (
                        <SelectItem key={genre.id} value={genre.id}>
                          {genre.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select
                    value={filters.format || ''}
                    onValueChange={(value) => handleSelectChange('format', value)}
                  >
                    <SelectTrigger id="format">
                      <SelectValue placeholder="All formats" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All formats</SelectItem>
                      {formatTypes.map((format) => (
                        <SelectItem key={format.id} value={format.id}>
                          {format.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="binding">Binding</Label>
                  <Select
                    value={filters.binding || ''}
                    onValueChange={(value) => handleSelectChange('binding', value)}
                  >
                    <SelectTrigger id="binding">
                      <SelectValue placeholder="All bindings" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All bindings</SelectItem>
                      {bindingTypes.map((binding) => (
                        <SelectItem key={binding.id} value={binding.id}>
                          {binding.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rating Filters */}
        <div className="border rounded-md">
          <button
            className="w-full flex items-center justify-between p-3 text-sm font-medium"
            onClick={() => toggleSection('rating')}
          >
            <span>Rating</span>
            {expanded.rating ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expanded.rating && (
            <div className="p-3 border-t space-y-3">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Rating Range</Label>
                  <span className="text-sm">
                    {filters.minRating || 0} - {filters.maxRating || 5} stars
                  </span>
                </div>
                <Slider
                  defaultValue={[filters.minRating || 0, filters.maxRating || 5]}
                  max={5}
                  step={0.5}
                  onValueChange={handleRatingChange}
                />
              </div>
            </div>
          )}
        </div>

        {/* Advanced Filters */}
        <div className="border rounded-md">
          <button
            className="w-full flex items-center justify-between p-3 text-sm font-medium"
            onClick={() => toggleSection('advanced')}
          >
            <span>Advanced Filters</span>
            {expanded.advanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expanded.advanced && (
            <div className="p-3 border-t space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="publishedYear">Publication Year</Label>
                  <Input
                    id="publishedYear"
                    name="publishedYear"
                    placeholder="e.g. 2023"
                    value={filters.publishedYear || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={filters.status || ''}
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onResetFilters}>
          Cancel
        </Button>
        <Button onClick={handleApplyFilters}>
          <Filter className="h-4 w-4 mr-2" />
          Apply Filters
        </Button>
      </div>
    </div>
  )
}
