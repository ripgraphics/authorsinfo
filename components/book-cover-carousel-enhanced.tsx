'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import { Plus, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getBookCoverAltText, getBookGalleryAltText } from '@/utils/bookUtils'
import { supabase } from '@/lib/supabase/client'
import { EnterprisePhotoViewer } from '@/components/photo-gallery/enterprise-photo-viewer'

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
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const thumbnailContainerRef = useRef<HTMLDivElement>(null)

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
    // Always open modal, even for single images (allows zoom/rotation)
    setIsModalOpen(true)
  }

  // Transform BookImage[] to Photo[] format for EnterprisePhotoViewer
  const transformedPhotos = useMemo(() => {
    return images.map((img) => ({
      id: img.image_id,
      url: img.large_url || img.image_url,
      thumbnail_url: img.thumbnail_url || undefined,
      alt_text: img.alt_text || getBookCoverAltText(bookTitle, img.image_type === 'book_cover_back' ? 'back' : 'front'),
      description: img.caption || undefined,
      created_at: img.created_at,
      metadata: {
        image_type: img.image_type,
        display_order: img.display_order,
        is_cover: img.is_cover,
        is_featured: img.is_featured,
      },
      is_featured: img.is_featured,
      is_cover: img.is_cover,
    }))
  }, [images, bookTitle])

  // Touch/swipe handlers
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && images.length > 1) {
      // Swipe left - go to next image
      const newIndex = selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0
      setSelectedImageIndex(newIndex)
    }
    if (isRightSwipe && images.length > 1) {
      // Swipe right - go to previous image
      const newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1
      setSelectedImageIndex(newIndex)
    }
  }

  // Calculate if thumbnails need pagination dots
  // Each thumbnail is 60px wide + 8px gap = 68px per thumbnail
  // We'll show dots if there are more thumbnails than can fit in a typical viewport
  const totalThumbnails = (frontCover ? 1 : 0) + (backCover ? 1 : 0) + galleryImages.length + (canEdit ? 1 : 0)
  const [needsPaginationDots, setNeedsPaginationDots] = useState(false)
  const [thumbnailSections, setThumbnailSections] = useState(1)

  // Check if thumbnails overflow and calculate sections
  useEffect(() => {
    if (thumbnailContainerRef.current && totalThumbnails > 0) {
      const container = thumbnailContainerRef.current
      const containerWidth = container.clientWidth
      const thumbnailWidth = 68 // 60px thumbnail + 8px gap
      const thumbnailsPerVisibleRow = Math.floor(containerWidth / thumbnailWidth)
      
      const needsDots = totalThumbnails > thumbnailsPerVisibleRow
      setNeedsPaginationDots(needsDots)
      setThumbnailSections(needsDots ? Math.ceil(totalThumbnails / thumbnailsPerVisibleRow) : 1)
    }
  }, [totalThumbnails, images.length])

  // Scroll thumbnail container to show selected thumbnail
  useEffect(() => {
    if (thumbnailContainerRef.current && images.length > 0) {
      const container = thumbnailContainerRef.current
      const selectedThumbnail = container.querySelector(`[data-thumbnail-index="${selectedImageIndex}"]`) as HTMLElement
      
      if (selectedThumbnail) {
        const containerRect = container.getBoundingClientRect()
        const thumbnailRect = selectedThumbnail.getBoundingClientRect()
        
        // Check if thumbnail is outside visible area
        if (thumbnailRect.left < containerRect.left) {
          // Scroll left to show thumbnail
          container.scrollTo({
            left: container.scrollLeft + (thumbnailRect.left - containerRect.left) - 16, // 16px padding
            behavior: 'smooth'
          })
        } else if (thumbnailRect.right > containerRect.right) {
          // Scroll right to show thumbnail
          container.scrollTo({
            left: container.scrollLeft + (thumbnailRect.right - containerRect.right) + 16, // 16px padding
            behavior: 'smooth'
          })
        }
      }
    }
  }, [selectedImageIndex, images.length])

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="w-full aspect-[2/3] animate-pulse bg-muted" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="w-[60px] h-[90px] animate-pulse bg-muted" />
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
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {currentImage && (
          <div className="book-page__cover-image w-full h-full relative aspect-[2/3] flex items-center justify-center bg-muted/10">
            <Image
              src={currentImage.large_url || currentImage.image_url}
              alt={currentImage.alt_text || (currentImage.image_type === 'book_gallery' 
                ? getBookGalleryAltText(bookTitle, currentImage.caption || undefined)
                : getBookCoverAltText(bookTitle, currentImage.image_type === 'book_cover_back' ? 'back' : 'front'))}
              title={currentImage.alt_text || (currentImage.image_type === 'book_gallery' 
                ? getBookGalleryAltText(bookTitle, currentImage.caption || undefined)
                : getBookCoverAltText(bookTitle, currentImage.image_type === 'book_cover_back' ? 'back' : 'front'))}
              width={400}
              height={600}
              className={`w-full h-full ${
                currentImage.image_type === 'book_gallery' 
                  ? 'object-contain' 
                  : 'object-cover'
              }`}
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
      <div className="space-y-2">
        <div 
          ref={thumbnailContainerRef}
          className="flex gap-2 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {/* Front Cover Thumbnail (always first) */}
          {frontCover && (
            <button
              data-thumbnail-index={images.indexOf(frontCover)}
              onClick={() => handleThumbnailClick(images.indexOf(frontCover))}
              className={`flex-shrink-0 relative w-[60px] h-[90px] rounded-md overflow-hidden transition-all ${
                selectedImageIndex === images.indexOf(frontCover)
                  ? 'shadow-lg'
                  : 'shadow-sm hover:shadow-md'
              }`}
            >
              <Image
                src={frontCover.thumbnail_url || frontCover.image_url}
                alt={getBookCoverAltText(bookTitle, 'front')}
                title={getBookCoverAltText(bookTitle, 'front')}
                fill
                className="object-cover"
                sizes="60px"
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
              data-thumbnail-index={images.indexOf(backCover)}
              onClick={() => handleThumbnailClick(images.indexOf(backCover))}
              className={`flex-shrink-0 relative w-[60px] h-[90px] rounded-md overflow-hidden transition-all ${
                selectedImageIndex === images.indexOf(backCover)
                  ? 'shadow-lg'
                  : 'shadow-sm hover:shadow-md'
              }`}
            >
              <Image
                src={backCover.thumbnail_url || backCover.image_url}
                alt={getBookCoverAltText(bookTitle, 'back')}
                title={getBookCoverAltText(bookTitle, 'back')}
                fill
                className="object-cover"
                sizes="60px"
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
                data-thumbnail-index={index}
                onClick={() => handleThumbnailClick(index)}
                className={`flex-shrink-0 relative w-[60px] h-[90px] rounded-md overflow-hidden transition-all ${
                  selectedImageIndex === index
                    ? 'shadow-lg'
                    : 'shadow-sm hover:shadow-md'
                }`}
              >
                <Image
                  src={galleryImage.thumbnail_url || galleryImage.image_url}
                  alt={galleryImage.alt_text || getBookGalleryAltText(bookTitle, galleryImage.caption || undefined)}
                  title={galleryImage.alt_text || getBookGalleryAltText(bookTitle, galleryImage.caption || undefined)}
                  fill
                  className="object-cover"
                  sizes="60px"
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
              className="flex-shrink-0 w-[60px] h-[90px] rounded-md border-2 border-dashed border-muted-foreground/50 hover:border-primary transition-colors flex items-center justify-center bg-muted/30"
            >
              <Plus className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Pagination Dots - Only show when thumbnails overflow */}
        {needsPaginationDots && thumbnailSections > 1 && (
          <div className="flex justify-center gap-1.5 pt-1">
            {Array.from({ length: thumbnailSections }).map((_, index) => {
              const scrollPosition = index * (thumbnailContainerRef.current?.clientWidth || 340) // Scroll by container width
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (thumbnailContainerRef.current) {
                      const containerWidth = thumbnailContainerRef.current.clientWidth
                      thumbnailContainerRef.current.scrollTo({
                        left: index * containerWidth,
                        behavior: 'smooth'
                      })
                    }
                  }}
                  className="h-2 w-2 rounded-full transition-all bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  aria-label={`Scroll to thumbnail section ${index + 1}`}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Photo Viewer Modal */}
      {transformedPhotos.length > 0 && (
        <EnterprisePhotoViewer
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          photos={transformedPhotos}
          currentIndex={selectedImageIndex}
          onIndexChange={setSelectedImageIndex}
          entityId={bookId}
          entityType="book"
          isOwner={canEdit}
        />
      )}
    </div>
  )
}
