'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2, Globe, Lock, Download, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Shelf {
  id: string
  name: string
  isDefault?: boolean
  isPublic?: boolean
}

interface ShelfBulkActionsProps {
  shelves: Shelf[]
  selectedShelves: Set<string>
  onSelectionChange: (selected: Set<string>) => void
  onBulkDelete: (shelfIds: string[]) => Promise<void>
  onBulkPrivacyChange: (shelfIds: string[], isPublic: boolean) => Promise<void>
  onBulkExport?: (shelfIds: string[]) => Promise<void>
  className?: string
}

export function ShelfBulkActions({
  shelves,
  selectedShelves,
  onSelectionChange,
  onBulkDelete,
  onBulkPrivacyChange,
  onBulkExport,
  className,
}: ShelfBulkActionsProps) {
  const { toast } = useToast()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const selectedCount = selectedShelves.size
  const hasSelection = selectedCount > 0

  // Filter out default shelves from selected (can't delete/modify default shelves)
  const actionableShelves = Array.from(selectedShelves).filter((id) => {
    const shelf = shelves.find((s) => s.id === id)
    return shelf && !shelf.isDefault
  })

  const canSelectAll = shelves.length > 0
  const allSelected = selectedShelves.size === shelves.filter((s) => !s.isDefault).length
  const someSelected = selectedShelves.size > 0 && !allSelected

  const checkboxRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (checkboxRef.current) {
      const input = checkboxRef.current.querySelector('input[type="checkbox"]') as HTMLInputElement
      if (input) {
        input.indeterminate = someSelected
      }
    }
  }, [someSelected])

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange(new Set())
    } else {
      const selectableIds = new Set(
        shelves.filter((s) => !s.isDefault).map((s) => s.id)
      )
      onSelectionChange(selectableIds)
    }
  }

  const handleBulkDelete = async () => {
    if (actionableShelves.length === 0) return

    try {
      setIsProcessing(true)
      await onBulkDelete(actionableShelves)
      onSelectionChange(new Set())
      setIsDeleteDialogOpen(false)
      toast({
        title: 'Success',
        description: `Deleted ${actionableShelves.length} shelf${actionableShelves.length > 1 ? 's' : ''}`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete shelves',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkPrivacyChange = async (isPublic: boolean) => {
    if (actionableShelves.length === 0) return

    try {
      setIsProcessing(true)
      await onBulkPrivacyChange(actionableShelves, isPublic)
      toast({
        title: 'Success',
        description: `Updated privacy for ${actionableShelves.length} shelf${actionableShelves.length > 1 ? 's' : ''}`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update privacy',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExport = async () => {
    if (!onBulkExport || actionableShelves.length === 0) return

    try {
      setIsProcessing(true)
      await onBulkExport(actionableShelves)
      toast({
        title: 'Success',
        description: `Exported ${actionableShelves.length} shelf${actionableShelves.length > 1 ? 's' : ''}`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to export shelves',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!hasSelection) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={allSelected}
            ref={checkboxRef}
            onCheckedChange={handleSelectAll}
            disabled={!canSelectAll}
          />
          <span>Select shelves for bulk actions</span>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg border">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={allSelected}
            ref={checkboxRef}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm font-medium">
            {selectedCount} shelf{selectedCount > 1 ? 's' : ''} selected
          </span>
          {actionableShelves.length < selectedCount && (
            <span className="text-xs text-muted-foreground">
              ({actionableShelves.length} actionable)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectionChange(new Set())}
            disabled={isProcessing}
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isProcessing || actionableShelves.length === 0}>
                Bulk Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleBulkPrivacyChange(true)}>
                <Globe className="w-4 h-4 mr-2" />
                Make Public
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkPrivacyChange(false)}>
                <Lock className="w-4 h-4 mr-2" />
                Make Private
              </DropdownMenuItem>
              {onBulkExport && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shelves</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {actionableShelves.length} shelf
              {actionableShelves.length > 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

