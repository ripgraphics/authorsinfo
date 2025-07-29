'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
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
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isTagging, setIsTagging] = useState(false)
  const [tagPosition, setTagPosition] = useState<{ x: number; y: number } | null>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEntityType, setSelectedEntityType] = useState<'user' | 'book' | 'publisher' | 'author'>('user')
  const [activeTab, setActiveTab] = useState('comments')
  
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Load photo data when index changes
  useEffect(() => {
    if (photos[currentIndex]) {
      loadPhotoData(photos[currentIndex].id)
    }
  }, [currentIndex, photos])

  const loadPhotoData = async (photoId: string) => {
    try {
      // Load photo with tags, likes, comments
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

      // Use the existing counters from the images table
      const photoWithData = {
        ...photoData,
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

  const handleComment = async () => {
    if (!photo || !newComment.trim()) return
    
    try {
      await supabase
        .from('photo_comments')
        .insert({
          photo_id: photo.id,
          // user_id: currentUserId, // TODO: Add current user
          content: newComment.trim(),
          parent_id: replyingTo,
          created_at: new Date().toISOString()
        })
      
      setNewComment('')
      setReplyingTo(null)
      await loadPhotoData(photo.id)
      await trackAnalytics(photo.id, 'comment')
    } catch (error) {
      console.error('Error posting comment:', error)
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
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/50 hover:bg-black/70 text-white"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Main Image */}
            <div 
              className={`relative max-w-full max-h-full ${isTagging ? 'cursor-crosshair' : 'cursor-pointer'}`}
              onClick={handleImageClick}
              title={isTagging ? 'Click to add tag' : currentIndex < photos.length - 1 ? 'Click to go to next image' : 'Last image'}
            >
              <img
                src={photo.url}
                alt={photo.alt_text || 'Photo'}
                className="max-w-full max-h-full object-contain"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.3s ease'
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

          {/* Sidebar */}
          <div className="w-80 bg-background border-l flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="comments">Comments</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="share">Share</TabsTrigger>
              </TabsList>
              
              <TabsContent value="comments" className="flex-1 flex flex-col p-4">
                <ScrollArea className="flex-1 mb-4">
                  <div className="space-y-4">
                    {photo.comments?.map((comment) => (
                      <div key={comment.id} className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Avatar className="h-8 w-8">
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-muted rounded-lg p-3">
                              <div className="font-semibold text-sm">User</div>
                              <p className="text-sm">{comment.content}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs"
                                onClick={() => setReplyingTo(comment.id)}
                              >
                                Reply
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {comment.replies?.map((reply) => (
                          <div key={reply.id} className="ml-10 flex items-start gap-2">
                            <Avatar className="h-6 w-6">
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-muted rounded-lg p-2">
                                <div className="font-semibold text-xs">User</div>
                                <p className="text-xs">{reply.content}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="space-y-2">
                  {replyingTo && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Replying to comment</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => setReplyingTo(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 min-h-[80px]"
                    />
                    <Button
                      size="sm"
                      onClick={handleComment}
                      disabled={!newComment.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="flex-1 p-4">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {photo.description && (
                      <div>
                        <h4 className="font-semibold mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground">{photo.description}</p>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-semibold mb-2">Analytics</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Views: {photo.analytics?.views || 0}</div>
                        <div>Likes: {photo.likes?.length || 0}</div>
                        <div>Comments: {photo.comments?.length || 0}</div>
                        <div>Shares: {photo.analytics?.shares || 0}</div>
                      </div>
                    </div>
                    
                    {photo.tags && photo.tags.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-1">
                          {photo.tags.map((tag) => (
                            <Badge key={tag.id} variant="secondary" className="text-xs">
                              {tag.entity_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-semibold mb-2">Upload Info</h4>
                      <div className="text-sm text-muted-foreground">
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
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="share" className="flex-1 p-4">
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
              </TabsContent>
            </Tabs>
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
        </div>
      </DialogContent>
    </Dialog>
  )
} 