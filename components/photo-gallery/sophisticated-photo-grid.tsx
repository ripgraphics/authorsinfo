'use client'

import { useState } from 'react'

interface Photo {
  id: string
  url: string
  thumbnail_url?: string
  alt_text?: string
  description?: string
  created_at: string
  metadata?: any
  tags?: PhotoTag[]
  likes?: PhotoLike[]
  comments?: PhotoComment[]
  shares?: PhotoShare[]
  analytics?: PhotoAnalytics
  is_cover?: boolean
  is_featured?: boolean
}

interface PhotoTag {
  id: string
  name: string
}

interface PhotoLike {
  id: string
  photo_id: string
  user_id: string
  created_at: string
  user: { name: string }
}

interface PhotoComment {
  id: string
  photo_id: string
  user_id: string
  content: string
  created_at: string
  user: { name: string }
}

interface PhotoShare {
  id: string
  photo_id: string
  user_id: string
  created_at: string
}

interface PhotoAnalytics {
  views: number
  unique_views: number
  downloads: number
  shares: number
  engagement_rate: number
}

interface SophisticatedPhotoGridProps {
  photos: Photo[]
  onPhotoClick?: (photo: Photo, index: number) => void
  onPhotoLike?: (photoId: string) => void
  onPhotoComment?: (photoId: string) => void
  onPhotoShare?: (photoId: string) => void
  onPhotoDownload?: (photoId: string) => void
  className?: string
  maxHeight?: string
  showActions?: boolean
  showStats?: boolean
}

