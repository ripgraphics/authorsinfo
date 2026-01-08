'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookOpen, Loader2 } from 'lucide-react'

export type ReadingStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'abandoned'

interface ShelfBookStatusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookId: string
  bookTitle?: string
  totalPages: number | null
  onConfirm: (status: ReadingStatus, currentPage?: number) => Promise<void>
  isLoading?: boolean
  initialStatus?: ReadingStatus // If provided, skip status selection and go directly to page input
  initialCurrentPage?: number | null // If provided, pre-fill the current page input with this value
}

const STATUS_OPTIONS: Array<{ value: ReadingStatus; label: string }> = [
  { value: 'not_started', label: 'Want to Read' },
  { value: 'in_progress', label: 'Currently Reading' },
  { value: 'completed', label: 'Read' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'abandoned', label: 'Abandoned' },
]

export function ShelfBookStatusModal({
  open,
  onOpenChange,
  bookId,
  bookTitle,
  totalPages,
  onConfirm,
  isLoading = false,
  initialStatus,
  initialCurrentPage,
}: ShelfBookStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<ReadingStatus | null>(null)
  const [currentPage, setCurrentPage] = useState<string>('')
  const [error, setError] = useState('')
  const [step, setStep] = useState<'status' | 'page'>('status')

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      // If initialStatus is provided (e.g., 'in_progress' for default shelf flow),
      // skip status selection and go directly to page input step
      if (initialStatus === 'in_progress') {
        setSelectedStatus('in_progress')
        // Use initialCurrentPage if provided, otherwise use empty string
        setCurrentPage(initialCurrentPage !== null && initialCurrentPage !== undefined ? String(initialCurrentPage) : '')
        setError('')
        setStep('page')
      } else {
        // Otherwise, start with status step (for custom shelves)
        setSelectedStatus(null)
        setCurrentPage('')
        setError('')
        setStep('status')
      }
    } else {
      // Reset state when modal closes
      setSelectedStatus(null)
      setCurrentPage('')
      setError('')
      setStep('status')
    }
  }, [open, initialStatus, initialCurrentPage])

  const handleStatusSelect = (status: ReadingStatus) => {
    setSelectedStatus(status)
    setError('')
    
    // If "Currently Reading", transition to page input step
    if (status === 'in_progress') {
      setStep('page')
    } else {
      // For other statuses (Want to Read, Read, On Hold, Abandoned), submit immediately
      handleSubmit(status)
    }
  }

  const handlePageInputChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '')
    setCurrentPage(numericValue)
    setError('')
  }

  const handlePageSubmit = () => {
    if (!selectedStatus || selectedStatus !== 'in_progress') {
      return
    }

    const pageNum = parseInt(currentPage, 10)

    // Validation
    if (!currentPage || isNaN(pageNum)) {
      setError('Please enter a valid page number')
      return
    }

    if (totalPages !== null) {
      if (pageNum < 0) {
        setError('Page number cannot be negative')
        return
      }
      if (pageNum > totalPages) {
        setError(`Page number cannot exceed ${totalPages} pages`)
        return
      }
    }

    handleSubmit(selectedStatus, pageNum)
  }

  const handleSubmit = async (status: ReadingStatus, page?: number) => {
    setError('')
    try {
      await onConfirm(status, page)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save reading status')
    }
  }

  const handleBack = () => {
    // Return to status selection step
    setStep('status')
    setCurrentPage('')
    setError('')
    // Keep selectedStatus so user can see which status they selected if they go back
  }

  const percentage =
    totalPages !== null && currentPage && !isNaN(parseInt(currentPage, 10))
      ? Math.round((parseInt(currentPage, 10) / totalPages) * 100)
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {step === 'status' ? 'Set Reading Status' : 'Current Page'}
          </DialogTitle>
          <DialogDescription>
            {step === 'status'
              ? `How would you like to track "${bookTitle || 'this book'}"?`
              : `What page are you on for "${bookTitle || 'this book'}"?`}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
            {error}
          </div>
        )}

        {step === 'status' ? (
          <div className="space-y-2 py-4">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusSelect(option.value)}
                disabled={isLoading}
                className="w-full text-left px-4 py-3 rounded-lg border-2 transition-all hover:bg-accent hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-page">Current Page</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="current-page"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={currentPage}
                  onChange={(e) => handlePageInputChange(e.target.value)}
                  disabled={isLoading}
                  className="text-lg"
                  autoFocus
                />
                {totalPages !== null && (
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    of {totalPages} pages
                  </span>
                )}
              </div>
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
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'page' && (
            <Button variant="outline" onClick={handleBack} disabled={isLoading}>
              Back
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          {step === 'page' && (
            <Button onClick={handlePageSubmit} disabled={isLoading || !currentPage}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

