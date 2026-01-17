'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import EntityComments from '@/components/entity-comments'
import { CloseButton } from '@/components/ui/close-button'
import { formatDate } from '@/lib/utils/dateUtils'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { isUserAdmin } from '@/lib/auth-utils'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Share2,
  Download,
  Tag,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Copy,
  ExternalLink,
  Facebook,
  Twitter,
  Instagram,
  Send,
  Edit,
  Trash2,
  Flag,
  Bookmark,
  MoreVertical,
  Star,
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
  is_featured?: boolean
  is_cover?: boolean
  shouldSetAsCover?: boolean
  user?: {
    name: string
    avatar_url?: string
  }
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

interface EnterprisePhotoViewerProps {
  isOpen: boolean
  onClose: () => void
  photos: Photo[]
  currentIndex: number
  onIndexChange: (index: number) => void
  albumId?: string
  entityId?: string
  entityType?: string
  isOwner?: boolean
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

export function EnterprisePhotoViewer({
  isOpen,
  onClose,
  photos,
  currentIndex,
  onIndexChange,
  albumId,
  entityId,
  entityType,
  isOwner = false,
  entityDisplayInfo,
}: EnterprisePhotoViewerProps) {
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showTags, setShowTags] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [albumOwner, setAlbumOwner] = useState<{ name: string; avatar_url?: string } | null>(null)