export function SophisticatedPhotoGrid({
  photos,
  onPhotoClick,
  onPhotoLike,
  onPhotoComment,
  onPhotoShare,
  onPhotoDownload,
  className = '',
  maxHeight = '70vh',
  showActions = true,
  showStats = true
}: SophisticatedPhotoGridProps) {

  // Handle different image counts with flexbox layout
  if (photos.length === 1) {
    return (
      <div 
        className={`${className} w-full min-h-fit`} 
        style={{ 
          maxHeight: 'none',
          height: 'auto',
          overflow: 'visible'
        }}
      >
        <div className="w-full">
          <img
            src={photos[0].thumbnail_url || photos[0].url}
            alt={photos[0].alt_text || photos[0].description || 'Photo 1'}
            className="w-full max-h-[1200px] object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            loading="lazy"
            onClick={() => onPhotoClick?.(photos[0], 0)}
          />
        </div>
      </div>
    )
  }

  if (photos.length === 2) {
    return (
      <div 
        className={`${className} w-full min-h-fit`} 
        style={{ 
          maxHeight: 'none',
          height: 'auto',
          overflow: 'visible'
        }}
      >
        <div className="flex gap-1 w-full">
          <div className="flex-1">
            <img
              src={photos[0].thumbnail_url || photos[0].url}
              alt={photos[0].alt_text || photos[0].description || 'Photo 1'}
              className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              loading="lazy"
              onClick={() => onPhotoClick?.(photos[0], 0)}
            />
          </div>
          <div className="flex-1">
            <img
              src={photos[1].thumbnail_url || photos[1].url}
              alt={photos[1].alt_text || photos[1].description || 'Photo 2'}
              className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              loading="lazy"
              onClick={() => onPhotoClick?.(photos[1], 1)}
            />
          </div>
        </div>
      </div>
    )
  }

  if (photos.length === 3) {
    return (
      <div 
        className={`${className} w-full min-h-fit`} 
        style={{ 
          maxHeight: 'none',
          height: 'auto',
          overflow: 'visible'
        }}
      >
        <div className="flex gap-1 w-full">
          <div className="w-2/3">
            <div className="aspect-square w-full">
              <img
                src={photos[0].thumbnail_url || photos[0].url}
                alt={photos[0].alt_text || photos[0].description || 'Photo 1'}
                className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                loading="lazy"
                onClick={() => onPhotoClick?.(photos[0], 0)}
              />
            </div>
          </div>
          <div className="w-1/3">
            <div className="grid grid-rows-2 gap-1 h-full">
              <div className="aspect-square">
                <img
                  src={photos[1].thumbnail_url || photos[1].url}
                  alt={photos[1].alt_text || photos[1].description || 'Photo 2'}
                  className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  loading="lazy"
                  onClick={() => onPhotoClick?.(photos[1], 1)}
                />
              </div>
              <div className="aspect-square">
                <img
                  src={photos[2].thumbnail_url || photos[2].url}
                  alt={photos[2].alt_text || photos[2].description || 'Photo 3'}
                  className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  loading="lazy"
                  onClick={() => onPhotoClick?.(photos[2], 2)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (photos.length === 4) {
    return (
      <div 
        className={`${className} w-full min-h-fit`} 
        style={{ 
          maxHeight: 'none',
          height: 'auto',
          overflow: 'visible'
        }}
      >
        <div className="grid grid-cols-2 gap-1 w-full">
          {photos.map((photo, index) => (
            <div key={photo.id} className="aspect-square">
              <img
                src={photo.thumbnail_url || photo.url}
                alt={photo.alt_text || photo.description || `Photo ${index + 1}`}
                className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                loading="lazy"
                onClick={() => onPhotoClick?.(photo, index)}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (photos.length === 5) {
    return (
      <div 
        className={`${className} w-full min-h-fit`} 
        style={{ 
          maxHeight: 'none',
          height: 'auto',
          overflow: 'visible'
        }}
      >
        {/* Top row - 3 images using same approach as 3-image layout */}
        <div className="flex gap-1 mb-1 w-full">
          <div className="w-2/3">
            <div className="aspect-square w-full">
              <img
                src={photos[0].thumbnail_url || photos[0].url}
                alt={photos[0].alt_text || photos[0].description || 'Photo 1'}
                className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                loading="lazy"
                onClick={() => onPhotoClick?.(photos[0], 0)}
              />
            </div>
          </div>
          <div className="w-1/3">
            <div className="grid grid-rows-2 gap-1 h-full">
              <div className="aspect-square">
                <img
                  src={photos[1].thumbnail_url || photos[1].url}
                  alt={photos[1].alt_text || photos[1].description || 'Photo 2'}
                  className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  loading="lazy"
                  onClick={() => onPhotoClick?.(photos[1], 1)}
                />
              </div>
              <div className="aspect-square">
                <img
                  src={photos[2].thumbnail_url || photos[2].url}
                  alt={photos[2].alt_text || photos[2].description || 'Photo 3'}
                  className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  loading="lazy"
                  onClick={() => onPhotoClick?.(photos[2], 2)}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom row - 2 equal squares */}
        <div className="grid grid-cols-2 gap-1 w-full">
          <div className="aspect-square w-full">
            <img
              src={photos[3].thumbnail_url || photos[3].url}
              alt={photos[3].alt_text || photos[3].description || 'Photo 4'}
              className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              loading="lazy"
              onClick={() => onPhotoClick?.(photos[3], 3)}
            />
          </div>
          <div className="aspect-square w-full">
            <img
              src={photos[4].thumbnail_url || photos[4].url}
              alt={photos[4].alt_text || photos[4].description || 'Photo 5'}
              className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              loading="lazy"
              onClick={() => onPhotoClick?.(photos[4], 4)}
            />
          </div>
        </div>
      </div>
    )
  }

  if (photos.length === 6) {
    return (
      <div 
        className={`${className} w-full min-h-fit`} 
        style={{ 
          maxHeight: 'none',
          height: 'auto',
          overflow: 'visible'
        }}
      >
        {/* Top row - 3 images using same approach as 3-image layout */}
        <div className="flex gap-1 mb-1 w-full">
          <div className="w-2/3">
            <div className="aspect-square w-full">
              <img
                src={photos[0].thumbnail_url || photos[0].url}
                alt={photos[0].alt_text || photos[0].description || 'Photo 1'}
                className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                loading="lazy"
                onClick={() => onPhotoClick?.(photos[0], 0)}
              />
            </div>
          </div>
          <div className="w-1/3">
            <div className="grid grid-rows-2 gap-1 h-full">
              <div className="aspect-square">
                <img
                  src={photos[1].thumbnail_url || photos[1].url}
                  alt={photos[1].alt_text || photos[1].description || 'Photo 2'}
                  className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  loading="lazy"
                  onClick={() => onPhotoClick?.(photos[1], 1)}
                />
              </div>
              <div className="aspect-square">
                <img
                  src={photos[2].thumbnail_url || photos[2].url}
                  alt={photos[2].alt_text || photos[2].description || 'Photo 3'}
                  className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  loading="lazy"
                  onClick={() => onPhotoClick?.(photos[2], 2)}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom row - 3 images mirrored (Images 4-6) */}
        <div className="flex gap-1 w-full">
          <div className="w-1/3">
            <div className="grid grid-rows-2 gap-1 h-full">
              <div className="aspect-square">
                <img
                  src={photos[3].thumbnail_url || photos[3].url}
                  alt={photos[3].alt_text || photos[3].description || 'Photo 4'}
                  className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  loading="lazy"
                  onClick={() => onPhotoClick?.(photos[3], 3)}
                />
              </div>
              <div className="aspect-square">
                <img
                  src={photos[4].thumbnail_url || photos[4].url}
                  alt={photos[4].alt_text || photos[4].description || 'Photo 5'}
                  className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  loading="lazy"
                  onClick={() => onPhotoClick?.(photos[4], 4)}
                />
              </div>
            </div>
          </div>
          <div className="w-2/3">
            <div className="aspect-square w-full">
              <img
                src={photos[5].thumbnail_url || photos[5].url}
                alt={photos[5].alt_text || photos[5].description || 'Photo 6'}
                className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                loading="lazy"
                onClick={() => onPhotoClick?.(photos[5], 5)}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (photos.length >= 7) {
    return (
      <div 
        className={`${className} w-full min-h-fit`} 
        style={{ 
          maxHeight: 'none',
          height: 'auto',
          overflow: 'visible'
        }}
      >
        {/* Show first 6 images using the 6-image layout */}
        <div className="flex gap-1 mb-1 w-full">
          <div className="w-2/3">
            <div className="aspect-square w-full">
              <img
                src={photos[0].thumbnail_url || photos[0].url}
                alt={photos[0].alt_text || photos[0].description || 'Photo 1'}
                className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                loading="lazy"
                onClick={() => onPhotoClick?.(photos[0], 0)}
              />
            </div>
          </div>
          <div className="w-1/3">
            <div className="grid grid-rows-2 gap-1 h-full">
              <div className="aspect-square">
                <img
                  src={photos[1].thumbnail_url || photos[1].url}
                  alt={photos[1].alt_text || photos[1].description || 'Photo 2'}
                  className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  loading="lazy"
                  onClick={() => onPhotoClick?.(photos[1], 1)}
                />
              </div>
              <div className="aspect-square">
                <img
                  src={photos[2].thumbnail_url || photos[2].url}
                  alt={photos[2].alt_text || photos[2].description || 'Photo 3'}
                  className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  loading="lazy"
                  onClick={() => onPhotoClick?.(photos[2], 2)}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom row - 3 images mirrored (Images 4-6) */}
        <div className="flex gap-1 w-full">
          <div className="w-1/3">
            <div className="grid grid-rows-2 gap-1 h-full">
              <div className="aspect-square">
                <img
                  src={photos[3].thumbnail_url || photos[3].url}
                  alt={photos[3].alt_text || photos[3].description || 'Photo 4'}
                  className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  loading="lazy"
                  onClick={() => onPhotoClick?.(photos[3], 3)}
                />
              </div>
              <div className="aspect-square">
                <img
                  src={photos[4].thumbnail_url || photos[4].url}
                  alt={photos[4].alt_text || photos[4].description || 'Photo 5'}
                  className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  loading="lazy"
                  onClick={() => onPhotoClick?.(photos[4], 4)}
                />
              </div>
            </div>
          </div>
          <div className="w-2/3">
            <div className="aspect-square w-full">
              <img
                src={photos[5].thumbnail_url || photos[5].url}
                alt={photos[5].alt_text || photos[5].description || 'Photo 6'}
                className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                loading="lazy"
                onClick={() => onPhotoClick?.(photos[5], 5)}
              />
            </div>
          </div>
        </div>
        
        {/* Show "View X more" button for 7+ photos */}
        {photos.length > 6 && (
          <div className="mt-2 text-center">
            <button 
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              onClick={() => {
                // TODO: Navigate to album view
                console.log(`View ${photos.length - 6} more photos`)
              }}
            >
              View {photos.length - 6} more
            </button>
          </div>
        )}
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg p-8`}>
        <p className="text-gray-500">No photos to display</p>
      </div>
    )
  }

  return null
}
