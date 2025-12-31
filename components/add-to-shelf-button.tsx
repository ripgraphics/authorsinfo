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

interface AddToShelfButtonProps {
  bookId: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function AddToShelfButton({
  bookId,
  className = '',
  variant = 'outline',
  size = 'sm',
}: AddToShelfButtonProps) {
  const { shelves, fetchShelves, addBookToShelf, loading } = useShelfStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && shelves.length === 0) {
      fetchShelves()
    }
  }, [isOpen, shelves.length, fetchShelves])

  const handleAddToShelf = async (shelfId: string) => {
    setIsAdding(shelfId)
    try {
      await addBookToShelf(shelfId as UUID, bookId as UUID)
      toast.success('Added to shelf')
    } catch (error) {
      toast.error('Failed to add to shelf')
    } finally {
      setIsAdding(null)
      setIsOpen(false)
    }
  }

  return (
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
                handleAddToShelf(shelf.id)
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
  )
}
