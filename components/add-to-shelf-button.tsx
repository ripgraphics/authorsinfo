'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, BookmarkPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ReusableModal } from '@/components/ui/reusable-modal'
import { useShelfStore } from '@/lib/stores/shelf-store'
import { UUID } from 'crypto'
import { toast } from 'sonner'
import { useToast } from '@/hooks/use-toast'
import { ShelfBookStatusModal, ReadingStatus } from '@/components/shelf-book-status-modal'
import { ShelfCreateDialog } from '@/components/shelf-create-dialog'
import { useAuth } from '@/hooks/useAuth'

const STATUS_DISPLAY: Record<string, string> = {
  not_started: 'Want to Read',
  in_progress: 'Currently Reading',
  completed: 'Read',
  on_hold: 'On Hold',
  abandoned: 'Abandoned',
}

function getStatusDisplayName(status: string): string {
  return STATUS_DISPLAY[status] || status
}

interface AddToShelfButtonProps {
  bookId: string
  bookTitle?: string
  bookPages?: number | null
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /** Current reading status from reading_progress (e.g. not_started, in_progress). Pass to avoid fetch. */
  currentReadingStatus?: string | null
  /** When true, button shows "On Shelf (Status)" when book is on shelf. Default true when size !== 'icon'. */
  showCurrentStatus?: boolean
  /** Callback when status changes (add/remove/update). Parent can refetch status. */
  onStatusChange?: () => void
  /** Pre-fill current page in "Currently Reading" modal (e.g. from readingProgress). */
  initialCurrentPage?: number | null
}

