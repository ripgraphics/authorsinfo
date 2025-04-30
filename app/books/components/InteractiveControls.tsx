'use client'

import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Filter } from "lucide-react"

interface InteractiveControlsProps {
  languages: string[]
  years: string[]
  search: string | undefined
  language: string | undefined
  sort: string | undefined
  year: string | undefined
}

export function InteractiveControls({ languages, years, search, language, sort, year }: InteractiveControlsProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <Input
          type="search"
          placeholder="Search books..."
          defaultValue={search}
          onChange={(e) => {
            const params = new URLSearchParams(window.location.search)
            if (e.target.value) {
              params.set("search", e.target.value)
            } else {
              params.delete("search")
            }
            params.delete("page")
            window.location.search = params.toString()
          }}
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
              Filter books by language, year, and sort order.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                defaultValue={language}
                onValueChange={(value) => {
                  const params = new URLSearchParams(window.location.search)
                  if (value) {
                    params.set("language", value)
                  } else {
                    params.delete("language")
                  }
                  params.delete("page")
                  window.location.search = params.toString()
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All languages</SelectItem>
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
                onValueChange={(value) => {
                  const params = new URLSearchParams(window.location.search)
                  if (value) {
                    params.set("year", value)
                  } else {
                    params.delete("year")
                  }
                  params.delete("page")
                  window.location.search = params.toString()
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All years</SelectItem>
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
                onValueChange={(value) => {
                  const params = new URLSearchParams(window.location.search)
                  if (value) {
                    params.set("sort", value)
                  } else {
                    params.delete("sort")
                  }
                  params.delete("page")
                  window.location.search = params.toString()
                }}
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
                  window.location.search = ""
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