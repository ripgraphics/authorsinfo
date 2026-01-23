/**
 * Link Preview Editor Component
 * Edit link preview metadata
 * Phase 2: Enterprise Link Post Component
 */

'use client'

import React, { useState } from 'react'
import { Save, X, Image as ImageIcon, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { LinkPreviewMetadata } from '@/types/link-preview'

export interface LinkPreviewEditorProps {
  metadata: LinkPreviewMetadata
  onSave: (metadata: LinkPreviewMetadata) => Promise<void>
  onCancel: () => void
  className?: string
}

/**
 * Link Preview Editor
 */
export function LinkPreviewEditor({
  metadata,
  onSave,
  onCancel,
  className,
}: LinkPreviewEditorProps) {
  const [title, setTitle] = useState(metadata.title || '')
  const [description, setDescription] = useState(metadata.description || '')
  const [imageUrl, setImageUrl] = useState(metadata.image_url || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updatedMetadata: LinkPreviewMetadata = {
        ...metadata,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
      }
      await onSave(updatedMetadata)
    } catch (error) {
      console.error('Error saving metadata:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className={cn(
        'space-y-4 rounded-lg border bg-card p-4',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Edit Link Preview</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
            className="mt-1"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="imageUrl">Image URL</Label>
          <div className="mt-1 flex gap-2">
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            {imageUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImageUrl('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {imageUrl && (
            <div className="mt-2">
              <img
                src={imageUrl}
                alt="Preview"
                className="h-32 w-full rounded border object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}
