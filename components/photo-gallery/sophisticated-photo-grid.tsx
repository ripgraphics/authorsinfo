'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Eye, Heart, MessageCircle, Share2, Download, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

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
  const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null)

  // Calculate grid layout based on photo count
  const gridLayout = useMemo(() => {
    if (photos.length === 0) return { columns: '1fr', rows: '1fr', areas: [] }
    
    switch (photos.length) {
             case 1:
         return {
           columns: '1fr',
           rows: '1fr',
           areas: ['1 / 1 / 2 / 2']
         }
       case 2:
         return {
           columns: '1fr 1fr',
           rows: '1fr',
           areas: ['1 / 1 / 2 / 2', '1 / 2 / 2 / 3']
         }
       case 3:
         return {
           columns: '1fr 1fr',
           rows: '1fr 1fr',
           areas: ['1 / 1 / 2 / 2', '1 / 2 / 2 / 3', '2 / 1 / 3 / 3']
         }
       case 4:
         return {
           columns: '1fr 1fr',
           rows: '1fr 1fr',
           areas: ['1 / 1 / 2 / 2', '1 / 2 / 2 / 3', '2 / 1 / 3 / 2', '2 / 2 / 3 / 3']
         }
       case 5:
         return {
           columns: '1fr 1fr',
           rows: '1fr 1fr 1fr',
           areas: ['1 / 1 / 2 / 2', '1 / 2 / 2 / 3', '2 / 1 / 3 / 2', '2 / 2 / 3 / 3', '3 / 1 / 4 / 3']
         }
             default:
         // For 6+ photos, use a 3-column grid
         const cols = 3
         const rows = Math.ceil(photos.length / cols)
         return {
           columns: 'repeat(3, 1fr)',
           rows: `repeat(${rows}, 1fr)`,
           areas: photos.map((_, index) => {
             const row = Math.floor(index / cols) + 1
             const col = (index % cols) + 1
             return `${row} / ${col} / ${row + 1} / ${col + 1}`
           })
         }
    }
  }, [photos])

  const handlePhotoClick = (photo: Photo, index: number) => {
    if (onPhotoClick) {
      onPhotoClick(photo, index)
    }
  }

  const handlePhotoLike = (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation()
    if (onPhotoLike) {
      onPhotoLike(photoId)
    }
  }

  const handlePhotoComment = (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation()
    if (onPhotoComment) {
      onPhotoComment(photoId)
    }
  }

  const handlePhotoShare = (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation()
    if (onPhotoShare) {
      onPhotoShare(photoId)
    }
  }

  const handlePhotoDownload = (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation()
    if (onPhotoDownload) {
      onPhotoDownload(photoId)
    }
  }

  if (photos.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg p-8`}>
        <p className="text-gray-500">No photos to display</p>
      </div>
    )
  }

  return (
    <div className={`${className} w-full`} style={{ maxHeight }}>
             <div 
         className="gap-1 bg-gray-100 rounded-lg overflow-hidden w-full"
         style={{
           display: 'grid',
           gridTemplateColumns: gridLayout.columns,
           gridTemplateRows: gridLayout.rows,
           aspectRatio: photos.length <= 5 ? '4/3' : undefined,
           maxHeight: photos.length <= 5 ? '400px' : undefined,
           width: '100%'
         }}
       >
                 {photos.map((photo, index) => (
           <motion.div
             key={photo.id}
             className="relative cursor-pointer group overflow-hidden w-full h-full"
             style={{ 
               gridArea: gridLayout.areas[index] || 'auto',
               minWidth: 0,
               minHeight: 0
             }}
             onHoverStart={() => setHoveredPhoto(photo.id)}
             onHoverEnd={() => setHoveredPhoto(null)}
             onClick={() => handlePhotoClick(photo, index)}
             whileHover={{ scale: 1.02 }}
             transition={{ duration: 0.2 }}
           >
            {/* Image */}
            <img
              src={photo.thumbnail_url || photo.url}
              alt={photo.alt_text || photo.description || `Photo ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />

            {/* Overlay with actions and stats */}
            <motion.div
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: hoveredPhoto === photo.id ? 1 : 0 }}
            >
              <div className="absolute inset-0 flex flex-col justify-between p-3">
                {/* Top section - badges and actions */}
                <div className="flex items-start justify-between">
                  <div className="flex gap-2">
                    {photo.is_cover && (
                      <Badge variant="secondary" className="bg-blue-500 text-white">
                        Cover
                      </Badge>
                    )}
                    {photo.is_featured && (
                      <Badge variant="secondary" className="bg-yellow-500 text-white">
                        Featured
                      </Badge>
                    )}
                  </div>
                  
                  {showActions && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-white"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handlePhotoDownload(e, photo.id)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handlePhotoShare(e, photo.id)}>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Bottom section - stats and quick actions */}
                <div className="space-y-3">
                  {showStats && photo.analytics && (
                    <div className="flex items-center gap-4 text-white text-sm">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{photo.analytics.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        <span>{photo.analytics.downloads}</span>
                      </div>
                    </div>
                  )}

                  {showActions && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 bg-white/20 hover:bg-white/30 text-white"
                        onClick={(e) => handlePhotoLike(e, photo.id)}
                      >
                        <Heart className="mr-1 h-4 w-4" />
                        <span className="text-xs">
                          {photo.likes ? photo.likes.length : 0}
                        </span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 bg-white/20 hover:bg-white/30 text-white"
                        onClick={(e) => handlePhotoComment(e, photo.id)}
                      >
                        <MessageCircle className="mr-1 h-4 w-4" />
                        <span className="text-xs">
                          {photo.comments ? photo.comments.length : 0}
                        </span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 bg-white/20 hover:bg-white/30 text-white"
                        onClick={(e) => handlePhotoShare(e, photo.id)}
                      >
                        <Share2 className="mr-1 h-4 w-4" />
                        <span className="text-xs">
                          {photo.shares ? photo.shares.length : 0}
                        </span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