  const [isTagging, setIsTagging] = useState(false)
  const [tagPosition, setTagPosition] = useState<{ x: number; y: number } | null>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEntityType, setSelectedEntityType] = useState<
    'user' | 'book' | 'publisher' | 'author'
  >('user')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isPhotoDataLoaded, setIsPhotoDataLoaded] = useState(false)
  const [photoData, setPhotoData] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // Form state for editing
  const [editForm, setEditForm] = useState({
    alt_text: '',
    description: '',
    is_featured: false,
    shouldSetAsCover: false,
  })

  const supabase = supabaseClient
  const { toast } = useToast()
  const { user } = useAuth()

  // Check admin permissions
  useEffect(() => {
    if (user) {
      isUserAdmin(user.id).then(setIsAdmin)
    }
  }, [user])

  // Load album owner information when component mounts
  useEffect(() => {
    if (albumId) {
      loadAlbumOwner()
    }
  }, [albumId])

  const loadAlbumOwner = async () => {
    try {
      // Get album details to find the owner
      const { data: album, error: albumError } = await (supabase.from('photo_albums') as any)
        .select('owner_id, entity_id, entity_type')
        .eq('id', albumId)
        .single()

      if (albumError) throw albumError

      // Get the owner information based on entity type
      if ((album as any).entity_type === 'user' && (album as any).entity_id) {
        // For user albums, get the user information
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', (album as any).entity_id)
          .single()

        if (userData) {
          setAlbumOwner({
            name: (userData as any).name || (userData as any).email || 'User',
            avatar_url: undefined, // We'll need to get this from user metadata
          })
        }
      } else if ((album as any).entity_type === 'author' && (album as any).entity_id) {
        // For author albums, get the author information
        const { data: authorData } = await supabase
          .from('authors')
          .select('id, name')
          .eq('id', (album as any).entity_id)
          .single()

        if (authorData) {
          setAlbumOwner({
            name: (authorData as any).name || 'Author',
            avatar_url: undefined,
          })
        }
      } else if ((album as any).entity_type === 'publisher' && (album as any).entity_id) {
        // For publisher albums, get the publisher information
        const { data: publisherData } = await supabase
          .from('publishers')
          .select('id, name')
          .eq('id', (album as any).entity_id)
          .single()

        if (publisherData) {
          setAlbumOwner({
            name: (publisherData as any).name || 'Publisher',
            avatar_url: undefined,
          })
        }
      } else if ((album as any).entity_type === 'group' && (album as any).entity_id) {
        // For group albums, get the group information
        const { data: groupData } = await supabase
          .from('groups')
          .select('id, name')
          .eq('id', (album as any).entity_id)
          .single()

        if (groupData) {
          setAlbumOwner({
            name: (groupData as any).name || 'Group',
            avatar_url: undefined,
          })
        }
      }
    } catch (error) {
      console.error('Error loading album owner:', error)
      // Fallback to current user if we can't get album owner
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setAlbumOwner({
          name: (user as any)?.name || user.user_metadata?.full_name || user.email || 'User',
          avatar_url: (user as any)?.avatar_url || null,
        })
      }
    }
  }

  // Load photo data when index changes
  useEffect(() => {
    if (photos[currentIndex] && photos[currentIndex].id) {
      console.log('🔄 Photo index changed, loading photo data for:', photos[currentIndex].id)
      setIsPhotoDataLoaded(false)
      loadPhotoData(photos[currentIndex].id, albumId)
    } else {
      console.warn('⚠️ Warning: No valid photo data at current index:', currentIndex)
      setIsPhotoDataLoaded(false)
    }
  }, [currentIndex, photos, albumId])

  const loadPhotoData = async (photoId: string, albumId?: string) => {
    try {
      console.log('🔍 loadPhotoData called with photoId:', photoId, 'albumId:', albumId)
      console.log('🔍 currentIndex:', currentIndex)
      console.log('🔍 photos array length:', photos.length)

      // Check if this is a timeline photo (generated ID) or a real database photo
      const isTimelinePhoto = photoId.startsWith('post-') || photoId.startsWith('preview-')
      console.log('🔍 isTimelinePhoto:', isTimelinePhoto)

      if (isTimelinePhoto) {
        // For timeline photos, use the existing photo data from props
        const currentPhoto = photos[currentIndex]
        console.log('🔍 currentPhoto from props:', currentPhoto)
        if (currentPhoto) {
          setPhoto(currentPhoto)
          setIsPhotoDataLoaded(true)
        }
        return
      }

      // Validate photoId
      if (!photoId || photoId === 'undefined' || photoId === 'null') {
        console.error('❌ Invalid photoId:', photoId)
        throw new Error(`Invalid photoId: ${photoId}`)
      }

      // Check if photoId is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(photoId)) {
        console.warn('⚠️ PhotoId is not a valid UUID format:', photoId)
        // Don't throw error, continue with fallback
      }

      console.log('🔍 Querying database for photo:', photoId)

      // Try to get photo data from images table first
      let photoData = null
      let imageError = null

      try {
        console.log('🔍 Querying images table for photoId:', photoId)
        const { data: imageData, error: imgError } = await supabase
          .from('images')
          .select(
            `
            id,
            url,
            alt_text,
            description,
            created_at,
            updated_at,
            uploader_id,
            view_count,
            like_count,
            comment_count,
            share_count,
            download_count,
            metadata
          `
          )
          .eq('id', photoId)
          .single()

        console.log('🔍 Images table query result:', { imageData, imgError })

        if (!imgError && imageData) {
          photoData = imageData
          setPhotoData(imageData)
          console.log('🔍 Photo data found in images table:', photoData)
        } else {
          console.log('⚠️ No data in images table, error:', imgError)
          imageError = imgError
        }
      } catch (err) {
        console.log('⚠️ Error querying images table:', err)
        imageError = err
      }

      // If no data in images table, try to construct from album_images data
      if (!photoData) {
        console.log('🔍 Constructing photo data from album_images')
        const currentPhoto = photos[currentIndex]
        if (currentPhoto) {
          photoData = {
            id: currentPhoto.id,
            url: currentPhoto.url,
            alt_text: currentPhoto.alt_text || '',
            description: currentPhoto.description || '',
            created_at: currentPhoto.created_at || new Date().toISOString(),
            updated_at: (currentPhoto as any).updated_at || new Date().toISOString(),
            uploader_id: null,
            view_count: 0,
            like_count: 0,
            comment_count: 0,
            share_count: 0,
            download_count: 0,
            metadata: currentPhoto.metadata || {},
          }
          setPhotoData(photoData)
          console.log('🔍 Constructed photo data:', photoData)
        } else {
          console.error('❌ No current photo found at index:', currentIndex)
          throw new Error(`No photo data available at index ${currentIndex}`)
        }
      }

      console.log('🔍 Database query result:', { photoData, imageError })

      if (imageError) {
        console.error('❌ Database error from images table:', imageError)
        // Don't throw error, continue with fallback
      }

      if (!photoData) {
        console.error('❌ No photo data returned for ID:', photoId)
        throw new Error(`No photo found with ID: ${photoId}`)
      }

      // Debug: Log what we're actually getting from the database
      console.log('🔍 Raw photo data from database:', photoData)

      // Load album image settings if we have an albumId
      let albumImageSettings = null
      if (albumId) {
        console.log('🔍 Loading album image settings for albumId:', albumId, 'imageId:', photoId)
        const { data: albumImageData, error: albumImageError } = await supabase
          .from('album_images')
          .select('is_cover, is_featured, alt_text, description')
          .eq('album_id', albumId)
          .eq('image_id', photoId)
          .single()

        if (albumImageError) {
          console.warn('⚠️ Warning: Could not load album image settings:', albumImageError)
          // Don't throw error, just use defaults
          albumImageSettings = {
            is_cover: false,
            is_featured: false,
            alt_text: '',
            description: '',
          }
        } else {
          console.log('🔍 Album image settings loaded:', albumImageData)
          albumImageSettings = albumImageData
        }
      } else {
        console.log('🔍 No albumId provided, using default settings')
        albumImageSettings = { is_cover: false, is_featured: false, alt_text: '', description: '' }
      }

      // Get the actual image uploader information using the new uploader_id field
      let userInfo = null

      try {
        // Try uploader_id first (migration should have populated this)
        if (photoData.uploader_id) {
          console.log('🔍 Loading user info from uploader_id:', photoData.uploader_id)
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', photoData.uploader_id)
            .single()

          if (userError) {
            console.warn('⚠️ Warning: Could not load user data from uploader_id:', userError)
          } else if (userData) {
            userInfo = {
              name: (userData as any).name || (userData as any).email || 'User',
              avatar_url: undefined,
            }
            console.log('🔍 User info loaded from uploader_id:', userInfo)
          }
        }
        // Fall back to metadata.user_id if uploader_id is still null
        else if ((photoData as any).metadata?.user_id) {
          console.log(
            '🔍 Loading user info from metadata.user_id:',
            (photoData as any).metadata.user_id
          )
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', (photoData as any).metadata.user_id)
            .single()

          if (userError) {
            console.warn('⚠️ Warning: Could not load user data from metadata.user_id:', userError)
          } else if (userData) {
            userInfo = {
              name: (userData as any).name || (userData as any).email || 'User',
              avatar_url: undefined,
            }
            console.log('🔍 User info loaded from metadata.user_id:', userInfo)
          }
        }
      } catch (userLoadError) {
        console.warn('⚠️ Warning: Error loading user info:', userLoadError)
        // Don't throw error, just use default user info
      }

      if (!userInfo) {
        userInfo = { name: 'User', avatar_url: undefined }
        console.log('🔍 Using default user info')
      }

      // Use the existing counters from the images table and merge with album settings
      const photoWithData = {
        ...photoData,
        user: userInfo || { name: 'User', avatar_url: undefined },
        // Prioritize album-specific data over images table data
        alt_text: albumImageSettings?.alt_text || photoData.alt_text || '',
        description: albumImageSettings?.description || photoData.description || '',
        is_cover: albumImageSettings?.is_cover || false,
        is_featured: albumImageSettings?.is_featured || false,
        analytics: {
          views: photoData.view_count || 0,
          unique_views: Math.floor((photoData.view_count || 0) * 0.7), // Estimate
          downloads: photoData.download_count || 0,
          shares: photoData.share_count || 0,
          engagement_rate:
            photoData.view_count && photoData.view_count > 0
              ? (((photoData.like_count || 0) +
                  (photoData.comment_count || 0) +
                  (photoData.share_count || 0)) /
                  photoData.view_count) *
                100
              : 0,
        },
      }

      // Debug: Log the final photo data being set
      console.log('🔄 Final photo data being set:', photoWithData)
      console.log('🔄 Photo alt_text:', photoWithData.alt_text)
      console.log('🔄 Photo description:', photoWithData.description)

      setPhoto(photoWithData)
      setIsPhotoDataLoaded(true)

      // Track view by updating view count (only for real database photos)
      if (!isTimelinePhoto) {
        try {
          console.log('🔍 Updating view count for photo:', photoId)
          const { error: viewUpdateError } = await (supabase.from('images') as any)
            .update({ view_count: ((photoData as any).view_count || 0) + 1 })
            .eq('id', photoId)

          if (viewUpdateError) {
            console.warn('⚠️ Warning: Could not update view count:', viewUpdateError)
          } else {
            console.log('🔍 View count updated successfully')
          }
        } catch (viewUpdateError) {
          console.warn('⚠️ Warning: Error updating view count:', viewUpdateError)
          // Don't throw error, view count update is not critical
        }
      }

      // Check if current user liked this photo
      // TODO: Add current user check
    } catch (error) {
      console.error('❌ Error loading photo data:', error)

      // Fallback: try to use the photo data from props if available
      if (photos[currentIndex]) {
        console.log('🔄 Fallback: Using photo data from props')
        const fallbackPhoto = photos[currentIndex]
        setPhoto({
          ...fallbackPhoto,
          user: { name: 'User', avatar_url: undefined },
          is_cover: fallbackPhoto.is_cover || false,
          is_featured: fallbackPhoto.is_featured || false,
          analytics: {
            views: 0,
            unique_views: 0,
            downloads: 0,
            shares: 0,
            engagement_rate: 0,
          },
        })
        setIsPhotoDataLoaded(true)
      } else {
        console.error('❌ No fallback photo data available')
        setIsPhotoDataLoaded(false)
      }
    }
  }

  const trackAnalytics = async (photoId: string, eventType: string) => {
    try {
      // Check if this is a timeline photo (generated ID) or a real database photo
      const isTimelinePhoto = photoId.startsWith('post-') || photoId.startsWith('preview-')

      if (isTimelinePhoto) {
        // For timeline photos, analytics are handled differently
        console.log(`Timeline photo ${eventType} tracked for ${photoId}`)
        return
      }

      // Simple tracking by updating counters in images table
      if (eventType === 'view') {
        await (supabase as any).rpc('increment', {
          table_name: 'images',
          column_name: 'view_count',
          row_id: photoId,
        })
      } else if (eventType === 'download') {
        await (supabase as any).rpc('increment', {
          table_name: 'images',
          column_name: 'download_count',
          row_id: photoId,
        })
      }
    } catch (error) {
      console.error('Error tracking analytics:', error)
    }
  }

  const handleLike = async () => {
    if (!photo) return

    try {
      if (isLiked) {
        // Unlike
        await supabase.from('photo_likes').delete().eq('photo_id', photo.id)
        // .eq('user_id', currentUserId) // TODO: Add current user

        setIsLiked(false)
      } else {
        // Like
        await (supabase.from('photo_likes') as any).insert({
          photo_id: photo.id,
          // user_id: currentUserId, // TODO: Add current user
          created_at: new Date().toISOString(),
        })

        setIsLiked(true)
        await trackAnalytics(photo.id, 'like')
      }

      // Reload photo data
      await loadPhotoData(photo.id, albumId)
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleShare = async (platform: string) => {
    if (!photo) return

    try {
      const shareUrl = `${window.location.origin}/photos/${photo.id}`

      // Track share
      await (supabase.from('photo_shares') as any).insert({
        photo_id: photo.id,
        // user_id: currentUserId, // TODO: Add current user
        platform,
        created_at: new Date().toISOString(),
      })

      await trackAnalytics(photo.id, 'share')

      // Handle different platforms
      switch (platform) {
        case 'copy':
          await navigator.clipboard.writeText(shareUrl)
          toast({ title: 'Link copied to clipboard!' })
          break
        case 'facebook':
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
            '_blank'
          )
          break
        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(photo.alt_text || 'Check out this photo!')}`,
            '_blank'
          )
          break
        case 'instagram':
          toast({ title: 'Instagram sharing', description: 'Copy the link to share on Instagram' })
          break
        default:
          window.open(shareUrl, '_blank')
      }
    } catch (error) {
      console.error('Error sharing photo:', error)
    }
  }

  const handleDownload = async () => {
    if (!photo) return

    try {
      // Track download
      await trackAnalytics(photo.id, 'download')

      // Trigger download
      const link = document.createElement('a')
      link.href = photo.url
      link.download = `photo-${photo.id}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading photo:', error)
    }
  }

  const handleDeletePhoto = async () => {
    if (!photo) return

    // Confirm deletion
    if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      return
    }

    try {
      // Delete from album first
      if (albumId) {
        await supabase
          .from('album_images')
          .delete()
          .eq('album_id', albumId)
          .eq('image_id', photo.id)
      }

      // TODO: Consider if we should delete the image entirely or just remove from album
      // For now, we'll just remove from album

      toast({
        title: 'Photo deleted',
        description: 'Photo has been removed from the album',
      })

      // Navigate to next photo or close if last one
      if (photos.length > 1) {
        if (currentIndex >= photos.length - 1) {
          onIndexChange(0)
        } else {
          onIndexChange(currentIndex + 1)
        }
      } else {
        onClose()
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete photo',
        variant: 'destructive',
      })
    }
  }

  const handleTagPhoto = async (entityId: string, entityName: string) => {
    if (!photo || !tagPosition) return

    try {
      await (supabase.from('photo_tags') as any).insert({
        photo_id: photo.id,
        entity_type: selectedEntityType,
        entity_id: entityId,
        entity_name: entityName,
        x_position: tagPosition.x,
        y_position: tagPosition.y,
        // created_by: currentUserId, // TODO: Add current user
        created_at: new Date().toISOString(),
      })

      setIsTagging(false)
      setTagPosition(null)
      setSearchQuery('')
      setSearchResults([])
      await loadPhotoData(photo.id, albumId)
    } catch (error) {
      console.error('Error tagging photo:', error)
    }
  }

  const searchEntities = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      // For now, just provide mock results since we don't have all the entity tables
      // This can be enhanced later when the full user/book/author/publisher system is implemented
      const mockResults = [
        { id: '1', name: `Sample ${selectedEntityType} 1` },
        { id: '2', name: `Sample ${selectedEntityType} 2` },
        { id: '3', name: `Example ${selectedEntityType}` },
      ].filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))

      setSearchResults(mockResults)
    } catch (error) {
      console.error('Error searching entities:', error)
      setSearchResults([])
    }
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return

      // Don't handle keyboard shortcuts when user is typing in input fields
      // This includes input, textarea, contenteditable elements, and any form controls
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLButtonElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable) ||
        (e.target instanceof HTMLElement &&
          e.target.closest('input, textarea, select, button, [contenteditable]'))
      ) {
        // Allow normal input behavior for form fields
        return
      }

      // Only handle keyboard shortcuts when not in input fields
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
        case ' ':
          e.preventDefault()
          setShowComments(!showComments)
          break
      }
    },
    [isOpen, currentIndex, photos.length, onIndexChange, onClose, showComments]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleImageClick = (e: React.MouseEvent) => {
    if (isTagging) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setTagPosition({ x, y })
    } else {
      // Navigate to next image when not tagging
      if (currentIndex < photos.length - 1) {
        onIndexChange(currentIndex + 1)
      }
    }
  }

  if (!photo) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95"
        aria-describedby="photo-viewer-description"
      >
        <DialogTitle className="sr-only">Photo Viewer</DialogTitle>
        <div id="photo-viewer-description" className="sr-only">
          Photo viewer for {photo.alt_text || 'photo'} - Navigate through photos, zoom, rotate, and
          view details
        </div>
        <div className="flex flex-col md:flex-row h-[95vh] max-h-screen">
          {/* Main Image Area */}
          <div className="flex-1 relative flex items-center justify-center min-h-0">
            {/* Navigation Buttons */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 z-10 bg-primary hover:bg-[#40A3D8] text-primary-foreground hover:text-primary-foreground"
              onClick={() => currentIndex > 0 && onIndexChange(currentIndex - 1)}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 z-10 bg-primary hover:bg-[#40A3D8] text-primary-foreground hover:text-primary-foreground"
              onClick={() => currentIndex < photos.length - 1 && onIndexChange(currentIndex + 1)}
              disabled={currentIndex === photos.length - 1}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            {/* Top Controls */}
            <div className="absolute top-4 left-4 right-14 md:right-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 z-10">
              <div className="flex items-center gap-2 order-2 sm:order-1">
                <Badge variant="secondary" className="bg-black/50 text-white">
                  {currentIndex + 1} of {photos.length}
                </Badge>
                {photo.tags && photo.tags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-primary hover:bg-[#40A3D8] text-primary-foreground hover:text-primary-foreground"
                    onClick={() => setShowTags(!showTags)}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    {photo.tags.length} Tags
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 order-1 sm:order-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-primary hover:bg-[#40A3D8] text-primary-foreground hover:text-primary-foreground"
                  onClick={() => setZoom(zoom === 1 ? 2 : 1)}
                >
                  {zoom === 1 ? <ZoomIn className="h-4 w-4" /> : <ZoomOut className="h-4 w-4" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-primary hover:bg-[#40A3D8] text-primary-foreground hover:text-primary-foreground"
                  onClick={() => setRotation(rotation + 90)}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>

                {/* Info Button - Photo Details Modal */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="photo-details-info-button bg-primary hover:bg-[#40A3D8] text-primary-foreground hover:text-primary-foreground"
                  onClick={async () => {
                    // Refresh photo data when opening info modal
                    if (photo && albumId) {
                      console.log('🔄 Refreshing photo data for Info modal...')
                      await loadPhotoData(photo.id, albumId)
                    } else if (photo) {
                      console.log('🔄 Refreshing photo data for Info modal (no album)...')
                      await loadPhotoData(photo.id)
                    }
                    setShowDetailsModal(!showDetailsModal)
                  }}
                >
                  <Info className="photo-details-info-icon h-4 w-4" />
                </Button>

                {(isOwner || isAdmin) && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-primary hover:bg-[#40A3D8] text-primary-foreground hover:text-primary-foreground"
                      onClick={() => {
                        // Initialize form with current photo data
                        if (photo) {
                          console.log('🔄 Initializing edit form with current photo data:', {
                            alt_text: photo.alt_text || '',
                            description: photo.description || '',
                            is_featured: photo.is_featured || false,
                            shouldSetAsCover: photo.is_cover || false,
                          })

                          setEditForm({
                            alt_text: photo.alt_text || '',
                            description: photo.description || '',
                            is_featured: photo.is_featured || false,
                            shouldSetAsCover: photo.is_cover || false,
                          })
                        }
                        setShowEditModal(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-primary hover:bg-[#40A3D8] text-primary-foreground hover:text-primary-foreground"
                      onClick={handleDeletePhoto}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Main Image */}
            <div
              className={`relative w-full h-full flex items-center justify-center ${isTagging ? 'cursor-crosshair' : 'cursor-pointer'}`}
              onClick={handleImageClick}
              title={
                isTagging
                  ? 'Click to add tag'
                  : currentIndex < photos.length - 1
                    ? 'Click to go to next image'
                    : 'Last image'
              }
            >
              <img
                src={photo.url}
                alt={photo.alt_text || 'Photo'}
                className="max-w-full max-h-full object-contain"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.3s ease',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                }}
              />

              {/* Photo Tags */}
              {showTags &&
                photo.tags?.map((tag) => (
                  <div
                    key={tag.id}
                    className="absolute bg-blue-500 text-white px-2 py-1 rounded-sm text-xs transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${tag.x_position}%`, top: `${tag.y_position}%` }}
                  >
                    {tag.entity_name}
                  </div>
                ))}

              {/* Tag Position Indicator */}
              {isTagging && tagPosition && (
                <div
                  className="absolute w-4 h-4 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${tagPosition.x}%`, top: `${tagPosition.y}%` }}
                />
              )}
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col sm:flex-row items-center gap-2 z-10">
              <div className="flex items-center gap-2 order-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`bg-primary hover:bg-[#40A3D8] text-primary-foreground hover:text-primary-foreground ${isLiked ? 'text-red-500' : ''}`}
                  onClick={handleLike}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  {photo.likes?.length || 0}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-primary hover:bg-[#40A3D8] text-primary-foreground hover:text-primary-foreground"
                  onClick={() => setShowComments(!showComments)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {photo.comments?.length || 0}
                </Button>
              </div>

              <div className="flex items-center gap-2 order-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-primary hover:bg-[#40A3D8] text-primary-foreground hover:text-primary-foreground"
                  onClick={() => handleShare('copy')}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-primary hover:bg-[#40A3D8] text-primary-foreground hover:text-primary-foreground"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>

                {isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`bg-primary hover:bg-[#40A3D8] text-primary-foreground hover:text-primary-foreground ${isTagging ? 'bg-blue-600' : ''}`}
                    onClick={() => setIsTagging(!isTagging)}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Tag
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Responsive Width */}
          <div className="w-full md:w-96 bg-white border-t md:border-l md:border-t-0 border-gray-200 flex flex-col pt-4 md:pt-14 max-h-[50vh] md:max-h-none overflow-y-auto">
            {/* Sidebar */}
            {isPhotoDataLoaded ? (
              <div className="p-4 text-left text-gray-500">
                Comments are now displayed inline with the post
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                  <div className="text-sm text-gray-500">Loading photo details...</div>
                </div>
              </div>
            )}
            {/* <EntityComments
              entityId={photo.id}
              entityType="photo"
              entityName={photo.user?.name || "User"}
              entityAvatar={photo.user?.avatar_url}
              entityCreatedAt={photo.created_at}
              isOwner={isOwner}
              entityDisplayInfo={entityDisplayInfo}
            /> */}
          </div>
        </div>

        {/* Tagging Modal */}
        {isTagging && tagPosition && (
          <div className="photo-tagging-modal-overlay absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="photo-tagging-modal-content bg-background p-4 rounded-lg max-w-md w-full mx-4">
              <h3 className="photo-tagging-modal-title font-semibold mb-4">Tag Someone</h3>

              <div className="photo-tagging-modal-body space-y-4">
                <div className="photo-tagging-entity-type-selector">
                  <Select
                    value={selectedEntityType}
                    onValueChange={(value: any) => setSelectedEntityType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="book">Book</SelectItem>
                      <SelectItem value="publisher">Publisher</SelectItem>
                      <SelectItem value="author">Author</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="photo-tagging-search-input">
                  <Input
                    placeholder={`Search ${selectedEntityType}s...`}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      searchEntities(e.target.value)
                    }}
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="photo-tagging-search-results">
                    <ScrollArea className="h-32">
                      <div className="photo-tagging-search-results-list space-y-1">
                        {searchResults.map((result) => (
                          <Button
                            key={result.id}
                            variant="ghost"
                            className="photo-tagging-search-result-item w-full justify-start"
                            onClick={() => handleTagPhoto(result.id, result.name)}
                          >
                            {result.name}
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              <div className="photo-tagging-modal-actions flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsTagging(false)}
                  className="photo-tagging-cancel-button flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Photo Details Modal */}
        {showDetailsModal && (
          <div className="photo-details-modal-overlay absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="photo-details-modal-content bg-background p-4 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="photo-details-modal-header flex items-center justify-between mb-4">
                <h3 className="photo-details-modal-title font-semibold text-lg">Photo Details</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="photo-details-modal-close-button"
                  onClick={() => setShowDetailsModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="photo-details-content space-y-4">
                {/* Description Section */}
                {photo.description && (
                  <div className="photo-description-section">
                    <h4 className="photo-description-label font-semibold mb-2">Description</h4>
                    <p className="photo-description-text text-muted-foreground">
                      {photo.description}
                    </p>
                  </div>
                )}

                {/* Analytics Section */}
                <div className="photo-analytics-section">
                  <h4 className="photo-analytics-label font-semibold mb-2">Analytics</h4>
                  <div className="photo-analytics-grid grid grid-cols-2 gap-4">
                    <div className="photo-analytics-item">
                      <span className="photo-analytics-label text-sm text-muted-foreground">
                        Views:
                      </span>
                      <span className="photo-analytics-value ml-2 font-medium">
                        {photoData?.view_count || 0}
                      </span>
                    </div>
                    <div className="photo-analytics-item">
                      <span className="photo-analytics-label text-sm text-muted-foreground">
                        Likes:
                      </span>
                      <span className="photo-analytics-value ml-2 font-medium">
                        {photoData?.like_count || 0}
                      </span>
                    </div>
                    <div className="photo-analytics-item">
                      <span className="photo-analytics-label text-sm text-muted-foreground">
                        Comments:
                      </span>
                      <span className="photo-analytics-value ml-2 font-medium">
                        {photoData?.comment_count || 0}
                      </span>
                    </div>
                    <div className="photo-analytics-item">
                      <span className="photo-analytics-label text-sm text-muted-foreground">
                        Downloads:
                      </span>
                      <span className="photo-analytics-value ml-2 font-medium">
                        {photoData?.download_count || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tags Section */}
                {photoData?.tags && photoData.tags.length > 0 && (
                  <div className="photo-tags-section">
                    <h4 className="photo-tags-label font-semibold mb-2">Tags</h4>
                    <div className="photo-tags-container flex flex-wrap gap-2">
                      {photoData.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="photo-tag-badge">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Info Section */}
                <div className="photo-upload-info-section">
                  <h4 className="photo-upload-info-label font-semibold mb-2">Upload Info</h4>
                  <div className="photo-upload-info-content text-sm text-muted-foreground space-y-1">
                    <div className="photo-upload-date">
                      <span className="photo-upload-date-label">Date:</span>
                      <span className="photo-upload-date-value ml-2">
                        {formatDate(photo.created_at)}
                      </span>
                    </div>
                    {photoData?.metadata && (
                      <>
                        {photoData.metadata.file_size && (
                          <div className="photo-upload-file-size">
                            <span className="photo-upload-file-size-label">Size:</span>
                            <span className="photo-upload-file-size-value ml-2">
                              {(photoData.metadata.file_size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                        )}
                        {photoData.metadata.dimensions && (
                          <div className="photo-upload-dimensions">
                            <span className="photo-upload-dimensions-label">Dimensions:</span>
                            <span className="photo-upload-dimensions-value ml-2">
                              {photoData.metadata.dimensions.width} ×{' '}
                              {photoData.metadata.dimensions.height}
                            </span>
                          </div>
                        )}
                        {photoData.metadata.format && (
                          <div className="photo-upload-format">
                            <span className="photo-upload-format-label">Format:</span>
                            <span className="photo-upload-format-value ml-2">
                              {photoData.metadata.format}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Album Settings Section */}
                <div className="photo-album-settings-section">
                  <h4 className="photo-album-settings-label font-semibold mb-2">Album Settings</h4>
                  <div className="photo-album-settings-content text-sm text-muted-foreground space-y-1">
                    <div className="photo-cover-status">
                      <span className="photo-cover-status-label">Cover Image:</span>
                      <span
                        className={`photo-cover-status-value ml-2 ${photo.is_cover ? 'text-green-600' : 'text-gray-500'}`}
                      >
                        {photo.is_cover ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="photo-featured-status">
                      <span className="photo-featured-status-label">Featured:</span>
                      <span
                        className={`photo-featured-status-value ml-2 ${photo.is_featured ? 'text-blue-600' : 'text-gray-500'}`}
                      >
                        {photo.is_featured ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="photo-edit-modal-overlay absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="photo-edit-modal-content bg-background p-4 rounded-lg max-w-md w-full mx-4">
              <div className="photo-edit-modal-header flex items-center justify-between mb-4">
                <h3 className="photo-edit-modal-title font-semibold text-lg">Edit Photo</h3>
                <CloseButton onClick={() => setShowEditModal(false)} />
              </div>

              <div className="photo-edit-modal-body space-y-4">
                <div className="photo-edit-alt-text-field">
                  <label className="photo-edit-alt-text-label block text-sm font-medium mb-2">
                    Alt Text
                  </label>
                  <Input
                    value={editForm.alt_text}
                    onChange={(e) => {
                      setEditForm((prev) => ({ ...prev, alt_text: e.target.value }))
                    }}
                    placeholder="Describe this photo"
                  />
                </div>

                <div className="photo-edit-description-field">
                  <label className="photo-edit-description-label block text-sm font-medium mb-2">
                    Description
                  </label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => {
                      setEditForm((prev) => ({ ...prev, description: e.target.value }))
                    }}
                    placeholder="Add a description"
                    className="h-20"
                  />
                </div>

                <div className="photo-edit-featured-checkbox">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={editForm.is_featured}
                    onChange={(e) => {
                      setEditForm((prev) => ({ ...prev, is_featured: e.target.checked }))
                    }}
                  />
                  <label
                    htmlFor="featured"
                    className="photo-edit-featured-label text-sm font-medium"
                  >
                    Featured Photo
                  </label>
                </div>

                {/* Set as Cover Option - Only show if not already cover and owner */}
                {isOwner && !photo.is_cover && (
                  <div className="photo-edit-cover-checkbox">
                    <input
                      type="checkbox"
                      id="setAsCover"
                      checked={editForm.shouldSetAsCover}
                      onChange={(e) => {
                        setEditForm((prev) => ({ ...prev, shouldSetAsCover: e.target.checked }))
                      }}
                    />
                    <label
                      htmlFor="setAsCover"
                      className="photo-edit-cover-label text-sm font-medium"
                    >
                      Set as Cover Image
                    </label>
                  </div>
                )}

                {/* Current Cover Status */}
                {photo.is_cover && (
                  <div className="photo-edit-current-cover-status flex items-center space-x-2 text-sm text-green-600">
                    <Star className="h-4 w-4" />
                    <span>This is currently the cover image</span>
                  </div>
                )}

                <div className="photo-edit-actions flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!photo) return

                      try {
                        console.log('💾 Saving photo updates:', {
                          photoId: photo.id,
                          alt_text: editForm.alt_text,
                          description: editForm.description,
                          is_featured: editForm.is_featured,
                          shouldSetAsCover: editForm.shouldSetAsCover,
                        })

                        // Update only album_images table with album-specific customizations
                        // The images table should remain unchanged - it contains the original image data
                        if (albumId) {
                          console.log(
                            '🔄 Updating album_images table with album-specific metadata...'
                          )
                          const { data: albumImageUpdateResult, error: albumImageError } = await (
                            supabase.from('album_images') as any
                          )
                            .update({
                              alt_text: editForm.alt_text,
                              description: editForm.description,
                            })
                            .eq('album_id', albumId)
                            .eq('image_id', photo.id)
                            .select()

                          if (albumImageError) {
                            console.error('❌ Error updating album_images table:', albumImageError)
                            throw albumImageError
                          } else {
                            console.log(
                              '✅ Album-specific metadata updated successfully:',
                              albumImageUpdateResult
                            )
                          }
                        }

                        // Update album image settings if needed
                        if (albumId) {
                          console.log('🖼️ Updating album image settings for album:', albumId)

                          // If setting as cover, first unset all other cover images
                          if (editForm.shouldSetAsCover) {
                            console.log(
                              '🔄 Setting image as cover - unsetting previous cover images'
                            )
                            const { data: unsetResult, error: unsetError } = await (
                              supabase.from('album_images') as any
                            )
                              .update({ is_cover: false })
                              .eq('album_id', albumId)
                              .eq('is_cover', true)
                              .select()

                            if (unsetError) {
                              console.error('❌ Error unsetting previous cover images:', unsetError)
                              throw unsetError
                            }

                            console.log('✅ Previous cover images unset:', unsetResult)
                          }

                          // Update album image settings
                          const { data: albumUpdateResult, error: albumError } = await (
                            supabase.from('album_images') as any
                          )
                            .update({
                              is_featured: editForm.is_featured,
                              is_cover: editForm.shouldSetAsCover ? true : photo.is_cover,
                            })
                            .eq('album_id', albumId)
                            .eq('image_id', photo.id)
                            .select()

                          if (albumError) {
                            console.error('❌ Error updating album image settings:', albumError)
                            throw albumError
                          }

                          console.log('✅ Album image settings updated:', albumUpdateResult)

                          // If this is a USER system album, also update the canonical profile pointer.
                          // Albums are archive/history only; the current avatar/cover lives on profiles.*_image_id.
                          if (
                            entityType === 'user' &&
                            entityId &&
                            editForm.shouldSetAsCover &&
                            albumId
                          ) {
                            const { data: albumData, error: albumCheckError } = await (
                              supabase.from('photo_albums') as any
                            )
                              .select('name, entity_type, entity_id')
                              .eq('id', albumId)
                              .single()

                            if (!albumCheckError && albumData) {
                              const albumName = (albumData as any).name
                              const isUserAlbum = (albumData as any).entity_type === 'user'
                              const albumEntityId = (albumData as any).entity_id

                              if (
                                isUserAlbum &&
                                albumEntityId &&
                                (albumName === 'Avatar Images' ||
                                  albumName === 'Header Cover Images')
                              ) {
                                const primaryKind =
                                  albumName === 'Avatar Images' ? 'avatar' : 'cover'
                                const resp = await fetch('/api/entity-primary-image', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    entityType: 'user',
                                    entityId: albumEntityId,
                                    imageId: photo.id,
                                    primaryKind,
                                  }),
                                })

                                const payload = await resp.json().catch(() => null)
                                if (!resp.ok || !payload?.success) {
                                  console.error(
                                    '❌ Failed to update canonical primary image:',
                                    payload
                                  )
                                } else {
                                  window.dispatchEvent(
                                    new CustomEvent('entityPrimaryImageChanged', {
                                      detail: {
                                        entityType: 'user',
                                        entityId: albumEntityId,
                                        primaryKind,
                                        imageUrl: photo.url || payload.imageUrl,
                                      },
                                    })
                                  )
                                }
                              }
                            }
                          }

                          // Update publisher_image_id when setting avatar as cover for publishers
                          if (
                            entityType === 'publisher' &&
                            entityId &&
                            editForm.shouldSetAsCover &&
                            albumId
                          ) {
                            // Check if this is an avatar album by querying the album
                            const { data: albumData, error: albumCheckError } = await (
                              supabase.from('photo_albums') as any
                            )
                              .select('name, metadata')
                              .eq('id', albumId)
                              .single()

                            if (!albumCheckError && albumData) {
                              const isAvatarAlbum =
                                (albumData as any).name === 'Avatar Images' ||
                                (albumData as any).metadata?.album_purpose === 'avatar'

                              if (isAvatarAlbum) {
                                console.log(
                                  `🔄 Updating publisher_image_id for publisher ${entityId} with image ${photo.id}`
                                )
                                const { error: publisherUpdateError } = await (
                                  supabase.from('publishers') as any
                                )
                                  .update({ publisher_image_id: photo.id })
                                  .eq('id', entityId)

                                if (publisherUpdateError) {
                                  console.error(
                                    '❌ Error updating publisher_image_id:',
                                    publisherUpdateError
                                  )
                                  // Don't fail - the album image is already updated
                                } else {
                                  console.log(
                                    `✅ publisher_image_id updated for publisher ${entityId}`
                                  )
                                }
                              }
                            }
                          }
                        }

                        // Update local photo state to reflect changes
                        const updatedPhoto = {
                          ...photo,
                          alt_text: editForm.alt_text,
                          description: editForm.description,
                          is_featured: editForm.is_featured,
                          is_cover: editForm.shouldSetAsCover ? true : photo.is_cover,
                        }

                        console.log('🔄 Updating local photo state:', updatedPhoto)
                        setPhoto(updatedPhoto)

                        setShowEditModal(false)
                        toast({
                          title: 'Photo updated',
                          description: editForm.shouldSetAsCover
                            ? 'Photo updated and set as cover image'
                            : 'Photo details have been saved',
                        })

                        // Trigger cover image change event if cover was set
                        if (editForm.shouldSetAsCover) {
                          window.dispatchEvent(new CustomEvent('entityImageChanged'))
                        }

                        // Trigger photo updated event to refresh the grid
                        window.dispatchEvent(new CustomEvent('photoUpdated'))

                        // Also trigger album refresh event to update enhanced data
                        window.dispatchEvent(new CustomEvent('albumRefresh'))

                        // Verify the update was saved to database
                        console.log('🔍 Verifying database update...')
                        const { data: verifyData, error: verifyError } = await supabase
                          .from('images')
                          .select('alt_text, description')
                          .eq('id', photo.id)
                          .single()

                        if (verifyError) {
                          console.error('❌ Error verifying update:', verifyError)
                        } else {
                          console.log('✅ Database verification successful:', verifyData)
                        }

                        // Reload photo data to ensure everything is in sync
                        await loadPhotoData(photo.id, albumId)
                      } catch (error) {
                        console.error('Error updating photo:', error)
                        toast({
                          title: 'Error',
                          description: 'Failed to update photo',
                          variant: 'destructive',
                        })
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="photo-share-modal-overlay absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="photo-share-modal-content bg-background p-4 rounded-lg max-w-md w-full mx-4">
              <div className="photo-share-modal-header flex items-center justify-between mb-4">
                <h3 className="photo-share-modal-title font-semibold text-lg">Share Photo</h3>
                <CloseButton onClick={() => setShowShareModal(false)} />
              </div>

              <div className="photo-share-modal-body space-y-4">
                <div className="photo-share-social-media-section">
                  <h4 className="photo-share-social-media-title font-semibold mb-2">
                    Share on Social Media
                  </h4>
                  <div className="photo-share-social-media-buttons grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => handleShare('facebook')}>
                      <Facebook className="h-4 w-4 mr-2" />
                      Facebook
                    </Button>
                    <Button variant="outline" onClick={() => handleShare('twitter')}>
                      <Twitter className="h-4 w-4 mr-2" />
                      Twitter
                    </Button>
                    <Button variant="outline" onClick={() => handleShare('instagram')}>
                      <Instagram className="h-4 w-4 mr-2" />
                      Instagram
                    </Button>
                    <Button variant="outline" onClick={() => handleShare('copy')}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                </div>

                <div className="photo-share-direct-link-section">
                  <h4 className="photo-share-direct-link-title font-semibold mb-2">Direct Link</h4>
                  <div className="photo-share-direct-link-input flex gap-2">
                    <Input
                      value={`${window.location.origin}/photos/${photo.id}`}
                      readOnly
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon" onClick={() => handleShare('copy')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="photo-share-embed-section">
                  <h4 className="photo-share-embed-title font-semibold mb-2">Embed Code</h4>
                  <Textarea
                    value={`<iframe src="${window.location.origin}/embed/photos/${photo.id}" width="600" height="400"></iframe>`}
                    readOnly
                    className="h-20"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
