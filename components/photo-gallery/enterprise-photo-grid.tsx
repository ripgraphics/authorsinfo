'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { EnterprisePhotoViewer } from './enterprise-photo-viewer'
import { 
  Grid3X3, 
  Grid2X2, 
  List, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Heart, 
  MessageCircle, 
  Share2, 
  Download, 
  Tag, 
  MoreVertical,
  Play,
  CheckSquare,
  Square,
  Eye,
  Calendar,
  User,
  ImageIcon,
  Star
} from 'lucide-react'

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
  photo_id: string
  entity_type: 'user' | 'book' | 'publisher' | 'author' | 'group'
  entity_id: string
  entity_name: string
  x_position: number
  y_position: number
  created_at: string
  created_by: string
}

interface PhotoLike {
  id: string
  photo_id: string
  user_id: string
  created_at: string
  user: {
    name: string
    avatar_url?: string
  }
}

interface PhotoComment {
  id: string
  photo_id: string
  user_id: string
  content: string
  parent_id?: string
  created_at: string
  updated_at?: string
  user: {
    name: string
    avatar_url?: string
  }
  replies?: PhotoComment[]
}

interface PhotoShare {
  id: string
  photo_id: string
  user_id: string
  platform: string
  created_at: string
}

interface PhotoAnalytics {
  views: number
  unique_views: number
  downloads: number
  shares: number
  engagement_rate: number
}

interface EnterprisePhotoGridProps {
  albumId?: string
  entityId?: string
  entityType?: string
  isOwner?: boolean
  enableSelection?: boolean
  onSelectionChange?: (selectedIds: string[]) => void
  onCoverImageChange?: () => void
  maxHeight?: string
  enhancedAlbumData?: any
  entityDisplayInfo?: {
    id: string
    name: string
    type: 'user' | 'author' | 'publisher' | 'group' | 'event' | 'book'
    author_image?: { url: string }
    publisher_image?: { url: string }
    bookCount?: number
    member_count?: number
    location?: string
    bio?: string
  } // Optional override for entity display with hover card functionality
}

