'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ReusableModal } from '@/components/ui/reusable-modal'
import { ReusableSearch } from '@/components/ui/reusable-search'
import { Button } from '@/components/ui/button'

interface SearchModalProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  onClose?: () => void
}

export function SearchModal({
  open,
  onOpenChange,
  onClose,
}: SearchModalProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  // Support both prop patterns for backward compatibility
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen)
    } else if (onClose && !newOpen) {
      onClose()
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      if (onOpenChange) {
        onOpenChange(false)
      } else if (onClose) {
        onClose()
      }
      setSearchQuery('')
    }
  }

  return (
    <ReusableModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Search"
      description="Search for books, authors, publishers, and more."
      footer={
        <Button type="submit" form="search-modal-form">
          Search
        </Button>
      }
    >
      <form id="search-modal-form" onSubmit={handleSubmit} className="grid gap-4">
        <ReusableSearch
          placeholder="Search books, authors, publishers..."
          updateUrl={false}
          onSearchChange={handleSearchChange}
          className="w-full"
        />
      </form>
    </ReusableModal>
  )
}
