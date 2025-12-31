'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Share2 } from 'lucide-react'
import { CloseButton } from '@/components/ui/close-button'

interface SimplePhoto {
  id: string
  url: string
  thumbnail_url?: string
  alt_text?: string
  description?: string
  created_at: string
}

interface SimplePhotoViewerProps {
  isOpen: boolean
  onClose: () => void
  photos: SimplePhoto[]
  currentIndex: number
  onIndexChange: (index: number) => void
}

export function SimplePhotoViewer({
  isOpen,
  onClose,
  photos,
  currentIndex,
  onIndexChange,
}: SimplePhotoViewerProps) {
  const [zoom, setZoom] = useState(1)

  const currentPhoto = photos[currentIndex]

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          if (currentIndex > 0) onIndexChange(currentIndex - 1)
          break
        case 'ArrowRight':
          if (currentIndex < photos.length - 1) onIndexChange(currentIndex + 1)
          break
      }
    },
    [isOpen, currentIndex, photos.length, onIndexChange, onClose]
  )

  // Attach keyboard listener
  useEffect(() => {
    if (!isOpen) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  const handleDownload = () => {
    if (!currentPhoto) return

    const link = document.createElement('a')
    link.href = currentPhoto.url
    link.download = `photo-${currentPhoto.id}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleShare = async () => {
    if (!currentPhoto) return

    try {
      const shareUrl = `${window.location.origin}/photos/${currentPhoto.id}`
      await navigator.clipboard.writeText(shareUrl)
      // You could show a toast here
    } catch (error) {
      console.error('Error sharing photo:', error)
    }
  }

  if (!currentPhoto) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95">
        <DialogTitle className="sr-only">Photo Viewer</DialogTitle>
        <div className="flex h-[95vh] items-center justify-center relative">
          {/* Navigation Buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 z-10 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => currentIndex > 0 && onIndexChange(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => currentIndex < photos.length - 1 && onIndexChange(currentIndex + 1)}
            disabled={currentIndex === photos.length - 1}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="text-white bg-black/50 px-3 py-1 rounded-sm">
              {currentIndex + 1} of {photos.length}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setZoom(zoom === 1 ? 2 : 1)}
              >
                {zoom === 1 ? <ZoomIn className="h-4 w-4" /> : <ZoomOut className="h-4 w-4" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>

              <CloseButton
                onClick={onClose}
                className="text-white hover:opacity-80 transition-opacity"
              />
            </div>
          </div>

          {/* Main Image */}
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={currentPhoto.url}
              alt={currentPhoto.alt_text || 'Photo'}
              fill
              className="object-contain"
              style={{
                transform: `scale(${zoom})`,
                transition: 'transform 0.3s ease',
              }}
              sizes="100vw"
            />
          </div>

          {/* Photo Info */}
          {currentPhoto.description && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white p-4 rounded-sm">
              <p>{currentPhoto.description}</p>
              <p className="text-sm text-gray-300 mt-2">
                {new Date(currentPhoto.created_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
