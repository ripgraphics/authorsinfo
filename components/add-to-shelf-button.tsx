'use client'

import { useState, useEffect } from 'react'
import { Plus, Check, Loader2, BookmarkPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useShelfStore } from '@/lib/stores/shelf-store'
import { UUID } from 'crypto'
import { toast } from 'sonner'
import { ShelfBookStatusModal, ReadingStatus } from '@/components/shelf-book-status-modal'

interface AddToShelfButtonProps {
  bookId: string
  bookTitle?: string
  bookPages?: number | null
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function AddToShelfButton({
  bookId,
  bookTitle,
  bookPages,
  className = '',
  variant = 'outline',
  size = 'sm',
}: AddToShelfButtonProps) {
  const { shelves, fetchShelves, addBookToShelf, loading } = useShelfStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState<string | null>(null)
  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(null)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)

  useEffect(() => {
    if (isOpen && shelves.length === 0) {
      fetchShelves()
    }
  }, [isOpen, shelves.length, fetchShelves])

  const handleShelfSelect = (shelfId: string) => {
    setSelectedShelfId(shelfId)
    setIsOpen(false)
    setIsStatusModalOpen(true)
  }

  const handleStatusConfirm = async (status: ReadingStatus, currentPage?: number) => {
    if (!selectedShelfId) return

    setIsAdding(selectedShelfId)
    try {
      await addBookToShelf(
        selectedShelfId as UUID,
        bookId as UUID,
        undefined,
        status,
        currentPage
      )
      const shelf = shelves.find((s) => s.id === selectedShelfId)
      const shelfName = shelf?.name || 'shelf'
      const bookName = bookTitle || 'Book'
      toast.success(`"${bookName}" added to "${shelfName}"`, {
        description: `You can view it in your ${shelfName} shelf`,
      })
    } catch (error) {
      const shelf = shelves.find((s) => s.id === selectedShelfId)
      const shelfName = shelf?.name || 'shelf'
      const bookName = bookTitle || 'Book'
      toast.error(`Failed to add "${bookName}" to "${shelfName}"`, {
        description: error instanceof Error ? error.message : 'Please try again',
      })
      throw error // Re-throw to let modal handle it
    } finally {
      setIsAdding(null)
      setSelectedShelfId(null)
      setIsStatusModalOpen(false)
    }
  }

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={`gap-2 ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            <BookmarkPlus className="h-4 w-4" />
            {size !== 'icon' && <span>Add to Shelf</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Select Shelf</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {loading && shelves.length === 0 ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : shelves.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground text-center">
              No shelves found. Create one in your profile.
            </div>
          ) : (
            shelves.map((shelf) => (
              <DropdownMenuItem
                key={shelf.id}
                onClick={(e) => {
                  e.stopPropagation()
                  handleShelfSelect(shelf.id)
                }}
                disabled={isAdding !== null}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{shelf.icon || '📚'}</span>
                  <span className="truncate">{shelf.name}</span>
                </div>
                {isAdding === shelf.id && <Loader2 className="h-3 w-3 animate-spin" />}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reading Status Modal */}
      <ShelfBookStatusModal
        open={isStatusModalOpen}
        onOpenChange={setIsStatusModalOpen}
        bookId={bookId}
        bookTitle={bookTitle}
        totalPages={bookPages ?? null}
        onConfirm={handleStatusConfirm}
        isLoading={isAdding !== null}
      />
    </>
  )
}
