'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { AlbumImageLegacy } from './types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Tag } from 'lucide-react'

interface PhotoGalleryImageProps {
  image: AlbumImageLegacy
  isEditable: boolean
  showTags: boolean
  isDragging?: boolean
  onImageClick: (image: AlbumImageLegacy) => void
  onImageDelete: (imageId: number) => Promise<void>
  onImageTag: (imageId: number, tags: string[]) => Promise<void>
}

export function PhotoGalleryImage({
  image,
  isEditable,
  showTags,
  isDragging = false,
  onImageClick,
  onImageDelete,
  onImageTag,
}: PhotoGalleryImageProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isTagging, setIsTagging] = useState(false)
  const [newTags, setNewTags] = useState('')

  const handleTagSubmit = async () => {
    const tags = newTags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

    await onImageTag(Number(image.id), tags)
    setIsTagging(false)
    setNewTags('')
  }

  return (
    <motion.div
      className="photo-gallery__image-wrapper relative aspect-square overflow-hidden rounded-lg bg-muted"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Image
        src={image.url}
        alt={image.altText || image.filename || ''}
        fill
        className={`photo-gallery__image object-cover transition-opacity duration-200 ${
          isDragging ? 'opacity-50' : 'opacity-100'
        }`}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        onClick={() => !isDragging && onImageClick(image)}
      />

      {isHovered && !isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="photo-gallery__image-overlay absolute inset-0 bg-black/50 p-4 flex flex-col justify-between"
        >
          <div className="photo-gallery__image-actions flex justify-end gap-2">
            {isEditable && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="photo-gallery__image-action-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsTagging(true)
                  }}
                >
                  <Tag className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="photo-gallery__image-action-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onImageDelete(Number(image.id))
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {showTags && image.tags && image.tags.length > 0 && (
            <div className="photo-gallery__image-tags flex flex-wrap gap-2">
              {image.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="photo-gallery__image-tag">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </motion.div>
      )}

      <Dialog open={isTagging} onOpenChange={setIsTagging}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tags</DialogTitle>
          </DialogHeader>
          <div className="photo-gallery__tag-form space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="e.g., nature, landscape, sunset"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsTagging(false)}>
                Cancel
              </Button>
              <Button onClick={handleTagSubmit}>Save Tags</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
