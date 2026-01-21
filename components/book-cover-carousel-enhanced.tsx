'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback, startTransition } from 'react'
import Image from 'next/image'
import { Plus, Camera, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getBookCoverAltText, getBookGalleryAltText } from '@/utils/bookUtils'
import { supabase } from '@/lib/supabase/client'
import { EnterprisePhotoViewer } from '@/components/photo-gallery/enterprise-photo-viewer'
import { trackQueryPerformance } from '@/lib/performance-monitor'

interface BookImage {
  id: string
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

// Enterprise-grade constants
const MAX_RETRIES = 3
const RETRY_DELAY = 1000
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const thumbnailContainerRef = useRef<HTMLDivElement>(null)
  const cacheRef = useRef<Map<string, { data: BookImage[]; timestamp: number }>>(new Map())

  // Enterprise-grade input validation
  const validateInputs = useCallback((): { isValid: boolean; error: string | null } => {
    // Validate bookId
    if (!bookId || typeof bookId !== 'string' || bookId.trim() === '') {
      console.error('❌ Invalid bookId: bookId is required and must be a non-empty string')
      return { isValid: false, error: 'Invalid book ID provided.' }
    }

    if (!UUID_REGEX.test(bookId)) {
      console.error('❌ Invalid bookId format:', bookId)
      return { isValid: false, error: 'Invalid book ID format.' }
    }

    // Validate bookTitle
    if (!bookTitle || typeof bookTitle !== 'string' || bookTitle.trim() === '') {
      console.warn('⚠️ bookTitle is missing or empty')
    }

    return { isValid: true, error: null }
  }, [bookId, bookTitle])

