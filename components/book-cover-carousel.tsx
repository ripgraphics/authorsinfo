"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EntityPhotoAlbums } from '@/components/user-photo-albums'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface BookCoverCarouselProps {
  bookId: string
  currentCoverImageId?: string
  onPreview?: (imageUrl: string, imageId: string) => void
  canEdit: boolean
  onOpenAlbum?: () => void
}

interface AlbumImage {
  image_id: string
  image: {
    id: string
    url: string
    alt_text?: string
  }
  is_cover: boolean
  display_order: number
}

export function BookCoverCarousel({
  bookId,
  currentCoverImageId,
  onPreview,
  canEdit,
  onOpenAlbum
}: BookCoverCarouselProps) {
  const [images, setImages] = useState<AlbumImage[]>([])
  const [loading, setLoading] = useState(true)
  const [showAlbum, setShowAlbum] = useState(false)

  // Fetch book cover images directly from images table - Supabase as source of truth
  useEffect(() => {
    const fetchCoverImages = async () => {
      try {
        setLoading(true)
        const { supabase } = await import('@/lib/supabase/client')
        
        // Query images table directly using metadata filters - Supabase as source of truth
        // Use 'book_cover' for new uploads, but also check 'cover' for backward compatibility
        // Filter by entity_type = 'book' AND entity_id = bookId AND (image_type = 'book_cover' OR image_type = 'cover')
        const { data: coverImages, error: imagesError } = await supabase
          .from('images')
          .select('id, url, alt_text, created_at, metadata')
          .eq('metadata->>entity_type', 'book')
          .eq('metadata->>entity_id', bookId)
          .or('metadata->>image_type.eq.book_cover,metadata->>image_type.eq.cover')
          .order('created_at', { ascending: false })
        
        if (imagesError) {
          console.error('Error fetching book cover images:', imagesError)
          setImages([])
          setLoading(false)
          return
        }
        
        if (!coverImages || coverImages.length === 0) {
          console.log('No book cover images found for book:', bookId)
          setImages([])
          setLoading(false)
          return
        }
        
        console.log(`Found ${coverImages.length} book cover images for book ${bookId}`)
        
        // Transform to match AlbumImage interface
        const transformedImages: AlbumImage[] = coverImages
          .filter((img: any) => {
            // Verify this image is actually for this book
            const imgEntityId = img.metadata?.entity_id
            if (imgEntityId && imgEntityId !== bookId) {
              console.warn('Image entity_id mismatch:', img.id, 'expected', bookId, 'got', imgEntityId)
              return false
            }
            return !!img.url
          })
          .map((img: any) => ({
            image_id: img.id,
            image: {
              id: img.id,
              url: img.url,
              alt_text: img.alt_text,
              created_at: img.created_at
            },
            is_cover: img.id === currentCoverImageId, // Mark current cover
            display_order: 0 // No display_order from images table, use creation date
          }))
        
        // Sort: current cover first, then by creation date (most recent first)
        const sortedImages = transformedImages.sort((a: AlbumImage, b: AlbumImage) => {
          // Current cover first
          if (a.is_cover && !b.is_cover) return -1
          if (!a.is_cover && b.is_cover) return 1
          // Then by creation date (most recent first)
          return new Date(b.image.created_at || 0).getTime() - new Date(a.image.created_at || 0).getTime()
        })
        
        console.log('Transformed and sorted images count:', sortedImages.length)
        setImages(sortedImages)
      } catch (error) {
        console.error('Error fetching book cover images:', error)
        setImages([])
      } finally {
        setLoading(false)
      }
    }

    fetchCoverImages()
  }, [bookId, currentCoverImageId])

  // Listen for album refresh events and entity image changes
  useEffect(() => {
    const handleRefresh = () => {
      // Re-fetch images when album is updated - query images table directly
      const fetchCoverImages = async () => {
        try {
          const { supabase } = await import('@/lib/supabase/client')
          
          // Query images table directly using metadata filters - Supabase as source of truth
          const { data: coverImages, error: imagesError } = await supabase
            .from('images')
            .select('id, url, alt_text, created_at, metadata')
            .eq('metadata->>entity_type', 'book')
            .eq('metadata->>entity_id', bookId)
            .or('metadata->>image_type.eq.book_cover,metadata->>image_type.eq.cover')
            .order('created_at', { ascending: false })
          
          if (imagesError) {
            console.error('Error refetching book cover images:', imagesError)
            return
          }
          
          if (!coverImages || coverImages.length === 0) {
            setImages([])
            return
          }
          
          // Transform to match AlbumImage interface
          const transformedImages: AlbumImage[] = coverImages
            .filter((img: any) => {
              const imgEntityId = img.metadata?.entity_id
              if (imgEntityId && imgEntityId !== bookId) {
                return false
              }
              return !!img.url
            })
            .map((img: any) => ({
              image_id: img.id,
              image: {
                id: img.id,
                url: img.url,
                alt_text: img.alt_text,
                created_at: img.created_at
              },
              is_cover: img.id === currentCoverImageId,
              display_order: 0
            }))
          
          // Sort: current cover first, then by creation date
          const sortedImages = transformedImages.sort((a: AlbumImage, b: AlbumImage) => {
            if (a.is_cover && !b.is_cover) return -1
            if (!a.is_cover && b.is_cover) return 1
            return new Date(b.image.created_at || 0).getTime() - new Date(a.image.created_at || 0).getTime()
          })
          
          setImages(sortedImages)
        } catch (error) {
          console.error('Error refetching book cover images:', error)
        }
      }
      fetchCoverImages()
    }

    window.addEventListener('albumRefresh', handleRefresh)
    window.addEventListener('entityImageChanged', handleRefresh)
    return () => {
      window.removeEventListener('albumRefresh', handleRefresh)
      window.removeEventListener('entityImageChanged', handleRefresh)
    }
  }, [bookId, currentCoverImageId])

  if (loading) {
    return (
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-medium">Book Covers</h3>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="flex-shrink-0 w-16 h-24 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Book Covers</h3>
          {canEdit && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 px-2">
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>View All Book Covers</DialogTitle>
                </DialogHeader>
                <EntityPhotoAlbums
                  entityId={bookId}
                  entityType="book"
                  isOwnEntity={canEdit}
                  entityDisplayInfo={{
                    id: bookId,
                    name: 'Book Covers',
                    type: 'book' as const
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="text-center py-4 text-sm text-muted-foreground">
          No additional cover images yet
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Book Covers ({images.length})</h3>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          onClick={() => {
            if (onOpenAlbum) {
              onOpenAlbum()
            } else {
              setShowAlbum(true)
            }
          }}
        >
          View All
        </Button>
      </div>

      {/* Horizontal Scrollable Carousel */}
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {images.map((albumImage) => {
            const isCurrentCover = albumImage.image_id === currentCoverImageId
            return (
              <Card
                key={albumImage.image_id}
                className={`flex-shrink-0 w-16 h-24 cursor-pointer transition-all hover:shadow-md relative ${
                  isCurrentCover ? 'ring-2 ring-primary shadow-lg' : 'hover:ring-1 hover:ring-muted-foreground/20'
                }`}
                onClick={() => {
                  // Preview the image in the main cover display (temporary preview only)
                  if (onPreview) {
                    onPreview(albumImage.image.url, albumImage.image_id)
                  }
                }}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={albumImage.image.url}
                    alt={albumImage.image.alt_text || 'Book cover'}
                    fill
                    className="object-cover rounded-md"
                    sizes="64px"
                  />
                  {isCurrentCover && (
                    <div className="absolute inset-0 bg-primary/20 rounded-md flex items-center justify-center">
                      <div className="bg-primary text-primary-foreground text-xs px-1 py-0.5 rounded">
                        Current
                      </div>
                    </div>
                  )}
                  {albumImage.is_cover && !isCurrentCover && (
                    <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs px-1 rounded-bl">
                      ★
                    </div>
                  )}
                </div>
              </Card>
            )
          })}

          {/* Add new cover button */}
          {canEdit && (
            <Card className="flex-shrink-0 w-16 h-24 cursor-pointer border-dashed border-2 hover:border-primary transition-colors flex items-center justify-center">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