export function AddToShelfButton({
  bookId,
  bookTitle,
  bookPages,
  className = '',
  variant = 'outline',
  size = 'default',
  currentReadingStatus: currentReadingStatusProp,
  showCurrentStatus = true,
  onStatusChange,
  initialCurrentPage,
}: AddToShelfButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast: toastHook } = useToast()
  const { shelves, fetchShelves, addBookToShelf, loading } = useShelfStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentReadingStatus, setCurrentReadingStatus] = useState<string | null>(
    currentReadingStatusProp ?? null
  )
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(null)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isShelfCreateDialogOpen, setIsShelfCreateDialogOpen] = useState(false)
  const [showPageInputForCurrentlyReading, setShowPageInputForCurrentlyReading] = useState(false)
  const [currentlyReadingPageInput, setCurrentlyReadingPageInput] = useState('')
  const [pageInputError, setPageInputError] = useState('')

  const displayStatus = currentReadingStatusProp ?? currentReadingStatus
  const showStatusText = showCurrentStatus && size !== 'icon'

  useEffect(() => {
    if (currentReadingStatusProp !== undefined) {
      setCurrentReadingStatus(currentReadingStatusProp)
    }
  }, [currentReadingStatusProp])

  useEffect(() => {
    if (dialogOpen && user && currentReadingStatusProp === undefined) {
      fetch('/api/reading-status?bookId=' + encodeURIComponent(bookId))
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.status != null) setCurrentReadingStatus(data.status)
        })
        .catch(() => {})
    }
  }, [dialogOpen, user, bookId, currentReadingStatusProp])

  useEffect(() => {
    if (dialogOpen && shelves.length === 0) {
      fetchShelves()
    }
  }, [dialogOpen, shelves.length, fetchShelves])

  const updateReadingStatusApi = async (status: string, currentPage?: number) => {
    const res = await fetch('/api/reading-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookId,
        status,
        ...(currentPage !== undefined && { currentPage }),
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to update reading status')
    }
    const data = await res.json()
    setCurrentReadingStatus(data.status ?? status)
    onStatusChange?.()
  }

  const handleReadingStatusUpdate = async (status: string) => {
    if (!user) {
      toast.error('Please log in to add books to your shelf')
      return
    }
    if (status === 'currently_reading') {
      setCurrentlyReadingPageInput(initialCurrentPage != null ? String(initialCurrentPage) : '')
      setPageInputError('')
      setShowPageInputForCurrentlyReading(true)
      return
    }
    setIsUpdatingStatus(true)
    try {
      await updateReadingStatusApi(status)
      setDialogOpen(false)
      const displayName = getStatusDisplayName(status)
      toast.success(`"${bookTitle || 'Book'}" added to ${displayName} shelf`)
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : `Failed to update reading status for "${bookTitle || 'Book'}"`
      )
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleInlinePageInputSave = async () => {
    const pageNum = parseInt(currentlyReadingPageInput.replace(/[^0-9]/g, ''), 10)
    if (!currentlyReadingPageInput.trim() || isNaN(pageNum)) {
      setPageInputError('Please enter a valid page number')
      return
    }
    const totalPages = bookPages ?? null
    if (totalPages !== null) {
      if (pageNum < 0) {
        setPageInputError('Page number cannot be negative')
        return
      }
      if (pageNum > totalPages) {
        setPageInputError(`Page number cannot exceed ${totalPages} pages`)
        return
      }
    }
    setPageInputError('')
    setIsUpdatingStatus(true)
    try {
      await updateReadingStatusApi('in_progress', pageNum)
      setShowPageInputForCurrentlyReading(false)
      setDialogOpen(false)
      toast.success(
        `"${bookTitle || 'Book'}" added to Currently Reading (Page ${pageNum})`
      )
      onStatusChange?.()
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : `Failed to update reading status for "${bookTitle || 'Book'}"`
      )
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handlePageInputConfirm = async (status: ReadingStatus, currentPage?: number) => {
    setIsUpdatingStatus(true)
    try {
      await updateReadingStatusApi('in_progress', currentPage)
      setIsStatusModalOpen(false)
      toast.success(
        `"${bookTitle || 'Book'}" added to Currently Reading${currentPage != null ? ` (Page ${currentPage})` : ''}`
      )
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : `Failed to update reading status for "${bookTitle || 'Book'}"`
      )
      throw e
    } finally {
      setIsUpdatingStatus(false)
    }
    onStatusChange?.()
  }

  const handleRemoveFromShelf = async () => {
    if (!user) {
      toastHook({
        title: 'Authentication required',
        description: 'Please sign in to manage your shelves',
        variant: 'destructive',
      })
      return
    }
    setIsUpdatingStatus(true)
    try {
      const res = await fetch('/api/reading-status', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to remove from shelf')
      }
      setCurrentReadingStatus(null)
      setDialogOpen(false)
      toast.success(`"${bookTitle || 'Book'}" has been removed from your shelves`)
      onStatusChange?.()
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : `Failed to remove "${bookTitle || 'Book'}" from shelf`
      )
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleShelfSelect = (shelfId: string) => {
    setSelectedShelfId(shelfId)
    setDialogOpen(false)
    setIsStatusModalOpen(true)
  }

  const handleStatusConfirm = async (status: ReadingStatus, currentPage?: number) => {
    if (!selectedShelfId) return
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
      toast.success(`"${bookTitle || 'Book'}" added to "${shelfName}"`)
      onStatusChange?.()
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : `Failed to add "${bookTitle || 'Book'}" to shelf`
      )
      throw e
    } finally {
      setSelectedShelfId(null)
      setIsStatusModalOpen(false)
    }
  }

  const buttonLabel = showStatusText && displayStatus
    ? `On Shelf (${getStatusDisplayName(displayStatus)})`
    : 'Add to Shelf'

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`gap-2 ${className}`}
        onClick={(e) => {
          e.stopPropagation()
          setDialogOpen(true)
        }}
        disabled={isUpdatingStatus}
      >
        <BookmarkPlus className="h-4 w-4" />
        {size !== 'icon' && <span>{buttonLabel}</span>}
      </Button>

      <ReusableModal
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setShowPageInputForCurrentlyReading(false)
            setCurrentlyReadingPageInput('')
            setPageInputError('')
          }
        }}
        title={
          showPageInputForCurrentlyReading
            ? 'Current Page'
            : displayStatus
              ? 'Update Reading Status'
              : 'Add Book to Shelf'
        }
        description={
          showPageInputForCurrentlyReading
            ? `What page are you on for "${bookTitle || 'this book'}"?`
            : undefined
        }
        footer={
          showPageInputForCurrentlyReading ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPageInputForCurrentlyReading(false)
                  setCurrentlyReadingPageInput('')
                  setPageInputError('')
                }}
                disabled={isUpdatingStatus}
              >
                Back
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isUpdatingStatus}>
                Cancel
              </Button>
              <Button onClick={handleInlinePageInputSave} disabled={isUpdatingStatus || !currentlyReadingPageInput.trim()}>
                {isUpdatingStatus ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </>
          ) : undefined
        }
      >
        {showPageInputForCurrentlyReading ? (
          <div className="space-y-4">
            {pageInputError && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                {pageInputError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="current-page-inline">Current Page</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="current-page-inline"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={currentlyReadingPageInput}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setCurrentlyReadingPageInput(value)
                    setPageInputError('')
                  }}
                  disabled={isUpdatingStatus}
                  className="text-lg"
                  autoFocus
                />
                {bookPages != null && (
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    of {bookPages} pages
                  </span>
                )}
              </div>
              {(() => {
                const totalPages = bookPages ?? null
                const pageNum = parseInt(currentlyReadingPageInput, 10)
                const percentage =
                  totalPages !== null &&
                  currentlyReadingPageInput &&
                  !isNaN(pageNum)
                    ? Math.round((pageNum / totalPages) * 100)
                    : null
                return (
                  <>
                    {percentage !== null && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{percentage}%</span>
                        </div>
                        <div className="relative w-full overflow-hidden rounded-full bg-secondary h-2">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {totalPages === null && (
                      <p className="text-xs text-muted-foreground">
                        Page count not available for this book
                      </p>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        ) : (
        <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleReadingStatusUpdate('want_to_read')}
              disabled={isUpdatingStatus}
              className={`shelf-menu-item flex w-full cursor-pointer items-center gap-2 rounded-xs px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-white ${
                displayStatus === 'not_started' ? 'bg-accent text-accent-foreground' : ''
              }`}
            >
              {displayStatus === 'not_started' ? '✓ ' : ''}Want to Read
            </button>
            <button
              type="button"
              onClick={() => handleReadingStatusUpdate('currently_reading')}
              disabled={isUpdatingStatus}
              className={`shelf-menu-item flex w-full cursor-pointer items-center gap-2 rounded-xs px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-white ${
                displayStatus === 'in_progress' ? 'bg-accent text-accent-foreground' : ''
              }`}
            >
              {displayStatus === 'in_progress' ? '✓ ' : ''}Currently Reading
            </button>
            <button
              type="button"
              onClick={() => handleReadingStatusUpdate('read')}
              disabled={isUpdatingStatus}
              className={`shelf-menu-item flex w-full cursor-pointer items-center gap-2 rounded-xs px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-white ${
                displayStatus === 'completed' ? 'bg-accent text-accent-foreground' : ''
              }`}
            >
              {displayStatus === 'completed' ? '✓ ' : ''}Read
            </button>
            <button
              type="button"
              onClick={() => handleReadingStatusUpdate('on_hold')}
              disabled={isUpdatingStatus}
              className={`shelf-menu-item flex w-full cursor-pointer items-center gap-2 rounded-xs px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-white ${
                displayStatus === 'on_hold' ? 'bg-accent text-accent-foreground' : ''
              }`}
            >
              {displayStatus === 'on_hold' ? '✓ ' : ''}On Hold
            </button>
            <button
              type="button"
              onClick={() => handleReadingStatusUpdate('abandoned')}
              disabled={isUpdatingStatus}
              className={`shelf-menu-item flex w-full cursor-pointer items-center gap-2 rounded-xs px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-white ${
                displayStatus === 'abandoned' ? 'bg-accent text-accent-foreground' : ''
              }`}
            >
              {displayStatus === 'abandoned' ? '✓ ' : ''}Abandoned
            </button>
          {displayStatus && (
            <>
              <div role="separator" className="shelf-separator my-2 h-px bg-muted" />
              <button
                type="button"
                onClick={handleRemoveFromShelf}
                disabled={isUpdatingStatus}
                className="shelf-menu-item flex w-full cursor-pointer items-center gap-2 rounded-xs px-2 py-1.5 text-left text-sm hover:bg-destructive hover:text-destructive-foreground"
              >
                Remove from Shelf
              </button>
            </>
          )}
          <div role="separator" className="shelf-separator my-2 h-px bg-muted" />
          <div className="text-sm font-medium text-muted-foreground">Add to custom shelf</div>
          {(() => {
            const customShelves = shelves.filter((s: { isDefault?: boolean }) => !s.isDefault)
            if (loading && customShelves.length === 0) {
              return (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )
            }
            if (customShelves.length === 0) {
              return <p className="text-sm text-muted-foreground">No custom shelves. Create one below.</p>
            }
            return (
            <div className="space-y-1">
              {customShelves.map((shelf) => (
                <button
                  key={shelf.id}
                  type="button"
                  onClick={() => handleShelfSelect(shelf.id)}
                  disabled={isUpdatingStatus}
                  className="shelf-menu-item flex w-full cursor-pointer items-center gap-2 rounded-xs px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-white"
                >
                  <span className="text-lg">{shelf.icon || '📚'}</span>
                  <span className="truncate">{shelf.name}</span>
                </button>
              ))}
            </div>
            )
          })()}
          <div role="separator" className="shelf-separator my-2 h-px bg-muted" />
          <button
            type="button"
            onClick={() => {
              setDialogOpen(false)
              setIsShelfCreateDialogOpen(true)
            }}
            className="shelf-menu-item flex w-full cursor-pointer items-center gap-2 rounded-xs px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-white"
          >
            <Plus className="h-4 w-4" />
            New Shelf
          </button>
          <div role="separator" className="shelf-separator my-2 h-px bg-muted" />
          <button
            type="button"
            onClick={() => {
              if (user) {
                setDialogOpen(false)
                router.push(`/profile/${user.id}?tab=shelves`)
              } else {
                toastHook({
                  title: 'Authentication required',
                  description: 'Please sign in to manage your shelves',
                  variant: 'destructive',
                })
              }
            }}
            className="shelf-manage-button w-full cursor-pointer px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-white"
          >
            Manage shelves...
          </button>
        </div>
        )}
      </ReusableModal>

      <ShelfCreateDialog
        open={isShelfCreateDialogOpen}
        onOpenChange={setIsShelfCreateDialogOpen}
        autoAddBookId={bookId}
        autoAddBookTitle={bookTitle}
        onCreated={async () => {
          await fetchShelves()
          setDialogOpen(false)
        }}
      />

      <ShelfBookStatusModal
        open={isStatusModalOpen}
        onOpenChange={setIsStatusModalOpen}
        bookId={bookId}
        bookTitle={bookTitle}
        totalPages={bookPages ?? null}
        onConfirm={selectedShelfId ? handleStatusConfirm : handlePageInputConfirm}
        isLoading={isUpdatingStatus}
        initialStatus={selectedShelfId ? undefined : 'in_progress'}
        initialCurrentPage={selectedShelfId ? undefined : (initialCurrentPage ?? undefined)}
      />
    </>
  )
}