export function EnterprisePhotoGrid({
  albumId,
  entityId,
  entityType,
  isOwner = false,
  enableSelection = false,
  onSelectionChange,
  onCoverImageChange,
  maxHeight = '70vh',
  enhancedAlbumData,
  entityDisplayInfo
}: EnterprisePhotoGridProps) {
  

  
  console.log('🖼️ EnterprisePhotoGrid mounted with props:', {
    albumId,
    entityId,
    entityType,
    isOwner,
    enhancedAlbumData: enhancedAlbumData ? {
      id: enhancedAlbumData.id,
      name: enhancedAlbumData.name,
      imageCount: enhancedAlbumData.images?.length || 0,
      hasEnhancedData: !!enhancedAlbumData.images
    } : null
  })
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [viewMode, setViewMode] = useState<'grid-large' | 'grid-medium' | 'grid-small' | 'list'>('grid-medium')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'views' | 'likes'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'tagged' | 'untagged' | 'liked'>('all')
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [viewerOpen, setViewerOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  
  const supabase = supabaseClient
  const { toast } = useToast()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef<HTMLDivElement>(null)

  const loadPhotos = useCallback(async (pageNum: number = 0, reset: boolean = false) => {
    console.log('🖼️ loadPhotos called with:', { pageNum, reset, enhancedAlbumData: !!enhancedAlbumData })
    try {
      setLoading(true)
      
      // If we have enhanced album data, use it directly instead of querying the database
      if (enhancedAlbumData && enhancedAlbumData.images && pageNum === 0) {
        console.log('🖼️ Using enhanced album data for photos:', enhancedAlbumData.images.length)
        console.log('🖼️ Enhanced album data sample:', enhancedAlbumData.images[0])
        
        const processedPhotos: Photo[] = enhancedAlbumData.images.map((item: any) => {
          const image = item.image
          
          return {
            id: image.id,
            url: image.url,
            thumbnail_url: image.url, // Use full URL as thumbnail for now
            alt_text: item.alt_text || image.alt_text,
            description: item.description || image.description || image.caption,
            created_at: image.created_at,
            metadata: image.metadata,
            is_cover: item.is_cover,
            is_featured: item.is_featured,
            tags: [],
            likes: [],
            comments: [],
            shares: [],
            analytics: {
              views: 0,
              unique_views: 0,
              downloads: 0,
              shares: 0,
              engagement_rate: 0
            }
          }
        })
        
        setPhotos(processedPhotos)
        setLoading(false)
        return
      }
      
      // If no albumId provided and no enhanced data, skip querying
      if (!albumId) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('EnterprisePhotoGrid: No albumId provided; skipping DB query')
        }
        setHasMore(false)
        setLoading(false)
        return
      }

      // Fallback to database query if no enhanced data
      console.log('🖼️ No enhanced data, falling back to database query')
      let query = supabase
        .from('album_images')
        .select(`
          id,
          image_id,
          alt_text,
          description,
          is_cover,
          is_featured,
          caption,
          view_count,
          like_count,
          comment_count,
          share_count,
          created_at,
          images (
            id,
            url,
            thumbnail_url,
            alt_text,
            description,
            created_at,
            metadata,
            view_count,
            like_count,
            comment_count,
            share_count,
            quality_score,
            is_featured
          )
        `)
        .eq('album_id', albumId)
        .range(pageNum * 20, (pageNum + 1) * 20 - 1)

      // Apply sorting
      if (sortBy === 'date') {
        query = query.order('created_at', { ascending: sortOrder === 'asc' })
      }

      const { data, error } = await query

      if (error) throw error

      const processedPhotos: Photo[] = (data || []).map((item: any) => {
        const image = item.images
        
        // If we have enhanced album data, use it to get the correct is_cover status
        let isCover = item.is_cover
        if (enhancedAlbumData && enhancedAlbumData.images) {
          const enhancedImage = enhancedAlbumData.images.find((img: any) => img.image?.id === image.id)
          if (enhancedImage) {
            isCover = enhancedImage.is_cover
            console.log(`🖼️ Photo ${image.id} is_cover set to ${isCover} from enhanced data`)
          } else {
            console.log(`🖼️ Photo ${image.id} not found in enhanced data, using default is_cover: ${isCover}`)
          }
        } else {
          console.log(`🖼️ No enhanced album data available, using default is_cover: ${isCover}`)
        }
        
        const processedPhoto = {
          id: image.id,
          url: image.url,
          thumbnail_url: image.thumbnail_url,
          alt_text: item.alt_text || image.alt_text,
          description: item.description || image.description || item.caption,
          created_at: image.created_at,
          metadata: image.metadata,
          is_cover: isCover,
          is_featured: item.is_featured || image.is_featured,
          // Full enterprise data
          // Note: photo_tags, photo_likes, photo_comments, photo_shares are not included in the query
          // to avoid 400 errors from Supabase. They can be loaded separately if needed.
          tags: [],
          likes: [],
          comments: [],
          shares: [],
          analytics: {
            views: image.view_count || item.view_count || 0,
            unique_views: Math.floor((image.view_count || 0) * 0.7), // Estimate
            downloads: 0, // Will be loaded separately if needed
            shares: image.share_count || item.share_count || 0,
            engagement_rate: image.view_count > 0 ? 
              ((image.like_count || 0) + (image.comment_count || 0) + (image.share_count || 0)) / image.view_count * 100 : 0
          }
        }
        

        
        return processedPhoto
      })

      // Apply client-side filtering and sorting
      let filteredPhotos = processedPhotos

      if (searchQuery) {
        filteredPhotos = filteredPhotos.filter(photo =>
          photo.alt_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          photo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          photo.tags?.some(tag => tag.entity_name.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      }

      if (filterBy !== 'all') {
        filteredPhotos = filteredPhotos.filter(photo => {
          switch (filterBy) {
            case 'tagged':
              return photo.tags && photo.tags.length > 0
            case 'untagged':
              return !photo.tags || photo.tags.length === 0
            case 'liked':
              return photo.likes && photo.likes.length > 0
            default:
              return true
          }
        })
      }

      // Apply sorting
      filteredPhotos.sort((a, b) => {
        let aValue, bValue
        
        switch (sortBy) {
          case 'name':
            aValue = a.alt_text || a.id
            bValue = b.alt_text || b.id
            break
          case 'views':
            aValue = a.analytics?.views || 0
            bValue = b.analytics?.views || 0
            break
          case 'likes':
            aValue = a.likes?.length || 0
            bValue = b.likes?.length || 0
            break
          default:
            aValue = new Date(a.created_at).getTime()
            bValue = new Date(b.created_at).getTime()
        }
        
        const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        return sortOrder === 'asc' ? result : -result
      })

      if (reset) {
        setPhotos(filteredPhotos)
      } else {
        setPhotos(prev => [...prev, ...filteredPhotos])
      }

      setHasMore(filteredPhotos.length === 20)
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error loading photos:', error)
      }
      const message = typeof error === 'string' 
        ? error 
        : error?.message 
          || error?.details 
          || 'Unable to load photos'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      })
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [albumId, sortBy, sortOrder, searchQuery, filterBy, supabase])

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => {
            const newPage = prev + 1
            loadPhotos(newPage, false)
            return newPage
          })
        }
      },
      { threshold: 0.1 }
    )

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current)
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [hasMore, loading, loadPhotos])

  // Load initial photos
  useEffect(() => {
    setPage(0)
    loadPhotos(0, true)
  }, [loadPhotos, enhancedAlbumData]) // Also reload when enhanced data changes
  
  // Listen for cover image changes from other components
  useEffect(() => {
    const handleCoverImageChange = () => {
      console.log('🖼️ Cover image changed event received, refreshing photos')
      // Force a complete refresh by clearing photos first, then reloading
      setPhotos([])
      // Small delay to ensure state is cleared before reloading
      setTimeout(() => {
        loadPhotos(0, true)
      }, 50)
    }
    
    // Listen for photo updates (when photo metadata is edited)
    const handlePhotoUpdated = () => {
      console.log('📸 Photo updated event received, refreshing photos')
      console.log('📸 Current photos before refresh:', photos)
      // Force a complete refresh by clearing photos first, then reloading
      setPhotos([])
      // Small delay to ensure state is cleared before reloading
      setTimeout(() => {
        console.log('📸 Reloading photos after update...')
        loadPhotos(0, true)
      }, 100) // Increased delay to ensure database changes are committed
    }
    
    window.addEventListener('entityImageChanged', handleCoverImageChange)
    window.addEventListener('photoUpdated', handlePhotoUpdated)
    
    return () => {
      window.removeEventListener('entityImageChanged', handleCoverImageChange)
      window.removeEventListener('photoUpdated', handlePhotoUpdated)
    }
  }, [loadPhotos])

  // Handle photo selection
  const handlePhotoSelect = (photoId: string, selected: boolean) => {
    const newSelection = selected 
      ? [...selectedPhotos, photoId]
      : selectedPhotos.filter(id => id !== photoId)
    
    setSelectedPhotos(newSelection)
    onSelectionChange?.(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedPhotos.length === photos.length) {
      setSelectedPhotos([])
      onSelectionChange?.([])
    } else {
      const allIds = photos.map(p => p.id)
      setSelectedPhotos(allIds)
      onSelectionChange?.(allIds)
    }
  }

  const handlePhotoClick = (photo: Photo, index: number) => {
    if (enableSelection) {
      handlePhotoSelect(photo.id, !selectedPhotos.includes(photo.id))
    } else {
      setCurrentPhotoIndex(index)
      setViewerOpen(true)
    }
  }

  // Handle setting an image as cover
  const handleSetAsCover = async (photoId: string) => {
    try {
      // First, unset all other images as cover in this album
      await supabase
        .from('album_images')
        .update({ is_cover: false })
        .eq('album_id', albumId)
      
      // Then set this image as cover
      const { error } = await supabase
        .from('album_images')
        .update({ is_cover: true })
        .eq('album_id', albumId)
        .eq('image_id', photoId)
      
      if (error) {
        console.error('Error setting image as cover:', error)
        return
      }
      
      // Show success message
      toast({
        title: "Success!",
        description: "Cover image updated",
      })
      
      // If this is an entity header or avatar album, refresh the entity header
      if (onCoverImageChange) {
        onCoverImageChange()
      }
      
      // Update local state immediately for instant visual feedback
      setPhotos(prevPhotos => 
        prevPhotos.map(photo => ({
          ...photo,
          is_cover: photo.id === photoId
        }))
      )
      
      // Trigger the entity image changed event to refresh the grid completely
      window.dispatchEvent(new CustomEvent('entityImageChanged'))
      
    } catch (error) {
      console.error('Error setting image as cover:', error)
      toast({
        title: "Error",
        description: "Failed to update cover image",
        variant: "destructive"
      })
    }
  }

  const getGridClass = () => {
    switch (viewMode) {
      case 'grid-large':
        return 'grid-cols-2 md:grid-cols-3 gap-6'
      case 'grid-medium':
        return 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
      case 'grid-small':
        return 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2'
      case 'list':
        return 'grid-cols-1 gap-4'
      default:
        return 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
    }
  }

  const LoadingSkeleton = () => (
    <div className={`grid ${getGridClass()}`}>
      {Array.from({ length: 20 }).map((_, i) => (
        <Skeleton
          key={i}
          className={viewMode === 'list' ? 'h-32' : 'aspect-square'}
        />
      ))}
    </div>
  )

  const PhotoCard = ({ photo, index }: { photo: Photo; index: number }) => {
    const isSelected = selectedPhotos.includes(photo.id)
    const isListView = viewMode === 'list'

    return (
      <div
        className={`relative group cursor-pointer transition-all duration-200 hover:scale-105 ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        } ${isListView ? 'flex gap-4 p-4 bg-card rounded-lg' : ''}`}
        onClick={() => handlePhotoClick(photo, index)}
      >
        {/* Selection Checkbox */}
        {enableSelection && (
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => handlePhotoSelect(photo.id, checked as boolean)}
              className="bg-white/80 backdrop-blur-sm"
            />
          </div>
        )}

        {/* Photo Image */}
        <div className={`relative overflow-hidden rounded-lg ${
          isListView ? 'w-32 h-32 flex-shrink-0' : 'aspect-square'
        }`}>
          <img
            src={photo.thumbnail_url || photo.url}
            alt={photo.alt_text || 'Photo'}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {photo.is_cover && (
              <Badge variant="secondary" className="text-xs bg-blue-600 text-white">
                Cover Image
              </Badge>
            )}
            {photo.is_featured && (
              <Badge variant="secondary" className="text-xs bg-yellow-600 text-white">
                Featured
              </Badge>
            )}
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-white">
              {/* Stats Row */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {photo.analytics?.views || 0}
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {photo.likes?.length || 0}
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {photo.comments?.length || 0}
                </div>
              </div>
              
              {/* Set as Cover Button - Only show if not already cover and owner */}
              {isOwner && !photo.is_cover && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs h-7 px-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSetAsCover(photo.id)
                  }}
                >
                  <Star className="h-3 w-3 mr-1" />
                  Set as Cover
                </Button>
              )}
              

            </div>
          </div>

          {/* Tags Indicator */}
          {photo.tags && photo.tags.length > 0 && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="text-xs bg-black/50 text-white">
                <Tag className="h-3 w-3 mr-1" />
                {photo.tags.length}
              </Badge>
            </div>
          )}
        </div>

        {/* List View Content */}
        {isListView && (
          <div className="flex-1 space-y-2">
            <div>
              <h4 className="font-medium line-clamp-1">
                {photo.alt_text || `Photo ${index + 1}`}
              </h4>
              {photo.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {photo.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(photo.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {photo.analytics?.views || 0}
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {photo.likes?.length || 0}
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {photo.comments?.length || 0}
              </div>
            </div>

            {photo.tags && photo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {photo.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag.id} variant="outline" className="text-xs">
                    {tag.entity_name}
                  </Badge>
                ))}
                {photo.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{photo.tags.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header Controls */}
      <div className="flex-shrink-0">
          <div className="flex flex-col gap-4 p-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search photos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                  <SelectTrigger className="w-32">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Photos</SelectItem>
                    <SelectItem value="tagged">Tagged</SelectItem>
                    <SelectItem value="untagged">Untagged</SelectItem>
                    <SelectItem value="liked">Liked</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="views">Views</SelectItem>
                    <SelectItem value="likes">Likes</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* View Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {photos.length} photo{photos.length !== 1 ? 's' : ''}
                </span>
                
                {enableSelection && selectedPhotos.length > 0 && (
                  <Badge variant="secondary">
                    {selectedPhotos.length} selected
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {enableSelection && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedPhotos.length === photos.length ? (
                      <CheckSquare className="h-4 w-4 mr-2" />
                    ) : (
                      <Square className="h-4 w-4 mr-2" />
                    )}
                    Select All
                  </Button>
                )}

                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === 'grid-large' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid-large')}
                    className="rounded-r-none"
                  >
                    <Grid2X2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid-medium' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid-medium')}
                    className="rounded-none"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid-small' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid-small')}
                    className="rounded-none"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Photo Grid */}
      <div className="flex-grow overflow-auto p-4 pb-8">
        {loading && photos.length === 0 ? (
          <LoadingSkeleton />
        ) : photos.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No photos found</h3>
            <p className="text-muted-foreground">
              {searchQuery || filterBy !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Upload some photos to get started'
              }
            </p>
          </div>
        ) : (
          <>
            <div className={`grid ${getGridClass()}`}>
              {photos.map((photo, index) => (
                <PhotoCard key={photo.id} photo={photo} index={index} />
              ))}
            </div>

            {/* Loading indicator for infinite scroll */}
            {hasMore && (
              <div ref={loadingRef} className="py-8">
                <div className={`grid ${getGridClass()}`}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className={viewMode === 'list' ? 'h-32' : 'aspect-square'}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <EnterprisePhotoViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        photos={photos}
        currentIndex={currentPhotoIndex}
        onIndexChange={setCurrentPhotoIndex}
        albumId={albumId}
        entityId={entityId}
        entityType={entityType}
        isOwner={isOwner}
        entityDisplayInfo={entityDisplayInfo}
      />
    </div>
  )
}