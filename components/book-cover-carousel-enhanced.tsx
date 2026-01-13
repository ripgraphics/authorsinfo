'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Plus, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getBookCoverAltText, getBookGalleryAltText } from '@/utils/bookUtils'
import { supabase } from '@/lib/supabase/client'

interface BookImage {
  id: string
  album_id: string
  image_id: string
  image_url: string
  thumbnail_url: string | null
  large_url: string | null
  medium_url: string | null
  alt_text: string | null
  caption: string | null
  image_type: 'book_cover_front' | 'book_cover_back' | 'book_gallery'
  display_order: number
  is_cover: boolean
  is_featured: boolean
  created_at: string
}

interface BookCoverCarouselEnhancedProps {
  bookId: string
  bookTitle: string
  currentImageId?: string
  canEdit?: boolean
  onImageChange?: (imageId: string, imageUrl: string) => void
  onUploadClick?: () => void
}

export function BookCoverCarouselEnhanced({
  bookId,
  bookTitle,
  currentImageId,
  canEdit = false,
  onImageChange,
  onUploadClick,
}: BookCoverCarouselEnhancedProps) {
  const [images, setImages] = useState<BookImage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch book images using the database function
  useEffect(() => {
    const fetchBookImages = async () => {
      try {
        setLoading(true)
        
        // Call the get_book_images function
        const { data, error } = await supabase.rpc('get_book_images', {
          p_book_id: bookId,
          p_image_type: undefined, // Get all types (undefined means optional parameter not provided)
        } as any)

        if (error) {
          console.error('Error fetching book images:', error)
          setImages([])
          return
        }

        const imagesData = data as any[]
        if (!imagesData || imagesData.length === 0) {
          setImages([])
          return
        }

        // Transform to BookImage format
        const transformedImages: BookImage[] = imagesData.map((img: any) => ({
          id: img.id,
          album_id: img.album_id,
          image_id: img.image_id,
          image_url: img.image_url,
          thumbnail_url: img.thumbnail_url,
          large_url: img.large_url,
          medium_url: img.medium_url,
          alt_text: img.alt_text,
          caption: img.caption,
          image_type: img.image_type,
          display_order: img.display_order,
          is_cover: img.is_cover,
          is_featured: img.is_featured,
          created_at: img.created_at,
        }))

        // Sort: front cover first, then back cover, then gallery by display_order
        const sortedImages = transformedImages.sort((a, b) => {
          // Front cover always first
          if (a.image_type === 'book_cover_front' && b.image_type !== 'book_cover_front') return -1
          if (a.image_type !== 'book_cover_front' && b.image_type === 'book_cover_front') return 1
          
          // Back cover second
          if (a.image_type === 'book_cover_back' && b.image_type === 'book_gallery') return -1
          if (a.image_type === 'book_gallery' && b.image_type === 'book_cover_back') return 1
          
          // Within same type, sort by display_order
          if (a.image_type === b.image_type) {
            return a.display_order - b.display_order
          }
          
          return 0
        })

        setImages(sortedImages)
        
        // Set selected image to current cover or first image
        if (currentImageId) {
          const currentIndex = sortedImages.findIndex(img => img.image_id === currentImageId)
          if (currentIndex >= 0) {
            setSelectedImageIndex(currentIndex)
          }
        }
      } catch (error) {
        console.error('Error fetching book images:', error)
        setImages([])
      } finally {
        setLoading(false)
      }
    }

    fetchBookImages()

    // Listen for image changes
    const handleImageChange = () => {
      fetchBookImages()
    }

    window.addEventListener('entityImageChanged', handleImageChange)
    return () => {
      window.removeEventListener('entityImageChanged', handleImageChange)
    }
  }, [bookId, currentImageId])

  const frontCover = images.find(img => img.image_type === 'book_cover_front')
  const backCover = images.find(img => img.image_type === 'book_cover_back')
  const galleryImages = images.filter(img => img.image_type === 'book_gallery')

  // Get currently displayed image
  const currentImage = images[selectedImageIndex] || frontCover || images[0]

  const handleThumbnailClick = (index: number) => {
    setSelectedImageIndex(index)
    const image = images[index]
    if (image && onImageChange) {
      onImageChange(image.image_id, image.image_url)
    }
  }

  const handleMainImageClick = () => {
    if (images.length > 1) {
      setIsModalOpen(true)
    }
  }

  const handleModalNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
    } else {
      setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="w-full aspect-[2/3] animate-pulse bg-muted" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="w-10 h-[60px] animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="w-full aspect-[2/3] flex items-center justify-center bg-muted">
          <div className="text-center text-muted-foreground">
            <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No cover image</p>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={onUploadClick}
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload Cover
              </Button>
            )}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Cover Image */}
      <Card
        className="book-page__cover-card overflow-hidden relative cursor-pointer"
        onClick={handleMainImageClick}
      >
        {currentImage && (
          <div className="book-page__cover-image w-full h-full relative aspect-[2/3]">
            <Image
              src={currentImage.large_url || currentImage.image_url}
              alt={currentImage.alt_text || getBookCoverAltText(bookTitle, currentImage.image_type === 'book_cover_back' ? 'back' : 'front')}
              title={currentImage.alt_text || getBookCoverAltText(bookTitle, currentImage.image_type === 'book_cover_back' ? 'back' : 'front')}
              width={400}
              height={600}
              className="w-full aspect-[2/3] object-cover"
              priority={currentImage.image_type === 'book_cover_front'}
            />
            {images.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {selectedImageIndex + 1} / {images.length}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Thumbnail Row */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {/* Front Cover Thumbnail (always first) */}
        {frontCover && (
          <button
            onClick={() => handleThumbnailClick(images.indexOf(frontCover))}
            className={`flex-shrink-0 relative w-20 h-30 rounded-md overflow-hidden border-2 transition-all ${
              selectedImageIndex === images.indexOf(frontCover)
                ? 'border-primary ring-2 ring-primary ring-offset-2'
                : 'border-transparent hover:border-muted-foreground/50'
            }`}
          >
            <Image
              src={frontCover.thumbnail_url || frontCover.image_url}
              alt={getBookCoverAltText(bookTitle, 'front')}
              title={getBookCoverAltText(bookTitle, 'front')}
              fill
              className="object-cover"
              sizes="80px"
            />
            {selectedImageIndex === images.indexOf(frontCover) && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <div className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded font-medium">
                  Viewing
                </div>
              </div>
            )}
          </button>
        )}

        {/* Back Cover Thumbnail (if exists) */}
        {backCover && (
          <button
            onClick={() => handleThumbnailClick(images.indexOf(backCover))}
            className={`flex-shrink-0 relative w-10 h-[60px] rounded-md overflow-hidden border-2 transition-all ${
              selectedImageIndex === images.indexOf(backCover)
                ? 'border-primary ring-2 ring-primary ring-offset-2'
                : 'border-transparent hover:border-muted-foreground/50'
            }`}
          >
            <Image
              src={backCover.thumbnail_url || backCover.image_url}
              alt={getBookCoverAltText(bookTitle, 'back')}
              title={getBookCoverAltText(bookTitle, 'back')}
              fill
              className="object-cover"
              sizes="40px"
            />
            {selectedImageIndex === images.indexOf(backCover) && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <div className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded font-medium">
                  Viewing
                </div>
              </div>
            )}
          </button>
        )}

        {/* Gallery Image Thumbnails */}
        {galleryImages.map((galleryImage) => {
          const index = images.indexOf(galleryImage)
          return (
            <button
              key={galleryImage.id}
              onClick={() => handleThumbnailClick(index)}
              className={`flex-shrink-0 relative w-20 h-30 rounded-md overflow-hidden border-2 transition-all ${
                selectedImageIndex === index
                  ? 'border-primary ring-2 ring-primary ring-offset-2'
                  : 'border-transparent hover:border-muted-foreground/50'
              }`}
            >
              <Image
                src={galleryImage.thumbnail_url || galleryImage.image_url}
                alt={galleryImage.alt_text || getBookGalleryAltText(bookTitle, galleryImage.caption || undefined)}
                title={galleryImage.alt_text || getBookGalleryAltText(bookTitle, galleryImage.caption || undefined)}
                fill
                className="object-cover"
                sizes="80px"
              />
              {selectedImageIndex === index && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <div className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded font-medium">
                    Viewing
                  </div>
                </div>
              )}
            </button>
          )
        })}

        {/* Add Image Button (if can edit) */}
        {canEdit && (
          <button
            onClick={onUploadClick}
            className="flex-shrink-0 w-10 h-[60px] rounded-md border-2 border-dashed border-muted-foreground/50 hover:border-primary transition-colors flex items-center justify-center bg-muted/30"
          >
            <Plus className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Full-Screen Carousel Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl w-full p-0 gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Book Images</DialogTitle>
          </DialogHeader>
          
          {currentImage && (
            <div className="relative w-full aspect-[2/3] bg-black">
              <Image
                src={currentImage.large_url || currentImage.image_url}
                alt={currentImage.alt_text || getBookCoverAltText(bookTitle, currentImage.image_type === 'book_cover_back' ? 'back' : 'front')}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 800px"
              />
              
              {/* Navigation Buttons */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => handleModalNavigation('prev')}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => handleModalNavigation('next')}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
              
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
              
              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1.5 rounded-full">
                  {selectedImageIndex + 1} of {images.length}
                </div>
              )}
              
              {/* Image Info */}
              {currentImage.caption && (
                <div className="absolute bottom-4 left-4 bg-black/50 text-white text-sm px-3 py-1.5 rounded max-w-md">
                  {currentImage.caption}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
