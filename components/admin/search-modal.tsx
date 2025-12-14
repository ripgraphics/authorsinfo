"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ReusableSearch } from "@/components/ui/reusable-search"
import { Button } from "@/components/ui/button"

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("")
  const router = useRouter()

  const handleSearchChange = (value: string) => {
    setQuery(value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      onClose()
      setQuery("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Search for books, authors, publishers, and more.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
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
