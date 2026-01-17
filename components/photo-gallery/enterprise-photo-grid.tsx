'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { isUserAdmin, isUserSuperAdmin } from '@/lib/auth-utils'
import { addCacheBusting } from '@/lib/utils/image-url-validation'
import { EnterprisePhotoViewer } from './enterprise-photo-viewer'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  Star,
  Trash2,
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
  entityDisplayInfo,
}: EnterprisePhotoGridProps) {
  console.log('🖼️ EnterprisePhotoGrid mounted with props:', {
    albumId,
    entityId,
    entityType,
    isOwner,
    enhancedAlbumData: enhancedAlbumData
      ? {
          id: enhancedAlbumData.id,
          name: enhancedAlbumData.name,
          imageCount: enhancedAlbumData.images?.length || 0,
          hasEnhancedData: !!enhancedAlbumData.images,
        }
      : null,
  })
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [viewMode, setViewMode] = useState<'grid-large' | 'grid-medium' | 'grid-small' | 'list'>(
    'grid-medium'
  )
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'views' | 'likes'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'tagged' | 'untagged' | 'liked'>('all')
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [viewerOpen, setViewerOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null)
  const [deletePhotoUrl, setDeletePhotoUrl] = useState<string | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  const supabase = supabaseClient
  const { toast } = useToast()
  const { user } = useAuth()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef<HTMLDivElement>(null)

  // Check admin permissions
  useEffect(() => {
    if (user) {
      isUserAdmin(user.id).then(setIsAdmin)
      isUserSuperAdmin(user.id).then(setIsSuperAdmin)
    } else {
      setIsAdmin(false)
      setIsSuperAdmin(false)
    }
  }, [user])

  const loadPhotos = useCallback(
    async (pageNum: number = 0, reset: boolean = false, forceDatabaseQuery: boolean = false) => {
      console.log('🖼️ loadPhotos called with:', {
        pageNum,
        reset,
        forceDatabaseQuery,
        enhancedAlbumData: !!enhancedAlbumData,
        albumId,
      })
      try {
        setLoading(true)

        // SUPABASE IS THE SOURCE OF TRUTH
        // Only use enhancedAlbumData if it matches the current albumId AND we're not forcing a database query
        // If albumId doesn't match or enhancedAlbumData is missing, always query from Supabase
        // forceDatabaseQuery=true bypasses enhancedAlbumData to ensure fresh data (e.g., after deletion)
        if (
          !forceDatabaseQuery &&
          enhancedAlbumData &&
          enhancedAlbumData.images &&
          pageNum === 0 &&
          enhancedAlbumData.id === albumId
        ) {
          console.log(
            '🖼️ Using enhanced album data for photos (verified album ID match):',
            enhancedAlbumData.images.length
          )
          console.log('🖼️ Enhanced album data sample:', enhancedAlbumData.images[0])

          // Filter out items where image lookup completely failed (image is null)
          // But include images with blob URLs so they can be displayed (even if invalid)
          const processedPhotos: Photo[] = enhancedAlbumData.images
            .filter((item: any) => {
              // Only exclude if image is completely null (lookup failed)
              // Include images even if they have blob URLs (so user can see them)
              return item.image && item.image.id && item.image.url
            })
            .map((item: any) => {
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
                  engagement_rate: 0,
                },
              }
            })

          console.log(
            '🖼️ Processed photos count:',
            processedPhotos.length,
            'out of',
            enhancedAlbumData.images.length,
            'total items'
          )
          setPhotos(processedPhotos)
          setLoading(false)
          return
        } else if (enhancedAlbumData && enhancedAlbumData.id !== albumId) {
          // Enhanced data exists but doesn't match current album - ignore it and query from Supabase
          console.log('🖼️ Enhanced album data ID mismatch - querying from Supabase instead', {
            enhancedDataId: enhancedAlbumData.id,
            currentAlbumId: albumId,
          })
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
          .select(
            `
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
        `
          )
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
            const enhancedImage = enhancedAlbumData.images.find(
              (img: any) => img.image?.id === image.id
            )
            if (enhancedImage) {
              isCover = enhancedImage.is_cover
              console.log(`🖼️ Photo ${image.id} is_cover set to ${isCover} from enhanced data`)
            } else {
              console.log(
                `🖼️ Photo ${image.id} not found in enhanced data, using default is_cover: ${isCover}`
              )
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
              engagement_rate:
                image.view_count > 0
                  ? (((image.like_count || 0) +
                      (image.comment_count || 0) +
                      (image.share_count || 0)) /
                      image.view_count) *
                    100
                  : 0,
            },
          }

          return processedPhoto
        })

        // Apply client-side filtering and sorting
        let filteredPhotos = processedPhotos

        if (searchQuery) {
          filteredPhotos = filteredPhotos.filter(
            (photo) =>
              photo.alt_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              photo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              photo.tags?.some((tag) =>
                tag.entity_name.toLowerCase().includes(searchQuery.toLowerCase())
              )
          )
        }

        if (filterBy !== 'all') {
          filteredPhotos = filteredPhotos.filter((photo) => {
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
          setPhotos((prev) => [...prev, ...filteredPhotos])
        }

        setHasMore(filteredPhotos.length === 20)
      } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error loading photos:', error)
        }
        const message =
          typeof error === 'string'
            ? error
            : error?.message || error?.details || 'Unable to load photos'
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        })
        setHasMore(false)
      } finally {
        setLoading(false)
      }
    },
    [albumId, sortBy, sortOrder, searchQuery, filterBy, supabase]
  )

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => {
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
      : selectedPhotos.filter((id) => id !== photoId)

    setSelectedPhotos(newSelection)
    onSelectionChange?.(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedPhotos.length === photos.length) {
      setSelectedPhotos([])
      onSelectionChange?.([])
    } else {
      const allIds = photos.map((p) => p.id)
      setSelectedPhotos(allIds)
      onSelectionChange?.(allIds)
    }
  }

  const handlePhotoClick = (photo: Photo, index: number) => {
    // Always open the image viewer when clicking on a photo
    setCurrentPhotoIndex(index)
    setViewerOpen(true)
  }

  // Handle setting an image as cover
  const handleSetAsCover = async (photoId: string) => {
    try {
      // Fetch album context so we can update canonical pointers for system albums (avatar/header cover).
      const { data: albumData, error: albumError } = await (supabase.from('photo_albums') as any)
        .select('id, name, entity_type, entity_id')
        .eq('id', albumId)
        .maybeSingle()

      if (albumError) {
        console.warn('⚠️ Could not load album metadata (non-fatal):', albumError)
      }

      // First, unset all other images as cover in this album
      await (supabase.from('album_images') as any)
        .update({ is_cover: false })
        .eq('album_id', albumId)

      // Then set this image as cover
      const { error } = await (supabase.from('album_images') as any)
        .update({ is_cover: true })
        .eq('album_id', albumId)
        .eq('image_id', photoId)

      if (error) {
        console.error('Error setting image as cover:', error)
        return
      }

      // If this is a user system album, also update the canonical profile pointer.
      // Albums are history only; profile header uses profiles.avatar_image_id / profiles.cover_image_id.
      const albumName = (albumData as any)?.name as string | undefined
      const albumEntityType = (albumData as any)?.entity_type as string | undefined
      const albumEntityId = (albumData as any)?.entity_id as string | undefined

      const shouldUpdatePrimary =
        entityType === 'user' &&
        albumEntityType === 'user' &&
        typeof albumEntityId === 'string' &&
        (albumName === 'Avatar Images' || albumName === 'Header Cover Images')

      if (shouldUpdatePrimary) {
        const primaryKind = albumName === 'Avatar Images' ? 'avatar' : 'cover'
        const selectedPhoto = photos.find((p) => p.id === photoId)
        const imageUrl = selectedPhoto?.url

        const resp = await fetch('/api/entity-primary-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entityType: 'user',
            entityId: albumEntityId,
            imageId: photoId,
            primaryKind,
          }),
        })

        const payload = await resp.json().catch(() => null)
        if (!resp.ok || !payload?.success) {
          console.error('❌ Failed to update canonical primary image:', payload)
          toast({
            title: 'Error',
            description: payload?.error || 'Failed to update profile image',
            variant: 'destructive',
          })
        } else {
          // Update EntityHeader instantly without any album fetch.
          window.dispatchEvent(
            new CustomEvent('entityPrimaryImageChanged', {
              detail: {
                entityType: 'user',
                entityId: albumEntityId,
                primaryKind,
                imageUrl: imageUrl || payload.imageUrl,
              },
            })
          )
        }
      }

      // Show success message
      toast({
        title: 'Success!',
        description: 'Cover image updated',
      })

      // If this is an entity header or avatar album, refresh the entity header
      if (onCoverImageChange) {
        onCoverImageChange()
      }

      // Update local state immediately for instant visual feedback
      setPhotos((prevPhotos) =>
        prevPhotos.map((photo) => ({
          ...photo,
          is_cover: photo.id === photoId,
        }))
      )

      // Trigger the entity image changed event to refresh the grid completely
      window.dispatchEvent(new CustomEvent('entityImageChanged'))
    } catch (error) {
      console.error('Error setting image as cover:', error)
      toast({
        title: 'Error',
        description: 'Failed to update cover image',
        variant: 'destructive',
      })
    }
  }

  // Handle bulk deleting photos
  const handleBulkDelete = async () => {
    if (selectedPhotos.length === 0) return
    setBulkDeleteDialogOpen(true)
  }

  const confirmBulkDelete = async () => {
    if (selectedPhotos.length === 0) return
    setBulkDeleteDialogOpen(false)

    try {
      let successCount = 0
      let failCount = 0
      const errors: string[] = []

      // Delete each photo sequentially to avoid overwhelming the server
      for (const photoId of selectedPhotos) {
        try {
          const photo = photos.find((p) => p.id === photoId)
          if (!photo) {
            failCount++
            continue
          }

          // Get the image record to find Cloudinary public_id
          const { data: imageData, error: imageError } = await supabase
            .from('images')
            .select('id, url, storage_path')
            .eq('id', photoId)
            .single()

          if (imageError) {
            throw new Error('Failed to fetch image data')
          }

          // Extract Cloudinary public_id from URL or storage_path
          let publicId: string | null = null
          if ((imageData as any).storage_path) {
            const pathParts = (imageData as any).storage_path.split('/')
            const uploadIndex = pathParts.findIndex((part: string) => part === 'upload')
            if (uploadIndex > -1 && uploadIndex < pathParts.length - 1) {
              const folderParts = pathParts.slice(uploadIndex + 1, -1)
              const filename = pathParts[pathParts.length - 1]
              const nameWithoutExt = filename.split('.')[0]
              publicId =
                folderParts.length > 0
                  ? `${folderParts.join('/')}/${nameWithoutExt}`
                  : nameWithoutExt
            }
          } else if (photo.url) {
            const urlParts = photo.url.split('/')
            const uploadIndex = urlParts.findIndex((part) => part === 'upload')
            if (uploadIndex > -1 && uploadIndex < urlParts.length - 1) {
              const pathParts = urlParts.slice(uploadIndex + 1)
              const filename = pathParts[pathParts.length - 1]
              const nameWithoutExt = filename.split('.')[0]
              const folderPath = pathParts.slice(0, -1).join('/')
              publicId = folderPath ? `${folderPath}/${nameWithoutExt}` : nameWithoutExt
            }
          }

          // Step 1: Remove from album_images
          const { error: albumImageError } = await (supabase.from('album_images') as any)
            .delete()
            .eq('album_id', albumId)
            .eq('image_id', photoId)

          if (albumImageError) {
            throw new Error('Failed to remove photo from album')
          }

          // Step 2: Check if image is used in other albums
          const { data: otherAlbums } = await supabase
            .from('album_images')
            .select('id')
            .eq('image_id', photoId)
            .limit(1)

          // Step 3: Delete from Cloudinary if public_id found
          if (publicId) {
            try {
              await fetch('/api/cloudinary/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicId }),
              })
            } catch (cloudinaryError) {
              console.error('Error deleting from Cloudinary:', cloudinaryError)
            }
          }

          // Step 4: Delete from images table if not used in other albums
          if (!otherAlbums || otherAlbums.length === 0) {
            const { data: entityImages } = await supabase
              .from('entity_images')
              .select('id')
              .eq('image_id', photoId)
              .limit(1)

            if (!entityImages || entityImages.length === 0) {
              await supabase.from('images').delete().eq('id', photoId)
            }
          }

          successCount++
        } catch (error) {
          failCount++
          const errorMsg = error instanceof Error ? error.message : String(error)
          errors.push(`Photo ${photoId}: ${errorMsg}`)
          console.error(`Error deleting photo ${photoId}:`, error)
        }
      }

      // Store selected photo IDs before clearing selection
      const deletedPhotoIds = [...selectedPhotos]

      // Remove deleted photos from local state
      setPhotos((prevPhotos) => prevPhotos.filter((photo) => !selectedPhotos.includes(photo.id)))
      setSelectedPhotos([])

      // Show result message
      if (failCount === 0) {
        toast({
          title: 'Success!',
          description: `${successCount} photo${successCount !== 1 ? 's' : ''} deleted successfully`,
        })
      } else {
        toast({
          title: 'Partial Success',
          description: `${successCount} deleted, ${failCount} failed`,
          variant: 'destructive',
        })
        console.error('Bulk delete errors:', errors)
      }

      // Reload photos from database
      requestAnimationFrame(() => {
        setTimeout(() => {
          loadPhotos(0, true, true)
        }, 150)
      })

      // Trigger refresh events
      window.dispatchEvent(new CustomEvent('albumRefresh'))
      window.dispatchEvent(
        new CustomEvent('photoDeleted', { detail: { photoIds: deletedPhotoIds, albumId } })
      )
      if (onCoverImageChange) {
        onCoverImageChange()
      }
    } catch (error) {
      console.error('Error in bulk delete:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete photos',
        variant: 'destructive',
      })
    }
  }

  // Handle deleting a photo
  const handleDeletePhoto = async (photoId: string, photoUrl: string) => {
    if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      return
    }

    try {
      // Get the image record to find Cloudinary public_id
      const { data: imageData, error: imageError } = await supabase
        .from('images')
        .select('id, url, storage_path')
        .eq('id', photoId)
        .single()

      if (imageError) {
        throw new Error('Failed to fetch image data')
      }

      // Extract Cloudinary public_id from URL or storage_path
      let publicId: string | null = null
      if ((imageData as any).storage_path) {
        // Extract from storage_path (format: upload/v1234567890/folder/image.jpg)
        const pathParts = (imageData as any).storage_path.split('/')
        const uploadIndex = pathParts.findIndex((part: string) => part === 'upload')
        if (uploadIndex > -1 && uploadIndex < pathParts.length - 1) {
          const folderParts = pathParts.slice(uploadIndex + 1, -1)
          const filename = pathParts[pathParts.length - 1]
          const nameWithoutExt = filename.split('.')[0]
          publicId =
            folderParts.length > 0 ? `${folderParts.join('/')}/${nameWithoutExt}` : nameWithoutExt
        }
      } else if (photoUrl) {
        // Extract from URL
        const urlParts = photoUrl.split('/')
        const uploadIndex = urlParts.findIndex((part) => part === 'upload')
        if (uploadIndex > -1 && uploadIndex < urlParts.length - 1) {
          const pathParts = urlParts.slice(uploadIndex + 1)
          const filename = pathParts[pathParts.length - 1]
          const nameWithoutExt = filename.split('.')[0]
          const folderPath = pathParts.slice(0, -1).join('/')
          publicId = folderPath ? `${folderPath}/${nameWithoutExt}` : nameWithoutExt
        }
      }

      // Step 1: Remove from album_images
      const { error: albumImageError } = await (supabase.from('album_images') as any)
        .delete()
        .eq('album_id', albumId)
        .eq('image_id', photoId)

      if (albumImageError) {
        throw new Error('Failed to remove photo from album')
      }

      // Step 2: Check if image is used in other albums
      const { data: otherAlbums, error: checkError } = await supabase
        .from('album_images')
        .select('id')
        .eq('image_id', photoId)
        .limit(1)

      if (checkError) {
        console.error('Error checking image usage:', checkError)
      }

      // Step 3: Delete from Cloudinary if public_id found
      if (publicId) {
        try {
          const deleteResponse = await fetch('/api/cloudinary/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ publicId }),
          })

          if (!deleteResponse.ok) {
            console.error('Failed to delete from Cloudinary, but continuing...')
          }
        } catch (cloudinaryError) {
          console.error('Error deleting from Cloudinary:', cloudinaryError)
          // Continue even if Cloudinary deletion fails
        }
      }

      // Step 4: Delete from images table if not used in other albums
      if (!otherAlbums || otherAlbums.length === 0) {
        // Also check entity_images
        const { data: entityImages, error: entityCheckError } = await supabase
          .from('entity_images')
          .select('id')
          .eq('image_id', photoId)
          .limit(1)

        if (!entityCheckError && (!entityImages || entityImages.length === 0)) {
          const { error: deleteImageError } = await supabase
            .from('images')
            .delete()
            .eq('id', photoId)

          if (deleteImageError) {
            console.error('Error deleting image record:', deleteImageError)
          }
        }
      }

      // Remove from local state immediately for instant UI feedback
      setPhotos((prevPhotos) => prevPhotos.filter((photo) => photo.id !== photoId))

      // Also remove from selected photos if it was selected
      setSelectedPhotos((prev) => prev.filter((id) => id !== photoId))

      // Show success message
      toast({
        title: 'Success!',
        description: 'Photo deleted successfully',
      })

      // Immediately reload photos from database to ensure UI matches database state
      // Force database query to bypass stale enhancedAlbumData
      console.log('🔄 Reloading photos after deletion to sync with database...')
      // Use requestAnimationFrame to ensure state update happens first, then reload
      requestAnimationFrame(() => {
        setTimeout(() => {
          loadPhotos(0, true, true) // forceDatabaseQuery=true to bypass enhancedAlbumData
        }, 150) // Small delay to ensure database transaction is committed
      })

      // Trigger refresh events for other components
      window.dispatchEvent(new CustomEvent('albumRefresh'))
      window.dispatchEvent(new CustomEvent('photoDeleted', { detail: { photoId, albumId } }))
      if (onCoverImageChange) {
        onCoverImageChange()
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete photo',
        variant: 'destructive',
      })
    }
  }

  const getGridClass = () => {
    switch (viewMode) {
      case 'grid-large':
        return 'grid-cols-2 md:grid-cols-3 gap-4'
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
        <Skeleton key={i} className={viewMode === 'list' ? 'h-32' : 'aspect-square'} />
      ))}
    </div>
  )

  const PhotoCard = ({ photo, index }: { photo: Photo; index: number }) => {
    const isSelected = selectedPhotos.includes(photo.id)
    const canSelect = enableSelection || isOwner || isAdmin || isSuperAdmin
    const isListView = viewMode === 'list'

    return (
      <div
        className={`relative group cursor-pointer transition-all duration-200 hover:scale-105 ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        } ${isListView ? 'flex gap-4 p-4 bg-card rounded-lg' : ''}`}
        onClick={() => handlePhotoClick(photo, index)}
      >
        {/* Selection Checkbox - Show for owners/admins or when enableSelection is true */}
        {canSelect && (
          <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => handlePhotoSelect(photo.id, checked as boolean)}
              className="bg-white/80 backdrop-blur-xs"
            />
          </div>
        )}

        {/* Photo Image */}
        <div
          className={`relative overflow-hidden rounded-lg ${
            isListView ? 'w-32 h-32 flex-shrink-0' : 'aspect-square'
          }`}
        >
          <img
            src={
              addCacheBusting(photo.thumbnail_url || photo.url) || photo.thumbnail_url || photo.url
            }
            alt={photo.alt_text || 'Photo'}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {photo.is_cover && (
              <Badge variant="secondary" className="text-xs bg-blue-600 text-white">
                {(() => {
                  // Determine badge text based on album name
                  const albumName = enhancedAlbumData?.name || ''
                  if (albumName.includes('Avatar')) return 'Avatar Image'
                  if (albumName.includes('Header Cover')) return 'Header Cover Image'
                  if (albumName.includes('Cover')) return 'Cover Image'
                  return 'Cover Image' // Default fallback
                })()}
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

              {/* Action Buttons - Only show if owner, admin, or super admin */}
              {(isOwner || isAdmin || isSuperAdmin) && (
                <div className="flex gap-2">
                  {!photo.is_cover && (
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
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs h-7 px-2 bg-red-600/80 hover:bg-red-600 text-white border-red-500/30"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePhoto(photo.id, photo.url)
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
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
              <h4 className="font-medium line-clamp-1">{photo.alt_text || `Photo ${index + 1}`}</h4>
              {photo.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{photo.description}</p>
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

            {/* Action Buttons in List View - Only show if owner, admin, or super admin */}
            {(isOwner || isAdmin || isSuperAdmin) && (
              <div className="flex gap-2 mt-2">
                {!photo.is_cover && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSetAsCover(photo.id)
                    }}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Set as Cover
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="text-xs h-7"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeletePhoto(photo.id, photo.url)
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
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
                {sortOrder === 'asc' ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
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
                <Badge variant="secondary">{selectedPhotos.length} selected</Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Always show selection controls for owners/admins */}
              {(enableSelection || isOwner || isAdmin || isSuperAdmin) && (
                <>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {selectedPhotos.length === photos.length ? (
                      <CheckSquare className="h-4 w-4 mr-2" />
                    ) : (
                      <Square className="h-4 w-4 mr-2" />
                    )}
                    Select All
                  </Button>

                  {selectedPhotos.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete {selectedPhotos.length}
                    </Button>
                  )}
                </>
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
      <div className="grow overflow-auto p-4 pb-8">
        {loading && photos.length === 0 ? (
          <LoadingSkeleton />
        ) : photos.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No photos found</h3>
            <p className="text-muted-foreground">
              {searchQuery || filterBy !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Upload some photos to get started'}
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
                    <Skeleton key={i} className={viewMode === 'list' ? 'h-32' : 'aspect-square'} />
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
