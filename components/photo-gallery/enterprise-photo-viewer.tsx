'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  MoreVertical
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
  entityId: string
  entityType: string
  isOwner?: boolean
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
  isOwner = false
}: EnterprisePhotoViewerProps) {
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showTags, setShowTags] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [albumOwner, setAlbumOwner] = useState<{ name: string; avatar_url?: string } | null>(null)

  const [isTagging, setIsTagging] = useState(false)
  const [tagPosition, setTagPosition] = useState<{ x: number; y: number } | null>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEntityType, setSelectedEntityType] = useState<'user' | 'book' | 'publisher' | 'author'>('user')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isPhotoDataLoaded, setIsPhotoDataLoaded] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  
  const supabase = createClientComponentClient()
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
      const { data: album, error: albumError } = await supabase
        .from('photo_albums')
        .select('owner_id, entity_id, entity_type')
        .eq('id', albumId)
        .single()

      if (albumError) throw albumError

      // Get the owner information based on entity type
      if (album.entity_type === 'user' && album.entity_id) {
        // For user albums, get the user information
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', album.entity_id)
          .single()

        if (userData) {
          setAlbumOwner({
            name: userData.name || userData.email || "User",
            avatar_url: undefined // We'll need to get this from user metadata
          })
        }
      } else if (album.entity_type === 'author' && album.entity_id) {
        // For author albums, get the author information
        const { data: authorData } = await supabase
          .from('authors')
          .select('id, name')
          .eq('id', album.entity_id)
          .single()

        if (authorData) {
          setAlbumOwner({
            name: authorData.name || "Author",
            avatar_url: undefined
          })
        }
      } else if (album.entity_type === 'publisher' && album.entity_id) {
        // For publisher albums, get the publisher information
        const { data: publisherData } = await supabase
          .from('publishers')
          .select('id, name')
          .eq('id', album.entity_id)
          .single()

        if (publisherData) {
          setAlbumOwner({
            name: publisherData.name || "Publisher",
            avatar_url: undefined
          })
        }
      } else if (album.entity_type === 'group' && album.entity_id) {
        // For group albums, get the group information
        const { data: groupData } = await supabase
          .from('groups')
          .select('id, name')
          .eq('id', album.entity_id)
          .single()

        if (groupData) {
          setAlbumOwner({
            name: groupData.name || "Group",
            avatar_url: undefined
          })
        }
      }
    } catch (error) {
      console.error('Error loading album owner:', error)
      // Fallback to current user if we can't get album owner
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setAlbumOwner({
          name: user.user_metadata?.full_name || user.email || "User",
          avatar_url: user.user_metadata?.avatar_url
        })
      }
    }
  }

  // Load photo data when index changes
  useEffect(() => {
    if (photos[currentIndex]) {
      setIsPhotoDataLoaded(false)
      loadPhotoData(photos[currentIndex].id)
    }
  }, [currentIndex, photos])

  const loadPhotoData = async (photoId: string) => {
    try {
      // Load photo with tags, likes, comments, and user information
      const { data: photoData, error } = await supabase
        .from('images')
        .select(`
          *,
          photo_tags:photo_tags(
            id,
            entity_type,
            entity_id,
            entity_name,
            x_position,
            y_position,
            created_at,
            tagged_by
          ),
          photo_likes:photo_likes(
            id,
            user_id,
            like_type,
            created_at
          ),
          photo_comments:photo_comments(
            id,
            user_id,
            content,
            parent_id,
            created_at,
            updated_at
          ),
          photo_shares:photo_shares(
            id,
            user_id,
            share_type,
            created_at
          )
        `)
        .eq('id', photoId)
        .single()

      if (error) throw error

      // Get the actual image uploader information using the new uploader_id field
      let userInfo = null
      
      // Try uploader_id first (migration should have populated this)
      if (photoData.uploader_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', photoData.uploader_id)
          .single()
        
        if (userData) {
          userInfo = {
            name: userData.name || userData.email || "User",
            avatar_url: undefined
          }
        }
      }
      // Fall back to metadata.user_id if uploader_id is still null
      else if (photoData.metadata?.user_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', photoData.metadata.user_id)
          .single()
        
        if (userData) {
          userInfo = {
            name: userData.name || userData.email || "User",
            avatar_url: undefined
          }
        }
      }



      // Use the existing counters from the images table
      const photoWithData = {
        ...photoData,
        user: userInfo || { name: "User", avatar_url: undefined },
        analytics: {
          views: photoData.view_count || 0,
          unique_views: Math.floor((photoData.view_count || 0) * 0.7), // Estimate
          downloads: photoData.download_count || 0,
          shares: photoData.share_count || 0,
          engagement_rate: photoData.view_count > 0 ? 
            ((photoData.like_count || 0) + (photoData.comment_count || 0) + (photoData.share_count || 0)) / photoData.view_count * 100 : 0
        }
      }

      setPhoto(photoWithData)
      setIsPhotoDataLoaded(true)
      
      // Track view by updating view count
      await supabase
        .from('images')
        .update({ view_count: (photoData.view_count || 0) + 1 })
        .eq('id', photoId)
      
      // Check if current user liked this photo
      // TODO: Add current user check
      
    } catch (error) {
      console.error('Error loading photo data:', error)
    }
  }

  const trackAnalytics = async (photoId: string, eventType: string) => {
    try {
      // Simple tracking by updating counters in images table
      if (eventType === 'view') {
        await supabase.rpc('increment', { 
          table_name: 'images', 
          column_name: 'view_count', 
          row_id: photoId 
        })
      } else if (eventType === 'download') {
        await supabase.rpc('increment', { 
          table_name: 'images', 
          column_name: 'download_count', 
          row_id: photoId 
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
        await supabase
          .from('photo_likes')
          .delete()
          .eq('photo_id', photo.id)
          // .eq('user_id', currentUserId) // TODO: Add current user
        
        setIsLiked(false)
      } else {
        // Like
        await supabase
          .from('photo_likes')
          .insert({
            photo_id: photo.id,
            // user_id: currentUserId, // TODO: Add current user
            created_at: new Date().toISOString()
          })
        
        setIsLiked(true)
        await trackAnalytics(photo.id, 'like')
      }
      
      // Reload photo data
      await loadPhotoData(photo.id)
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }



  const handleShare = async (platform: string) => {
    if (!photo) return
    
    try {
      const shareUrl = `${window.location.origin}/photos/${photo.id}`
      
      // Track share
      await supabase
        .from('photo_shares')
        .insert({
          photo_id: photo.id,
          // user_id: currentUserId, // TODO: Add current user
          platform,
          created_at: new Date().toISOString()
        })
      
      await trackAnalytics(photo.id, 'share')
      
      // Handle different platforms
      switch (platform) {
        case 'copy':
          await navigator.clipboard.writeText(shareUrl)
          toast({ title: 'Link copied to clipboard!' })
          break
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')
          break
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(photo.alt_text || 'Check out this photo!')}`, '_blank')
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
        description: 'Photo has been removed from the album'
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
        variant: 'destructive'
      })
    }
  }

  const handleTagPhoto = async (entityId: string, entityName: string) => {
    if (!photo || !tagPosition) return
    
    try {
      await supabase
        .from('photo_tags')
        .insert({
          photo_id: photo.id,
          entity_type: selectedEntityType,
          entity_id: entityId,
          entity_name: entityName,
          x_position: tagPosition.x,
          y_position: tagPosition.y,
          // created_by: currentUserId, // TODO: Add current user
          created_at: new Date().toISOString()
        })
      
      setIsTagging(false)
      setTagPosition(null)
      setSearchQuery('')
      setSearchResults([])
      await loadPhotoData(photo.id)
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
        { id: '3', name: `Example ${selectedEntityType}` }
      ].filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
      
      setSearchResults(mockResults)
    } catch (error) {
      console.error('Error searching entities:', error)
      setSearchResults([])
    }
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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
      case ' ':
        e.preventDefault()
        setShowComments(!showComments)
        break
    }
  }, [isOpen, currentIndex, photos.length, onIndexChange, onClose, showComments])

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
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95">
        <DialogTitle className="sr-only">Photo Viewer</DialogTitle>
        <div className="flex h-[95vh]">
          {/* Main Image Area */}
          <div className="flex-1 relative flex items-center justify-center">
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
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-black/50 text-white">
                  {currentIndex + 1} of {photos.length}
                </Badge>
                {photo.tags && photo.tags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => setShowTags(!showTags)}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    {photo.tags.length} Tags
                  </Button>
                )}
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
                  onClick={() => setRotation(rotation + 90)}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setShowInfo(!showInfo)}
                >
                  <Info className="h-4 w-4" />
                </Button>
                
                {(isOwner || isAdmin) && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-black/50 hover:bg-black/70 text-white"
                      onClick={() => setShowDetailsModal(true)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-black/50 hover:bg-red-700 text-white"
                      onClick={handleDeletePhoto}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                
                <CloseButton
                  onClick={onClose}
                  className="text-white hover:opacity-80 transition-opacity"
                />
              </div>
            </div>

            {/* Main Image */}
            <div 
              className={`relative w-full h-full flex items-center justify-center ${isTagging ? 'cursor-crosshair' : 'cursor-pointer'}`}
              onClick={handleImageClick}
              title={isTagging ? 'Click to add tag' : currentIndex < photos.length - 1 ? 'Click to go to next image' : 'Last image'}
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
                   height: 'auto'
                 }}
               />
              
              {/* Photo Tags */}
              {showTags && photo.tags?.map((tag) => (
                <div
                  key={tag.id}
                  className="absolute bg-blue-500 text-white px-2 py-1 rounded text-xs transform -translate-x-1/2 -translate-y-1/2"
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
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-10">
              <Button
                variant="ghost"
                size="sm"
                className={`bg-black/50 hover:bg-black/70 text-white ${isLiked ? 'text-red-500' : ''}`}
                onClick={handleLike}
              >
                <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                {photo.likes?.length || 0}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {photo.comments?.length || 0}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={() => handleShare('copy')}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              
              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`bg-black/50 hover:bg-black/70 text-white ${isTagging ? 'bg-blue-600' : ''}`}
                  onClick={() => setIsTagging(!isTagging)}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Tag
                </Button>
              )}
            </div>
          </div>

          {/* Right Sidebar - Fixed Width */}
          <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
            {/* Sidebar */}
            {isPhotoDataLoaded ? (
              <EntityComments
                entityId={photo.id}
                entityType="photo"
                entityName={photo.user?.name || "User"}
                entityAvatar={photo.user?.avatar_url}
                entityCreatedAt={photo.created_at}
                isOwner={isOwner}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                  <div className="text-sm text-gray-500">Loading photo details...</div>
                </div>
              </div>
            )}
          </div>

                     {/* Tagging Modal */}
           {isTagging && tagPosition && (
             <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
               <div className="bg-background p-4 rounded-lg max-w-md w-full mx-4">
                 <h3 className="font-semibold mb-4">Tag Someone</h3>
                 
                 <div className="space-y-4">
                   <Select value={selectedEntityType} onValueChange={(value: any) => setSelectedEntityType(value)}>
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
                   
                   <Input
                     placeholder={`Search ${selectedEntityType}s...`}
                     value={searchQuery}
                     onChange={(e) => {
                       setSearchQuery(e.target.value)
                       searchEntities(e.target.value)
                     }}
                   />
                   
                   {searchResults.length > 0 && (
                     <ScrollArea className="h-32">
                       <div className="space-y-1">
                         {searchResults.map((result) => (
                           <Button
                             key={result.id}
                             variant="ghost"
                             className="w-full justify-start"
                             onClick={() => handleTagPhoto(result.id, result.name)}
                           >
                             {result.name}
                           </Button>
                         ))}
                       </div>
                     </ScrollArea>
                   )}
                 </div>
                 
                 <div className="flex gap-2 mt-4">
                   <Button variant="outline" onClick={() => setIsTagging(false)} className="flex-1">
                     Cancel
                   </Button>
                 </div>
               </div>
             </div>
           )}

           {/* Details Modal */}
           {showDetailsModal && (
             <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
               <div className="bg-background p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="font-semibold text-lg">Photo Details</h3>
                   <CloseButton
                     onClick={() => setShowDetailsModal(false)}
                   />
                 </div>
                 
                 <div className="space-y-6">
                   {photo.description && (
                     <div>
                       <h4 className="font-semibold mb-2">Description</h4>
                       <p className="text-sm text-muted-foreground">{photo.description}</p>
                     </div>
                   )}
                   
                   <div>
                     <h4 className="font-semibold mb-2">Analytics</h4>
                     <div className="grid grid-cols-2 gap-4 text-sm">
                       <div className="bg-muted p-3 rounded">
                         <div className="font-medium">Views</div>
                         <div className="text-2xl font-bold">{photo.analytics?.views || 0}</div>
                       </div>
                       <div className="bg-muted p-3 rounded">
                         <div className="font-medium">Likes</div>
                         <div className="text-2xl font-bold">{photo.likes?.length || 0}</div>
                       </div>
                       <div className="bg-muted p-3 rounded">
                         <div className="font-medium">Comments</div>
                         <div className="text-2xl font-bold">{photo.comments?.length || 0}</div>
                       </div>
                       <div className="bg-muted p-3 rounded">
                         <div className="font-medium">Shares</div>
                         <div className="text-2xl font-bold">{photo.analytics?.shares || 0}</div>
                       </div>
                     </div>
                   </div>
                   
                   {photo.tags && photo.tags.length > 0 && (
                     <div>
                       <h4 className="font-semibold mb-2">Tags</h4>
                       <div className="flex flex-wrap gap-2">
                         {photo.tags.map((tag) => (
                           <Badge key={tag.id} variant="secondary">
                             {tag.entity_name}
                           </Badge>
                         ))}
                       </div>
                     </div>
                   )}
                   
                   <div>
                     <h4 className="font-semibold mb-2">Upload Info</h4>
                     <div className="text-sm text-muted-foreground space-y-1">
                       <div>Date: {new Date(photo.created_at).toLocaleDateString()}</div>
                       {photo.metadata && (
                         <>
                           {photo.metadata.file_size && (
                             <div>Size: {(photo.metadata.file_size / 1024 / 1024).toFixed(2)} MB</div>
                           )}
                           {photo.metadata.dimensions && (
                             <div>Dimensions: {photo.metadata.dimensions}</div>
                           )}
                         </>
                       )}
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )}

                     {/* Edit Modal */}
          {showDetailsModal && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Edit Photo</h3>
                  <CloseButton
                    onClick={() => setShowDetailsModal(false)}
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Alt Text</label>
                    <Input
                      value={photo.alt_text || ''}
                      onChange={(e) => {
                        setPhoto(prev => prev ? { ...prev, alt_text: e.target.value } : null)
                      }}
                      placeholder="Describe this photo"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <Textarea
                      value={photo.description || ''}
                      onChange={(e) => {
                        setPhoto(prev => prev ? { ...prev, description: e.target.value } : null)
                      }}
                      placeholder="Add a description"
                      className="h-20"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={photo.is_featured || false}
                      onChange={(e) => {
                        setPhoto(prev => prev ? { ...prev, is_featured: e.target.checked } : null)
                      }}
                    />
                    <label htmlFor="featured" className="text-sm font-medium">
                      Featured Photo
                    </label>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowDetailsModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!photo) return
                        
                        try {
                          // Update photo metadata
                          await supabase
                            .from('images')
                            .update({
                              alt_text: photo.alt_text,
                              description: photo.description
                            })
                            .eq('id', photo.id)
                          
                          // Update album image settings if needed
                          if (albumId) {
                            await supabase
                              .from('album_images')
                              .update({
                                is_featured: photo.is_featured
                              })
                              .eq('album_id', albumId)
                              .eq('image_id', photo.id)
                          }
                          
                          setShowDetailsModal(false)
                          toast({
                            title: 'Photo updated',
                            description: 'Photo details have been saved'
                          })
                        } catch (error) {
                          console.error('Error updating photo:', error)
                          toast({
                            title: 'Error',
                            description: 'Failed to update photo',
                            variant: 'destructive'
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
             <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
               <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="font-semibold text-lg">Share Photo</h3>
                   <CloseButton
                     onClick={() => setShowShareModal(false)}
                   />
                 </div>
                 
                 <div className="space-y-4">
                   <div>
                     <h4 className="font-semibold mb-2">Share on Social Media</h4>
                     <div className="grid grid-cols-2 gap-2">
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
                   
                   <div>
                     <h4 className="font-semibold mb-2">Direct Link</h4>
                     <div className="flex gap-2">
                       <Input
                         value={`${window.location.origin}/photos/${photo.id}`}
                         readOnly
                         className="flex-1"
                       />
                       <Button
                         variant="outline"
                         size="icon"
                         onClick={() => handleShare('copy')}
                       >
                         <Copy className="h-4 w-4" />
                       </Button>
                     </div>
                   </div>
                   
                   <div>
                     <h4 className="font-semibold mb-2">Embed Code</h4>
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
        </div>
      </DialogContent>
    </Dialog>
  )
} 