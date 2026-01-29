'use client'

import { useState, useEffect } from 'react'
import { ReusableModal } from '@/components/ui/reusable-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CustomShelf } from '@/types/phase3'
import { Globe, Lock } from 'lucide-react'
import { useShelfStore } from '@/lib/stores/shelf-store'
import { useToast } from '@/hooks/use-toast'

const SHELF_ICONS = [
  '📚',
  '⭐',
  '❤️',
  '🎯',
  '🔥',
  '🌟',
  '📖',
  '✨',
  '🎨',
  '💡',
]

const SHELF_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
]

interface ShelfCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (shelf: CustomShelf) => void
  defaultName?: string
  autoAddBookId?: string
  autoAddBookTitle?: string
}

export function ShelfCreateDialog({
  open,
  onOpenChange,
  onCreated,
  defaultName = '',
  autoAddBookId,
  autoAddBookTitle,
}: ShelfCreateDialogProps) {
  const { createShelf, addBookToShelf, loading } = useShelfStore()
  const { toast } = useToast()
  const [name, setName] = useState(defaultName)
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('📚')
  const [color, setColor] = useState('#3B82F6')
  const [isPublic, setIsPublic] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setName(defaultName)
      setDescription('')
      setIcon('📚')
      setColor('#3B82F6')
      setIsPublic(true)
      setError('')
    }
  }, [open, defaultName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!name.trim()) {
      setError('Shelf name is required')
      return
    }

    if (name.length > 100) {
      setError('Shelf name must be 100 characters or less')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createShelf({
        name: name.trim(),
        description: description.trim() || undefined,
        icon: icon || undefined,
        color: color || undefined,
        isPublic,
      })

      if (result) {
        // Auto-add book if provided (from Add to Shelf flow)
        if (autoAddBookId && result.id) {
          try {
            await addBookToShelf(result.id as any, autoAddBookId as any)
            toast({
              title: 'Shelf created and book added!',
              description: `"${autoAddBookTitle || 'Book'}" has been added to "${result.name}"`,
            })
          } catch (addError) {
            // Shelf created but book add failed - still show success for shelf
            toast({
              title: 'Shelf created',
              description: `Created "${result.name}" but failed to add book. You can add it manually.`,
              variant: 'default',
            })
          }
        } else {
          toast({
            title: 'Shelf created',
            description: `"${result.name}" has been created successfully`,
          })
        }

        // Call onCreated callback
        if (onCreated) {
          onCreated(result)
        }

        // Reset form and close
        setName('')
        setDescription('')
        setIcon('📚')
        setColor('#3B82F6')
        setIsPublic(true)
        onOpenChange(false)
      } else {
        setError('Failed to create shelf. Please try again.')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create shelf'
      setError(message)
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading = loading || isSubmitting

  return (
    <ReusableModal
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Shelf"
      description="Create a custom shelf to organize your books"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Shelf'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
            {error}
          </div>
        )}

        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="shelf-name">
            Shelf Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="shelf-name"
            placeholder="e.g., Summer Reads"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            disabled={isLoading}
            className="focus-visible:ring-primary"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            {name.length}/100 characters
          </p>
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <Label htmlFor="shelf-description">Description</Label>
          <Textarea
            id="shelf-description"
            placeholder="Add an optional description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            disabled={isLoading}
            className="resize-none h-20"
          />
          <p className="text-xs text-muted-foreground">
            {description.length}/500 characters
          </p>
        </div>

        {/* Icon Selection */}
        <div className="space-y-2">
          <Label>Icon</Label>
          <div className="grid grid-cols-5 gap-2">
            {SHELF_ICONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                disabled={isLoading}
                className={`p-3 rounded-lg border-2 transition-all text-2xl ${
                  icon === emoji
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Color Selection */}
        <div className="space-y-2">
          <Label>Color</Label>
          <div className="grid grid-cols-4 gap-3">
            {SHELF_COLORS.map((shelfColor) => (
              <button
                key={shelfColor}
                type="button"
                onClick={() => setColor(shelfColor)}
                disabled={isLoading}
                className={`w-12 h-12 rounded-lg border-2 transition-all ${
                  color === shelfColor
                    ? 'border-gray-800 dark:border-gray-200 scale-110'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: shelfColor }}
                title={shelfColor}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">Preview:</p>
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full border border-gray-300"
              style={{ backgroundColor: color }}
            />
            <span className="text-lg">{icon}</span>
            <span className="font-semibold">{name || 'Shelf Name'}</span>
          </div>
        </div>

        {/* Visibility Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe className="w-4 h-4 text-primary" />
              ) : (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
              <Label className="text-base">Public Shelf</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {isPublic
                ? 'Anyone can see this shelf on your profile'
                : 'Only you can see this shelf'}
            </p>
          </div>
          <Switch
            checked={isPublic}
            onCheckedChange={setIsPublic}
            disabled={isLoading}
          />
        </div>
      </form>
    </ReusableModal>
  )
}

