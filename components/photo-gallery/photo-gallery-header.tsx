'use client'

import { useState } from 'react'
import { PhotoGalleryHeaderProps } from './types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Share2, Image as ImageIcon, Eye, Heart } from 'lucide-react'

export function PhotoGalleryHeader({
  albumId,
  entityType,
  entityId,
  isEditable,
  showStats,
  showShare,
  onUpload,
}: PhotoGalleryHeaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [shareLink, setShareLink] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed')
    const files = Array.from(e.target.files || [])
    console.log('Selected files:', files.length)

    if (files.length === 0) {
      console.log('No files selected')
      return
    }

    try {
      console.log('Starting upload...')
      setIsUploading(true)
      await onUpload(files)
      console.log('Upload completed successfully')
    } catch (error) {
      console.error('Upload error in header:', error)
    } finally {
      setIsUploading(false)
      // Reset the input
      e.target.value = ''
    }
  }

  const handleUploadClick = () => {
    console.log('Upload button clicked')
    const fileInput = document.getElementById('photo-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.click()
    } else {
      console.error('File input not found')
    }
  }

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/gallery/${albumId || `${entityType}/${entityId}`}`
      setShareLink(url)
      setIsShareDialogOpen(true)
    } catch (error) {
      console.error('Failed to generate share link:', error)
    }
  }

  return (
    <div className="photo-gallery__header flex items-center justify-between gap-4 p-4">
      <div className="photo-gallery__header-left flex items-center gap-4">
        <h2 className="photo-gallery__title text-2xl font-semibold">Photo Gallery</h2>

        {showStats && (
          <div className="photo-gallery__stats flex items-center gap-4">
            <div className="photo-gallery__stat flex items-center gap-1">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">24 photos</span>
            </div>
            <div className="photo-gallery__stat flex items-center gap-1">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">1.2k views</span>
            </div>
            <div className="photo-gallery__stat flex items-center gap-1">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">156 likes</span>
            </div>
          </div>
        )}
      </div>

      <div className="photo-gallery__header-right flex items-center gap-2">
        {isEditable && (
          <div className="photo-gallery__upload">
            <Input
              type="file"
              id="photo-upload"
              className="hidden"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <Button
              variant="default"
              size="sm"
              className="photo-gallery__upload-button"
              disabled={isUploading}
              onClick={handleUploadClick}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Photos'}
            </Button>
          </div>
        )}

        {showShare && (
          <Button
            variant="outline"
            size="sm"
            className="photo-gallery__share-button"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </div>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Gallery</DialogTitle>
          </DialogHeader>
          <div className="photo-gallery__share-dialog space-y-4">
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input value={shareLink} readOnly className="photo-gallery__share-input" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink)
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