  // Enterprise-grade retry logic with exponential backoff
  const executeWithRetry = useCallback(
    async <T,>(operation: () => Promise<T>, operationName: string): Promise<T> => {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const result = await operation()
          if (attempt > 0) {
            console.log(`✅ ${operationName} succeeded on attempt ${attempt + 1}`)
            setRetryCount(0)
          }
          return result
        } catch (error) {
          const isLastAttempt = attempt === MAX_RETRIES
          const errorMessage = error instanceof Error ? error.message : String(error)
          
          if (isLastAttempt) {
            console.error(`❌ ${operationName} failed after ${MAX_RETRIES + 1} attempts:`, errorMessage)
            throw error
          }

          const backoffDelay = RETRY_DELAY * Math.pow(2, attempt)
          console.warn(`⚠️ ${operationName} failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${backoffDelay}ms...`, errorMessage)
          setRetryCount(attempt + 1)
          await new Promise((resolve) => setTimeout(resolve, backoffDelay))
        }
      }
      throw new Error(`${operationName} failed after all retries`)
    },
    []
  )

  // Transform image data to BookImage format with type safety
  const transformImageToBookImage = useCallback((img: any, imageType: 'book_cover_front' | 'book_cover_back' | 'book_gallery', displayOrder: number): BookImage | null => {
    if (!img || !img.id || !img.url) {
      console.warn('⚠️ Invalid image data:', img)
      return null
    }

    return {
      id: img.id,
      image_id: img.id,
      image_url: img.url,
      thumbnail_url: img.thumbnail_url || null,
      large_url: img.large_url || null,
      medium_url: img.medium_url || null,
      alt_text: img.alt_text || null,
      caption: img.caption || null,
      image_type: imageType,
      display_order: displayOrder,
      is_cover: imageType === 'book_cover_front',
      is_featured: (img.metadata?.is_featured || false) as boolean,
      created_at: img.created_at || new Date().toISOString(),
    }
  }, [])

  // Fetch book images with enterprise-grade implementation
  const fetchBookImages = useCallback(
    async (append = false) => {
      try {
        // Input validation
        const validation = validateInputs()
        if (!validation.isValid) {
          setError(validation.error)
          setLoading(false)
          return
        }

        setError(null)

        // Check cache first
        const cacheKey = `book_images_${bookId}`
        const cached = cacheRef.current.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          console.log('🚀 Cache hit for:', cacheKey)
          const cachedImages = cached.data
          
          startTransition(() => {
            if (append) {
              setImages((prev) => [...prev, ...cachedImages])
            } else {
              setImages(cachedImages)
            }
            setSelectedImageIndex(0)
            setRetryCount(0)
          })
          setLoading(false)
          return
        }

        console.log('📥 Fetching from database:', cacheKey)

        // Fetch front cover image using books.cover_image_id foreign key relationship
        const frontCoverData = await executeWithRetry(async () => {
          return trackQueryPerformance('fetchBookFrontCover', async () => {
            const { data: bookData, error } = await supabase
              .from('books')
              .select('cover_image_id, cover_image:images!books_cover_image_id_fkey(id, url, alt_text, thumbnail_url, large_url, medium_url, caption, created_at)')
              .eq('id', bookId)
              .single()

            if (error) {
              throw new Error(`Failed to fetch front cover: ${error.message}`)
            }
            
            // Return the cover_image from the foreign key relationship
            // Check if cover_image exists and is not deleted
            const typedBookData = bookData as any
            if (typedBookData?.cover_image) {
              // Check if image is deleted (though foreign key join should handle this)
              const coverImage = typedBookData.cover_image
              if (coverImage.id && coverImage.url) {
                return coverImage
              }
            }
            return null
          })
        }, 'Fetch front cover')

        // Fetch back cover image directly from images table using entity_id and image_type
        const backCoverData = await executeWithRetry(async () => {
          return trackQueryPerformance('fetchBookBackCover', async () => {
            const { data, error } = await supabase
              .from('images')
              .select('id, url, alt_text, thumbnail_url, large_url, medium_url, caption, created_at')
              .eq('entity_id', bookId)
              .eq('image_type', 'book_cover_back')
              .is('deleted_at', null)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            if (error) {
              throw new Error(`Failed to fetch back cover: ${error.message}`)
            }

            return data || null
          })
        }, 'Fetch back cover')

        // Fetch gallery images directly from images table using entity_id and image_type
        const galleryData = await executeWithRetry(async () => {
          return trackQueryPerformance('fetchBookGalleryImages', async () => {
            const { data, error } = await supabase
              .from('images')
              .select('id, url, alt_text, thumbnail_url, large_url, medium_url, caption, created_at')
              .eq('entity_id', bookId)
              .eq('image_type', 'book_gallery')
              .is('deleted_at', null)
              .order('created_at', { ascending: false })

            if (error) {
              throw new Error(`Failed to fetch gallery images: ${error.message}`)
            }

            return data || []
          })
        }, 'Fetch gallery images')

        // Transform images to BookImage format
        const transformedImages: BookImage[] = []

        // Front cover (always first)
        if (frontCoverData) {
          const transformed = transformImageToBookImage(frontCoverData, 'book_cover_front', 0)
          if (transformed) transformedImages.push(transformed)
        }

        // Back cover (second)
        if (backCoverData) {
          const transformed = transformImageToBookImage(backCoverData, 'book_cover_back', 1)
          if (transformed) transformedImages.push(transformed)
        }

        // Gallery images (follow)
        if (galleryData && Array.isArray(galleryData)) {
          galleryData.forEach((galleryImg, index) => {
            const transformed = transformImageToBookImage(galleryImg, 'book_gallery', index + 2)
            if (transformed) transformedImages.push(transformed)
          })
        }

        // Cache the results
        cacheRef.current.set(cacheKey, { data: transformedImages, timestamp: Date.now() })
        console.log(`✅ Fetched ${transformedImages.length} images and cached for book: ${bookId}`)

        // Update state with transition for non-urgent updates
        startTransition(() => {
          if (append) {
            setImages((prev) => [...prev, ...transformedImages])
          } else {
            setImages(transformedImages)
          }

          // Set selected image index
          if (currentImageId) {
            const currentIndex = transformedImages.findIndex((img) => img.image_id === currentImageId)
            if (currentIndex >= 0) {
              setSelectedImageIndex(currentIndex)
            } else {
              const frontCoverIndex = transformedImages.findIndex((img) => img.image_type === 'book_cover_front')
              if (frontCoverIndex >= 0) {
                setSelectedImageIndex(frontCoverIndex)
              } else if (transformedImages.length > 0) {
                setSelectedImageIndex(0)
              }
            }
          } else {
            const frontCoverIndex = transformedImages.findIndex((img) => img.image_type === 'book_cover_front')
            if (frontCoverIndex >= 0) {
              setSelectedImageIndex(frontCoverIndex)
            } else if (transformedImages.length > 0) {
              setSelectedImageIndex(0)
            }
          }

          setRetryCount(0)
        })
      } catch (err) {
        console.error('❌ Error fetching book images:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load images. Please try again.'
        
        // Determine user-friendly error message
        let userMessage = 'Failed to load images. Please try again.'
        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          userMessage = 'Unable to connect. Please check your connection.'
        } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
          userMessage = 'Too many requests. Please wait a moment.'
        } else if (errorMessage.includes('Invalid book ID')) {
          userMessage = 'Invalid book ID provided.'
        }

        setError(userMessage)
        setImages([])
      } finally {
        setLoading(false)
      }
    },
    [bookId, currentImageId, validateInputs, executeWithRetry, transformImageToBookImage]
  )

  // Main effect to fetch images
  useEffect(() => {
    let isMounted = true

    const loadImages = async () => {
      if (!isMounted) return
      await fetchBookImages()
    }

    loadImages()

    // Listen for image changes and invalidate cache
    const handleImageChange = () => {
      if (!isMounted) return
      console.log('🔄 Image changed event received, invalidating cache and refetching')
      const cacheKey = `book_images_${bookId}`
      cacheRef.current.delete(cacheKey)
      loadImages()
    }

    window.addEventListener('entityImageChanged', handleImageChange)
    return () => {
      isMounted = false
      window.removeEventListener('entityImageChanged', handleImageChange)
    }
  }, [bookId, currentImageId, fetchBookImages])

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

  // Error state with retry option
  if (error && !loading) {
    return (
      <div className="space-y-4">
        <Card className="w-full aspect-[2/3] flex items-center justify-center bg-muted">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50 text-destructive" />
            <p className="text-sm font-medium mb-1">Failed to load images</p>
            <p className="text-xs mb-4">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null)
                setRetryCount(0)
                fetchBookImages()
              }}
            >
              Retry
            </Button>
          </div>
        </Card>
      </div>
    )
  }

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
              alt={currentImage.image_type === 'book_gallery' 
                ? getBookGalleryAltText(bookTitle, currentImage.caption || undefined)
                : getBookCoverAltText(bookTitle, currentImage.image_type === 'book_cover_back' ? 'back' : 'front')}
              title={currentImage.image_type === 'book_gallery' 
                ? getBookGalleryAltText(bookTitle, currentImage.caption || undefined)
                : getBookCoverAltText(bookTitle, currentImage.image_type === 'book_cover_back' ? 'back' : 'front')}
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
                  alt={getBookGalleryAltText(bookTitle, galleryImage.caption || undefined)}
                  title={getBookGalleryAltText(bookTitle, galleryImage.caption || undefined)}
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
