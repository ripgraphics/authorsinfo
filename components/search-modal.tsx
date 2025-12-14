"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ReusableSearch } from "@/components/ui/reusable-search"
import { Button } from "@/components/ui/button"

export function SearchModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      onOpenChange(false)
      setSearchQuery("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Search for books, authors, publishers, and more.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <ReusableSearch
            placeholder="Search books, authors, publishers..."
            updateUrl={false}
            onSearchChange={handleSearchChange}
            className="w-full"
          />
          <div className="flex justify-end">
            <Button type="submit">Search</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
