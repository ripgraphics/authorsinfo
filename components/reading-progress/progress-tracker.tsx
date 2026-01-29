'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ReusableModal } from '@/components/ui/reusable-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import {
  CalendarIcon,
  ChevronDown,
  BookOpen,
  BookMarked,
  Clock,
  CheckCircle,
  PauseCircle,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getUserReadingProgress,
  updateReadingProgress,
  deleteReadingProgress,
  type ReadingProgress,
  type ReadingProgressStatus,
} from '@/app/actions/reading-progress'
import { toast } from '@/hooks/use-toast'

interface ProgressTrackerProps {
  bookId: string
  totalPages?: number
  className?: string
}

export function ProgressTracker({ bookId, totalPages = 0, className }: ProgressTrackerProps) {
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [currentPage, setCurrentPage] = useState<number | undefined>(undefined)
  const [notes, setNotes] = useState<string>('')
  const [isPublic, setIsPublic] = useState(true)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [finishDate, setFinishDate] = useState<Date | undefined>(undefined)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)

  // Fetch initial progress data
  useEffect(() => {
    async function fetchProgress() {
      setLoading(true)
      const { progress, error } = await getUserReadingProgress(bookId)

      if (error) {
        console.error('Error fetching reading progress:', error)
        toast({
          title: 'Error',
          description: 'Could not load your reading progress. Please try again.',
          variant: 'destructive',
        })
      } else {
        setProgress(progress)

        // Initialize form values
        if (progress) {
          setCurrentPage((progress as any).current_page)
          setNotes((progress as any).notes || '')
          setIsPublic((progress as any).is_public !== false) // Default to true if undefined
          setStartDate(
            (progress as any).start_date ? new Date((progress as any).start_date) : undefined
          )
          setFinishDate(
            (progress as any).finish_date ? new Date((progress as any).finish_date) : undefined
          )
        }
      }

      setLoading(false)
    }

    fetchProgress()
  }, [bookId])

  // Handle status change
  const handleStatusChange = async (status: ReadingProgressStatus) => {
    setUpdating(true)

    try {
      const { success, error } = await updateReadingProgress({
        book_id: bookId,
        status,
        total_pages: totalPages > 0 ? totalPages : undefined,
      })

      if (success) {
        // Refresh the progress data
        const { progress: updatedProgress } = await getUserReadingProgress(bookId)
        setProgress(updatedProgress)

        toast({
          title: 'Success',
          description: `Reading status updated to ${formatStatus(status)}.`,
        })
      } else {
        toast({
          title: 'Error',
          description: error || 'Failed to update reading status.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating reading status:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  // Handle progress update
  const handleProgressUpdate = async () => {
    setUpdating(true)

    try {
      const { success, error } = await updateReadingProgress({
        book_id: bookId,
        status: progress?.status || 'in_progress',
        current_page: currentPage,
        total_pages: totalPages > 0 ? totalPages : undefined,
        notes,
        start_date: startDate?.toISOString(),
        finish_date: finishDate?.toISOString(),
      })

      if (success) {
        // Refresh the progress data
        const { progress: updatedProgress } = await getUserReadingProgress(bookId)
        setProgress(updatedProgress)

        toast({
          title: 'Success',
          description: 'Reading progress updated successfully.',
        })

        setShowUpdateDialog(false)
      } else {
        toast({
          title: 'Error',
          description: error || 'Failed to update reading progress.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating reading progress:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  // Handle progress deletion
  const handleDeleteProgress = async () => {
    if (!confirm('Are you sure you want to delete your reading progress for this book?')) {
      return
    }

    setUpdating(true)

    try {
      const { success, error } = await deleteReadingProgress(bookId)

      if (success) {
        setProgress(null)
        setCurrentPage(undefined)
        setNotes('')
        setIsPublic(true)
        setStartDate(undefined)
        setFinishDate(undefined)

        toast({
          title: 'Success',
          description: 'Reading progress deleted successfully.',
        })

        setShowUpdateDialog(false)
      } else {
        toast({
          title: 'Error',
          description: error || 'Failed to delete reading progress.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting reading progress:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  // Helper function to format status
  const formatStatus = (status: ReadingProgressStatus): string => {
    switch (status) {
      case 'not_started':
        return 'Want to Read'
      case 'in_progress':
        return 'Currently Reading'
      case 'completed':
        return 'Completed'
      case 'on_hold':
        return 'On Hold'
      case 'abandoned':
        return 'Abandoned'
      default:
        return status
    }
  }

  // Helper function to get status icon
  const getStatusIcon = (status: ReadingProgressStatus) => {
    switch (status) {
      case 'not_started':
        return <BookMarked className="h-4 w-4" />
      case 'in_progress':
        return <Clock className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'on_hold':
        return <PauseCircle className="h-4 w-4" />
      case 'abandoned':
        return <XCircle className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className={cn('flex justify-center p-4', className)}>
        <div className="animate-pulse h-10 w-full bg-muted rounded-md"></div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Status and Progress Display */}
      <div className="flex flex-col space-y-2">
        {progress ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(progress.status)}
                <span className="font-medium">{formatStatus(progress.status)}</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={updating}>
                    Change Status <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleStatusChange('not_started')}>
                    <BookMarked className="mr-2 h-4 w-4" /> Want to Read
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                    <Clock className="mr-2 h-4 w-4" /> Currently Reading
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('on_hold')}>
                    <PauseCircle className="mr-2 h-4 w-4" /> On Hold
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('abandoned')}>
                    <XCircle className="mr-2 h-4 w-4" /> Abandoned
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Progress bar */}
            {progress.percentage !== undefined && progress.percentage > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Progress: {progress.percentage}%</span>
                  {progress.current_page && progress.total_pages && (
                    <span>
                      Page {progress.current_page} of {progress.total_pages}
                    </span>
                  )}
                </div>
                <Progress value={progress.percentage} className="h-2" />
              </div>
            )}

            {/* Dates */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
              {progress.start_date && (
                <div>Started: {format(new Date(progress.start_date), 'MMM d, yyyy')}</div>
              )}
              {progress.finish_date && (
                <div>Finished: {format(new Date(progress.finish_date), 'MMM d, yyyy')}</div>
              )}
            </div>

            {/* Update Progress Button */}
            <div className="flex justify-end mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUpdateDialog(true)}
              >
                Update Progress
              </Button>
              <ReusableModal
                open={showUpdateDialog}
                onOpenChange={setShowUpdateDialog}
                title="Update Reading Progress"
                description="Track your reading journey for this book."
                footer={
                  <>
                    <Button variant="outline" onClick={handleDeleteProgress} disabled={updating}>
                      Delete Progress
                    </Button>
                    <Button onClick={handleProgressUpdate} disabled={updating}>
                      {updating ? 'Saving...' : 'Save Progress'}
                    </Button>
                  </>
                }
              >
                <div className="grid gap-4">
                    {totalPages > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="current-page">Current Page</Label>
                          <Input
                            id="current-page"
                            type="number"
                            min="0"
                            max={totalPages}
                            value={currentPage || ''}
                            onChange={(e) =>
                              setCurrentPage(e.target.value ? Number(e.target.value) : undefined)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="total-pages">Total Pages</Label>
                          <Input id="total-pages" type="number" value={totalPages} disabled />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !startDate && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>Finish Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !finishDate && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {finishDate ? format(finishDate, 'PPP') : 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={finishDate}
                              onSelect={setFinishDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add your thoughts or notes about this book..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
                      <Label htmlFor="public">Share my progress with friends</Label>
                    </div>
                </div>
              </ReusableModal>
            </div>
          </>
        ) : (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Track your reading progress</span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={updating}>
                  Add to My Books <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStatusChange('not_started')}>
                  <BookMarked className="mr-2 h-4 w-4" /> Want to Read
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                  <Clock className="mr-2 h-4 w-4" /> Currently Reading
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Completed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('on_hold')}>
                  <PauseCircle className="mr-2 h-4 w-4" /> On Hold
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('abandoned')}>
                  <XCircle className="mr-2 h-4 w-4" /> Abandoned
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  )
}
