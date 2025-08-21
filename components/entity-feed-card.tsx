'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Eye,
  ThumbsUp,
  Smile,
  Star,
  AlertTriangle,
  Clock,
  Globe,
  Lock,
  Users,
  EyeOff,
  Flag,
  Edit,
  Trash2,
  Link,
  Hash,
  Calendar,
  MapPin,
  User,
  Building,
  Users2,
  CalendarDays,
  MessageSquare,
  Star as StarIcon,
  Hash as HashIcon,
  BookOpen,
  Video,
  Image as ImageIcon,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Shield,
  CheckCircle,
  TrendingUp,
  Zap,
  Activity,
  Save,
  X
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { BookCover } from '@/components/book-cover'
import { EntityHoverCard } from '@/components/entity-hover-cards'
import { EngagementActions } from '@/components/enterprise/engagement-actions'
import { SophisticatedPhotoGrid } from '@/components/photo-gallery/sophisticated-photo-grid'
import { EnterprisePhotoViewer } from '@/components/photo-gallery/enterprise-photo-viewer'
import { FeedPost, PostContent, PostVisibility, PostPublishStatus, getPostText, getPostImages, getPostContentType, hasImageContent, hasTextContent } from '@/types/feed'
import { useAuth } from '@/hooks/useAuth'

export interface EntityFeedCardProps {
  post: FeedPost
  entityDetails?: any
  userDetails?: any
  showActions?: boolean
  showComments?: boolean
  showEngagement?: boolean
  className?: string
  onPostUpdated?: (post: FeedPost) => void
  onPostDeleted?: (postId: string) => void
}

// Legacy PostContent interface for backward compatibility
export interface LegacyPostContent {
  text?: string
  media_files?: string[]
  hashtags?: string[]
  links?: Array<{
    url: string
    title?: string
    description?: string
    image_url?: string
  }>
  book_details?: {
    book_id?: string
    rating?: number
    review?: string
    reading_status?: string
  }
  poll_question?: string
  poll_options?: string[]
  poll_results?: Record<string, number>
  content_safety_score?: number
  sentiment_analysis?: string
}

export default function EntityFeedCard({
  post,
  entityDetails,
  userDetails,
  showActions = true,
  showComments = true,
  showEngagement = true,
  className,
  onPostUpdated,
  onPostDeleted
}: EntityFeedCardProps) {
  // Safety check for post object
  if (!post) {
    console.warn('EntityFeedCard: post prop is undefined')
    return null
  }

  const { toast } = useToast()
  const { user } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFullContent, setShowFullContent] = useState(false)
  const [engagementData, setEngagementData] = useState<any>({
    reactions: [],
    comments: [],
    shares: [],
    bookmarks: []
  })
  const [isLoadingEngagement, setIsLoadingEngagement] = useState(false)
  
  // Inline editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editImages, setEditImages] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  
  // Image modal state
  const [selectedImage, setSelectedImage] = useState<{url: string, index: number} | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Check if current user can edit this post
  const canEdit = user && post.user_id === user.id && !(post as any).is_deleted
  const canDelete = user && post.user_id === user.id && !(post as any).is_deleted
  
  // Debug logging
  console.log('Debug - User:', user)
  console.log('Debug - Post user_id:', post.user_id)
  console.log('Debug - Can edit:', canEdit)
  console.log('Debug - Can delete:', canDelete)

  // Initialize edit content when component mounts
  useEffect(() => {
    setEditContent(getPostText(post))
    setEditImages(getPostImages(post))
  }, [post])

  // Content type configurations
  const contentTypeConfigs = {
    text: {
      icon: MessageSquare,
      label: 'Text Post',
      color: 'bg-blue-100 text-blue-800'
    },
    photo: {
      icon: ImageIcon,
      label: 'Photo Post',
      color: 'bg-green-100 text-green-800'
    },
    video: {
      icon: Video,
      label: 'Video Post',
      color: 'bg-purple-100 text-purple-800'
    },
    link: {
      icon: ExternalLink,
      label: 'Link Post',
      color: 'bg-orange-100 text-orange-800'
    },
    poll: {
      icon: HashIcon,
      label: 'Poll Post',
      color: 'bg-pink-100 text-pink-800'
    },
    review: {
      icon: StarIcon,
      label: 'Review Post',
      color: 'bg-yellow-100 text-yellow-800'
    },
    article: {
      icon: BookOpen,
      label: 'Article Post',
      color: 'bg-indigo-100 text-indigo-800'
    }
  }

  // Entity type configurations
  const entityTypeConfigs = {
    user: { icon: User, label: 'User Post', color: 'bg-blue-100 text-blue-800' },
    book: { icon: BookOpen, label: 'Book Post', color: 'bg-green-100 text-green-800' },
    author: { icon: Building, label: 'Author Post', color: 'bg-purple-100 text-purple-800' },
    publisher: { icon: Building, label: 'Publisher Post', color: 'bg-orange-100 text-orange-800' },
    group: { icon: Users2, label: 'Group Post', color: 'bg-indigo-100 text-indigo-800' }
  }

  // Visibility configurations
  const visibilityConfigs = {
    public: { icon: Globe, label: 'Public', color: 'text-green-600' },
    private: { icon: Lock, label: 'Private', color: 'text-red-600' },
    friends: { icon: Users, label: 'Friends', color: 'text-blue-600' },
    followers: { icon: Users2, label: 'Followers', color: 'text-purple-600' },
    custom: { icon: Eye, label: 'Custom', color: 'text-orange-600' }
  }

  // Content safety configurations
  const safetyConfigs = {
    high: { icon: Shield, label: 'Safe', color: 'text-green-600', bgColor: 'bg-green-50' },
    medium: { icon: AlertTriangle, label: 'Caution', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    low: { icon: Flag, label: 'Flagged', color: 'text-red-600', bgColor: 'bg-red-50' }
  }

  // Get content safety level
  const getContentSafetyLevel = (score: number) => {
    if (score >= 0.8) return 'high'
    if (score >= 0.6) return 'medium'
    return 'low'
  }

  // Helper functions to extract content from current data structure
  const getPostText = (post: any): string => {
    // Debug: Log the actual post structure directly
    console.log('=== POST DATA DEBUG ===')
    console.log('Post ID:', post.id)
    console.log('Post type:', typeof post)
    console.log('Post keys:', Object.keys(post))
    console.log('Post.data:', post.data)
    console.log('Post.data type:', typeof post.data)
    if (post.data) {
      console.log('Post.data keys:', Object.keys(post.data))
      console.log('Post.data.content:', post.data.content)
      if (post.data.content) {
        console.log('Post.data.content keys:', Object.keys(post.data.content))
      }
    }
    console.log('Post.content:', post.content)
    if (post.content) {
      console.log('Post.content keys:', Object.keys(post.content))
      console.log('Post.content.text:', post.content.text)
      console.log('Post.content.content:', post.content.content)
      console.log('Post.content.body:', post.content.body)
    }
    console.log('Post.text:', post.text)
    console.log('========================')
    
    // Try to get text from various possible locations
    if (post.text) return post.text
    if (post.content?.text) return post.content.text
    if (post.content?.content) return post.content.content
    if (post.content?.body) return post.content.body
    if (post.data?.text) return post.data.text
    if (post.data?.content?.text) return post.data.content.text
    if (post.data?.content?.content) return post.data.content.content
    if (post.data?.content?.body) return post.data.content.body
    if (post.data?.body) return post.data.body
    if (post.data?.message) return post.data.message
    if (post.data?.description) return post.data.description
    
    // Try deeper nesting
    if (post.data?.data?.text) return post.data.data.text
    if (post.data?.data?.content) return post.data.data.content
    if (post.data?.data?.body) return post.data.data.body
    
    console.log('getPostText - No text found, returning default')
    return 'Post content'
  }

  const getPostImages = (post: any): string[] => {
    // Debug: Log the actual post structure for images
    console.log('getPostImages - Post image structure:', {
      hasImageUrl: !!post.image_url,
      hasContent: !!post.content,
      hasData: !!post.data,
      contentKeys: post.content ? Object.keys(post.content) : [],
      dataKeys: post.data ? Object.keys(post.data) : [],
      contentImageUrl: post.content?.image_url,
      contentImages: post.content?.images,
      dataImageUrl: post.data?.image_url,
      dataImages: post.data?.images
    })
    
    // Try to get images from various possible locations
    if (post.image_url) {
      return post.image_url.split(',').map((url: string) => url.trim()).filter(Boolean)
    }
    if (post.content?.image_url) {
      return post.content.image_url.split(',').map((url: string) => url.trim()).filter(Boolean)
    }
    if (post.content?.images) {
      return Array.isArray(post.content.images) ? post.content.images : [post.content.images]
    }
    if (post.data?.image_url) {
      return post.data.image_url.split(',').map((url: string) => url.trim()).filter(Boolean)
    }
    if (post.data?.images) {
      return Array.isArray(post.data.images) ? post.data.images : [post.data.images]
    }
    if (post.data?.media_url) {
      return post.data.media_url.split(',').map((url: string) => url.trim()).filter(Boolean)
    }
    if (post.data?.content?.image_url) {
      return post.data.content.image_url.split(',').map((url: string) => url.trim()).filter(Boolean)
    }
    if (post.data?.content?.images) {
      return Array.isArray(post.data.content.images) ? post.data.content.images : [post.data.content.images]
    }
    
    // Try deeper nesting
    if (post.data?.data?.image_url) {
      return post.data.data.image_url.split(',').map((url: string) => url.trim()).filter(Boolean)
    }
    if (post.data?.data?.images) {
      return Array.isArray(post.data.data.images) ? post.data.data.images : [post.data.data.images]
    }
    
    console.log('getPostImages - No images found, returning empty array')
    return []
  }

  const getPostContentType = (post: any): string => {
    // Debug: Log the actual post structure for content type
    console.log('getPostContentType - Post content type structure:', {
      hasContentType: !!post.content_type,
      hasContent: !!post.content,
      hasData: !!post.data,
      contentKeys: post.content ? Object.keys(post.content) : [],
      dataKeys: post.data ? Object.keys(post.data) : [],
      contentType: post.content?.type,
      dataType: post.data?.type,
      dataContentType: post.data?.content_type
    })
    
    // Try to get content type from various possible locations
    if (post.content_type) return post.content_type
    if (post.content?.type) return post.content.type
    if (post.data?.content_type) return post.data.content_type
    if (post.data?.type) return post.data.type
    if (post.data?.content?.type) return post.data.content.type
    
    // Try deeper nesting
    if (post.data?.data?.type) return post.data.data.type
    if (post.data?.data?.content_type) return post.data.data.content_type
    
    // Infer from content
    const images = getPostImages(post)
    if (images.length > 0) return 'image'
    if (post.content?.link_url || post.data?.link_url || post.data?.url) return 'link'
    
    console.log('getPostContentType - No content type found, defaulting to text')
    return 'text'
  }

  const hasImageContent = (post: any): boolean => {
    return getPostImages(post).length > 0
  }

  const hasTextContent = (post: any): boolean => {
    const text = getPostText(post)
    return typeof text === 'string' && text !== 'Post content' && text.trim().length > 0
  }

  // Get display values using helper functions
  const displayText = getPostText(post)
  const displayImageUrl = getPostImages(post).join(',')
  const displayContentType = getPostContentType(post)

  // Handle image click for modal
  const handleImageClick = (url: string, index: number) => {
    console.log('Image clicked:', { url, index, postId: post.id });
    setSelectedImage({ url, index });
    setCurrentImageIndex(index); // Set current index for EnterprisePhotoViewer
    setShowImageModal(true);
  };

  // Close image modal
  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
    setCurrentImageIndex(0); // Reset current index
  };

  // Handle inline editing
  const handleEditToggle = () => {
    console.log('Edit button clicked!')
    if (isEditing) {
      // Cancel editing - reset content and images
      setEditContent(displayText)
      setEditImages(getPostImages(post))
    }
    setIsEditing(!isEditing)
    setShowActionsMenu(false)
  }

  // Handle image upload
  const handleImageUpload = async (files: FileList) => {
    const newImages: string[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith('image/')) {
        // Convert to data URL for preview (in real app, upload to cloud storage)
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            newImages.push(e.target.result as string)
            setEditImages(prev => [...prev, ...newImages])
          }
        }
        reader.readAsDataURL(file)
      }
    }
  }

  // Handle image removal
  const handleRemoveImage = (index: number) => {
    setEditImages(prev => prev.filter((_, i) => i !== index))
  }

  // Handle drag and drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== dropIndex) {
      const newImages = [...editImages]
      const [draggedImage] = newImages.splice(dragIndex, 1)
      newImages.splice(dropIndex, 0, draggedImage)
      setEditImages(newImages)
    }
    setDragIndex(null)
    setDragOverIndex(null)
  }

  // Handle save edit with images
  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast({
        title: "Error",
        description: "Post content cannot be empty",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    try {
      console.log('=== DEBUG POST UPDATE ===')
      console.log('Post object:', post)
      console.log('Post ID:', post.id)
      console.log('Post ID type:', typeof post.id)
      console.log('Post user_id:', post.user_id)
      console.log('Current user:', user)
      console.log('Update data:', {
        content: { ...post.content, text: editContent.trim() },
        image_url: editImages.join(',')
      })
      console.log('API URL:', `/api/posts/${post.id}`)
      
      // Validate post ID format
      if (!post.id || typeof post.id !== 'string' || post.id.trim() === '') {
        throw new Error('Invalid post ID')
      }
      
      // Check if post ID looks like a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(post.id)) {
        console.warn('Post ID does not look like a valid UUID:', post.id)
      }
      
      console.log('========================')

      const response = await fetch(`/api/activities`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: post.id,
          text: editContent.trim(),
          image_url: editImages.join(',')
        })
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`Failed to update post: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log('Updated activity received:', responseData)
      
      // Extract the activity from the response
      const updatedActivity = responseData.activity || responseData
      
      // Update local state
      if (onPostUpdated) {
        onPostUpdated(updatedActivity)
      }

      // Update local post object with the updated activity data
      Object.assign(post, {
        content: { text: updatedActivity.text },
        image_url: updatedActivity.image_url,
        updated_at: updatedActivity.updated_at
      })

      setIsEditing(false)
      toast({
        title: "Success",
        description: "Post updated successfully",
      })
    } catch (error) {
      console.error('Error updating post:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update post",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete post
  const handleDeletePost = async () => {
    console.log('Delete button clicked!')
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/activities`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id })
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }

      if (onPostDeleted) {
        onPostDeleted(post.id)
      }

      toast({
        title: "Success",
        description: "Post deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting post:', error)
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive"
      })
    }
  }

  // Load engagement data
  const loadEngagementData = useCallback(async () => {
    if (!showEngagement || !post?.id) return

    setIsLoadingEngagement(true)
    try {
      const [reactionsRes, commentsRes, sharesRes, bookmarksRes] = await Promise.all([
        fetch(`/api/posts/engagement?post_id=${post.id}&action_type=reactions`),
        fetch(`/api/posts/engagement?post_id=${post.id}&action_type=comments`),
        fetch(`/api/posts/engagement?post_id=${post.id}&action_type=shares`),
        fetch(`/api/posts/engagement?post_id=${post.id}&action_type=bookmarks`)
      ])

      const reactions = await reactionsRes.json()
      const comments = await commentsRes.json()
      const shares = await sharesRes.json()
      const bookmarks = await bookmarksRes.json()

      setEngagementData({
        reactions: reactions.data || [],
        comments: comments.data || [],
        shares: shares.data || [],
        bookmarks: bookmarks.data || []
      })
    } catch (error) {
      console.error('Error loading engagement data:', error)
    } finally {
      setIsLoadingEngagement(false)
    }
  }, [post?.id, showEngagement])

  useEffect(() => {
    loadEngagementData()
  }, [loadEngagementData])

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      const actionsMenu = document.querySelector('.enterprise-feed-card-actions')
      
      if (showActionsMenu && actionsMenu && !actionsMenu.contains(target)) {
        setShowActionsMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showActionsMenu])

  // Note: PhotoViewerModal handles keyboard navigation (Escape, Arrow keys)

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`
    return `${Math.floor(diffInSeconds / 31536000)}y ago`
  }

  // Render content warnings
  const renderContentWarnings = () => {
    if (!post.metadata?.content_safety_score || post.metadata.content_safety_score >= 0.8) return null

    const safetyLevel = getContentSafetyLevel(post.metadata.content_safety_score)
    const config = safetyConfigs[safetyLevel]

    return (
      <div className={cn("p-3 rounded-lg mb-4 flex items-center gap-2", config.bgColor)}>
        <config.icon className={cn("h-4 w-4", config.color)} />
        <span className={cn("text-sm font-medium", config.color)}>
          {config.label}: This content may contain sensitive material
        </span>
      </div>
    )
  }

  // Render main content
  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="space-y-4">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-[100px] resize-none"
            maxLength={5000}
          />
          
          {/* Image Management Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Images ({editImages.length})</h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImageUpload(!showImageUpload)}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {showImageUpload ? 'Hide Upload' : 'Add Images'}
                </Button>
              </div>
            </div>
            
            {/* Image Upload Area */}
            {showImageUpload && (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors hover:border-blue-400"
                onDragOver={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.add('border-blue-400', 'bg-blue-50')
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50')
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50')
                  const files = e.dataTransfer.files
                  if (files.length > 0) {
                    handleImageUpload(files)
                  }
                }}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload images or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG, GIF up to 10MB each</p>
                </label>
              </div>
            )}
            
            {/* Image Grid with Drag & Drop */}
            {editImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {editImages.map((image, index) => (
                  <div
                    key={index}
                    className={`relative group cursor-move ${
                      dragIndex === index ? 'opacity-50' : ''
                    } ${
                      dragOverIndex === index ? 'ring-2 ring-blue-500' : ''
                    }`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <img
                      src={image}
                      alt={`Image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    
                    {/* Drag Handle */}
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-3 h-1 bg-white rounded-full mb-1"></div>
                      <div className="w-3 h-1 bg-white rounded-full mb-1"></div>
                      <div className="w-3 h-1 bg-white rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {editContent.length}/5000 characters
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditToggle}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={isSaving || !editContent.trim()}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                  ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )
    }
    
    // Debug logging
    console.log('EntityFeedCard renderContent:', { 
      postId: post.id,
      contentType: post.content_type, 
      imageUrl: post.image_url,
      hasContent: !!post.content,
      contentText: post.content?.text,
      fullPost: JSON.stringify(post, null, 2)
    })
    
    // Handle both old and new post structures
    // Old posts: direct text, image_url fields
    // New posts: content object with content_type
    const displayText = getPostText(post)
    const displayImageUrl = getPostImages(post)
    const displayContentType = getPostContentType(post)
    
    if (!hasTextContent(post) && !hasImageContent(post)) {
      console.log('No content available for post:', { 
        postId: post.id,
        hasText: hasTextContent(post),
        hasImage: hasImageContent(post)
      })
      return (
        <div className="enterprise-feed-card-no-content">
          <p className="text-muted-foreground">No content available</p>
        </div>
      )
    }
    
    // Special check for posts that have images but wrong content_type
    if (hasImageContent(post) && displayContentType !== 'image') {
      console.log('Post has image but wrong content_type:', {
        postId: post.id,
        contentType: displayContentType,
        hasImage: true,
        shouldBeImage: true
      })
    }

    const content = post.content as PostContent

    console.log('Content type switch:', { contentType: displayContentType, postId: post.id })
    
    switch (displayContentType) {
      case 'text':
        return (
          <div className="enterprise-feed-card-text-content">
            <div className="enterprise-feed-card-text prose prose-sm max-w-none">
              <div className="enterprise-feed-card-text-preview">
                {displayText ? (
                  <div dangerouslySetInnerHTML={{ __html: displayText }} />
                ) : (
                  <div className="text-muted-foreground">No text content available</div>
                )}
              </div>
            </div>
          </div>
        )

      case 'image':
        console.log('Rendering image content:', { 
          postId: post.id,
          imageUrl: post.image_url,
          hasImageUrl: !!post.image_url,
          fullPost: JSON.stringify(post, null, 2)
        })
        
        // Handle multiple images using the new helper function
        const imageUrls = displayImageUrl
        const isMultiImage = imageUrls.length > 1
        
        // Convert image URLs to photo objects for SophisticatedPhotoGrid
        const photos = imageUrls.map((url: string, index: number) => ({
          id: `post-${post.id}-${index}`,
          url: url,
          thumbnail_url: url,
          alt_text: `Post image ${index + 1}`,
          description: displayText || `Image ${index + 1} from post`,
          created_at: post.created_at || new Date().toISOString(),
          likes: [],
          comments: [],
          shares: [],
          analytics: { views: 0, unique_views: 0, downloads: 0, shares: 0, engagement_rate: 0 },
          is_cover: false,
          is_featured: false
        }))
        
        return (
          <div className="enterprise-feed-card-photo-content">
            {/* Use SophisticatedPhotoGrid for photo display */}
            {photos.length > 0 && (
              <div className="enterprise-feed-card-photo-grid">
                <SophisticatedPhotoGrid
                  photos={photos}
                  onPhotoClick={(photo: any, index: number) => handleImageClick(photo.url, index)}
                  showActions={false}
                  showStats={false}
                  className="w-full"
                  maxHeight="400px"
                />
              </div>
            )}
            
            {/* Fallback to content.media_files for posts table */}
            {!post.image_url && content.media_files && content.media_files.length > 0 && (
              <div className="enterprise-feed-card-photo-grid">
                {content.media_files.map((media: any, index: number) => (
                  <div key={index} className="enterprise-feed-card-photo-item">
                    <img
                      src={media.url}
                      alt={media.filename || 'Photo'}
                      className="enterprise-feed-card-photo w-full h-auto rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}
            
            {displayText && (
              <div className="enterprise-feed-card-photo-caption mt-3">
                <p className="text-sm text-muted-foreground">{displayText}</p>
              </div>
            )}
          </div>
        )

      case 'video':
        return (
          <div className="enterprise-feed-card-video-content">
            {content.media_files && content.media_files.find(m => m.type === 'video') && (
              <video
                src={content.media_files.find(m => m.type === 'video')?.url}
                controls
                className="enterprise-feed-card-video w-full rounded-lg"
              />
            )}
            {content.text && (
              <div className="enterprise-feed-card-video-caption mt-3">
                <p className="text-sm text-muted-foreground">{content.text}</p>
              </div>
            )}
          </div>
        )

      case 'book':
        return (
          <div className="enterprise-feed-card-review-content">
            <div className="enterprise-feed-card-review-header flex items-center gap-3 mb-3">
              {content.book_details?.title && (
                <div className="enterprise-feed-card-book-info">
                  <h4 className="font-semibold text-lg">{content.book_details.title}</h4>
                  {content.book_details.author && (
                    <p className="text-sm text-muted-foreground">by {content.book_details.author}</p>
                  )}
                </div>
              )}
              {content.book_details?.rating && (
                <div className="enterprise-feed-card-rating flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={cn(
                        "h-4 w-4",
                        star <= (content.book_details!.rating || 0) ? "text-yellow-500 fill-current" : "text-gray-300"
                      )}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">
                    ({content.book_details!.rating}/5)
                  </span>
                </div>
              )}
            </div>
            {content.book_details?.review && (
              <div className="enterprise-feed-card-review-text prose prose-sm max-w-none">
                {showFullContent ? (
                  <div dangerouslySetInnerHTML={{ __html: content.book_details.review }} />
                ) : (
                  <div className="enterprise-feed-card-review-preview">
                    {content.book_details.review.length > 300 ? (
                      <>
                        <div dangerouslySetInnerHTML={{ __html: content.book_details.review.substring(0, 300) }} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowFullContent(true)}
                          className="enterprise-feed-card-expand-button mt-2"
                        >
                          Read more
                        </Button>
                      </>
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: content.book_details.review }} />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case 'poll':
        return (
          <div className="enterprise-feed-card-poll-content">
            {content.poll_question && (
              <div className="enterprise-feed-card-poll-question mb-3">
                <h4 className="font-semibold text-lg">{content.poll_question}</h4>
              </div>
            )}
            {content.poll_options && (
              <div className="enterprise-feed-card-poll-options space-y-2">
                {content.poll_options.map((option: string, index: number) => (
                  <div key={index} className="enterprise-feed-card-poll-option">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        // Handle poll vote
                        toast({
                          title: "Vote Cast",
                          description: `You voted for: ${option}`,
                        })
                      }}
                    >
                      <HashIcon className="h-4 w-4 mr-2" />
                      {option}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 'link':
        return (
          <div className="enterprise-feed-card-link-content">
            {content.links && content.links.length > 0 && (
              <div className="enterprise-feed-card-link-preview border rounded-lg p-3">
                {content.links.map((link, index) => (
                  <div key={index} className="flex items-start gap-3 mb-2">
                    <ExternalLink className="h-5 w-5 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      {link.title && (
                        <h4 className="font-semibold text-sm">{link.title}</h4>
                      )}
                      {link.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {link.description}
                        </p>
                      )}
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                      >
                        {link.url}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {content.text && (
              <div className="enterprise-feed-card-link-caption mt-3">
                <p className="text-sm text-muted-foreground">{content.text}</p>
              </div>
            )}
          </div>
        )

              default:
          return (
            <div className="enterprise-feed-card-default-content">
              <p className="text-sm text-muted-foreground">
                {displayText}
              </p>
            </div>
          )
    }
  }

  // Render engagement stats
  const renderEngagementStats = () => {
    if (!showEngagement) return null

    return (
      <div className="enterprise-feed-card-engagement-stats flex items-center gap-4 text-sm text-muted-foreground">
        {(post.view_count || 0) > 0 && (
          <span className="enterprise-feed-card-views flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {post.view_count} views
          </span>
        )}
        {post.like_count > 0 && (
          <span className="enterprise-feed-card-likes flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {post.like_count} likes
          </span>
        )}
        {post.comment_count > 0 && (
          <span className="enterprise-feed-card-comments flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {post.comment_count} comments
          </span>
        )}
        {(post.share_count || 0) > 0 && (
          <span className="enterprise-feed-card-shares flex items-center gap-1">
            <Share2 className="h-4 w-4" />
            {post.share_count} shares
          </span>
        )}

      </div>
    )
  }



  // Render tags
  const renderTags = () => {
    if (!post.tags || post.tags.length === 0) return null

    return (
      <div className="enterprise-feed-card-tags flex flex-wrap gap-1 mt-3">
        {post.tags.map((tag: string) => (
          <Badge key={tag} variant="secondary" className="enterprise-feed-card-tag">
            #{tag}
          </Badge>
        ))}
      </div>
    )
  }



  const currentContentConfig = contentTypeConfigs[getPostContentType(post) as keyof typeof contentTypeConfigs]
  const currentEntityConfig = entityTypeConfigs[post.entity_type as keyof typeof entityTypeConfigs]
  const currentVisibilityConfig = visibilityConfigs[post.visibility as keyof typeof visibilityConfigs]
  const contentSafetyLevel = getContentSafetyLevel(post.metadata?.content_safety_score || 1)
  const currentSafetyConfig = safetyConfigs[contentSafetyLevel]

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm enterprise-feed-card enterprise-timeline-feed-card">
      <div className="flex flex-col space-y-1.5 p-6 enterprise-feed-card-header pb-3">
        <div className="enterprise-feed-card-header-content flex items-start gap-3">
          {/* User Avatar */}
          <EntityHoverCard
            type="user"
            entity={{
              id: post.user_id,
              name: userDetails?.name || 'User',
              avatar_url: userDetails?.avatar_url
            }}
          >
            <span className="hover:underline cursor-pointer text-muted-foreground" data-state="closed">
              <div className="avatar-container relative w-10 h-10 overflow-hidden rounded-full border-2 border-white shadow-md enterprise-feed-card-user-avatar cursor-pointer">
                <Avatar
                  src={userDetails?.avatar_url}
                  alt={userDetails?.name || 'User'}
                  name={userDetails?.name}
                  size="sm"
                  className="object-cover rounded-full"
                />
              </div>
            </span>
          </EntityHoverCard>

          {/* Post Header Info */}
          <div className="enterprise-feed-card-header-info flex-1">
            <div className="enterprise-feed-card-header-top flex items-center gap-2 mb-1">
              <EntityHoverCard
                type="user"
                entity={{
                  id: post.user_id,
                  name: userDetails?.name || 'User',
                  avatar_url: userDetails?.avatar_url
                }}
              >
                <span className="hover:underline cursor-pointer text-muted-foreground" data-state="closed">
                  <span className="enterprise-feed-card-user-name font-semibold text-sm hover:underline cursor-pointer">
                    {userDetails?.name || 'User'}
                  </span>
                </span>
              </EntityHoverCard>

              {/* Content Type Badge */}
              {currentContentConfig && (
                <Badge variant="secondary" className="enterprise-feed-card-content-type">
                  <currentContentConfig.icon className="h-3 w-3 mr-1" />
                  {currentContentConfig.label}
                </Badge>
              )}

              {/* Entity Type Badge */}
              {currentEntityConfig && (
                <Badge variant="outline" className="enterprise-feed-card-entity-type">
                  <currentEntityConfig.icon className="h-3 w-3 mr-1" />
                  {currentEntityConfig.label}
                </Badge>
              )}

              {/* Content Safety Badge */}
              {post.content_safety_score && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "enterprise-feed-card-safety",
                    currentSafetyConfig.bgColor,
                    currentSafetyConfig.color
                  )}
                >
                  <currentSafetyConfig.icon className="h-3 w-3 mr-1" />
                  {currentSafetyConfig.label}
                </Badge>
              )}

              {/* Visibility Badge */}
              {currentVisibilityConfig && (
                <Badge variant="secondary" className="enterprise-feed-card-visibility">
                  <currentVisibilityConfig.icon className="h-3 w-3 mr-1" />
                  {currentVisibilityConfig.label}
                </Badge>
              )}

              {/* Age Restriction */}
              {post.age_restriction && (
                <Badge variant="destructive" className="enterprise-feed-card-age-restriction">
                  {post.age_restriction}
                </Badge>
              )}

              {/* Sensitive Content */}
              {post.sensitive_content && (
                <Badge variant="destructive" className="enterprise-feed-card-sensitive-content">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Sensitive
                </Badge>
              )}
            </div>

            <div className="enterprise-feed-card-header-bottom flex items-center gap-2 text-xs text-muted-foreground">
              <span className="enterprise-feed-card-timestamp">
                {formatTimestamp(post.created_at)}
              </span>

              {/* Scheduled Post */}
              {post.scheduled_at && (
                <span className="enterprise-feed-card-scheduled flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Scheduled for {formatTimestamp(post.scheduled_at)}
                </span>
              )}

              {/* Featured Post */}
              {post.is_featured && (
                <span className="enterprise-feed-card-featured flex items-center gap-1 text-yellow-600">
                  <StarIcon className="h-3 w-3" />
                  Featured
                </span>
              )}

              {/* Pinned Post */}
              {post.is_pinned && (
                <span className="enterprise-feed-card-pinned flex items-center gap-1 text-blue-600">
                  <Bookmark className="h-3 w-3" />
                  Pinned
                </span>
              )}

              {/* Verified Post */}
              {post.is_verified && (
                <span className="enterprise-feed-card-verified flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </span>
              )}

              {/* Engagement Score */}
              {post.engagement_score && (
                <span className="enterprise-feed-card-engagement flex items-center gap-1 text-purple-600">
                  <TrendingUp className="h-3 w-3" />
                  {(post.engagement_score * 100).toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          {/* Post Actions Menu */}
          <div className="enterprise-feed-card-actions relative">
            <Button 
              variant={showActionsMenu ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                console.log('Actions menu button clicked!')
                setShowActionsMenu(!showActionsMenu)
              }}
              className={showActionsMenu ? "bg-gray-100" : ""}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            
            {/* Actions Dropdown */}
            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border rounded-lg shadow-lg z-50">
                {canEdit && (
                  <button
                    onClick={handleEditToggle}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Post
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDeletePost}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Post
                  </button>
                )}
                <button
                  onClick={() => setShowActionsMenu(false)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 pt-0 enterprise-feed-card-content">
        {/* Content Warnings */}
        {renderContentWarnings()}

        {/* Main Content */}
        <div className="enterprise-feed-card-main-content">
          {renderContent()}
        </div>

        {/* Tags */}
        {renderTags()}

        {/* Engagement Stats */}
        {renderEngagementStats()}

        {/* Engagement Actions */}
        {showActions && (
          <div className="enterprise-feed-card-engagement-actions mt-4">
            <EngagementActions
              entityId={post.id}
              entityType={post.entity_type as 'user' | 'book' | 'author' | 'publisher' | 'group'}
              initialEngagementCount={post.like_count + post.comment_count + (post.share_count || 0)}
              isLiked={post.user_has_reacted}
              isCommented={false}
              isShared={false}
              onEngagement={async (action, entityId, entityType) => {
                // Handle engagement
                console.log('Engagement action:', action, entityId, entityType)
                // Update local state if needed
                if (onPostUpdated) {
                  const updatedPost = { ...post }
                  onPostUpdated(updatedPost)
                }
              }}
            />
          </div>
        )}

        {/* Comments Section */}
        {showComments && engagementData.comments.length > 0 && (
          <div className="enterprise-feed-card-comments mt-4">
            <Separator className="mb-3" />
            <div className="enterprise-feed-card-comments-header">
              <h4 className="text-sm font-semibold mb-2">Comments ({engagementData.comments.length})</h4>
            </div>
            <div className="enterprise-feed-card-comments-list space-y-3">
              {engagementData.comments.slice(0, 3).map((comment: any) => (
                <div key={comment.id} className="enterprise-feed-card-comment flex gap-3">
                  <Avatar
                    src={comment.user?.avatar_url}
                    alt={comment.user?.name || 'User'}
                    name={comment.user?.name}
                    size="sm"
                    className="enterprise-feed-card-comment-avatar"
                  />
                  <div className="enterprise-feed-card-comment-content flex-1">
                    <div className="enterprise-feed-card-comment-header flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{comment.user?.name || 'User'}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
              {engagementData.comments.length > 3 && (
                <Button variant="ghost" size="sm" className="w-full">
                  View all {engagementData.comments.length} comments
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <EnterprisePhotoViewer
          isOpen={showImageModal}
          onClose={closeImageModal}
          photos={(post.image_url ? post.image_url.split(',').map((url: string, index: number) => ({
            id: `post-${post.id}-${index}`,
            url: url,
            thumbnail_url: url,
            alt_text: `Post image ${index + 1}`,
            description: post.content?.text || `Image ${index + 1} from post`,
            created_at: post.created_at || new Date().toISOString(),
            metadata: {
              source: 'timeline_post',
              post_id: post.id,
              user_id: post.user_id,
              user_name: post.user_name
            },
            tags: [],
            likes: [],
            comments: [],
            shares: [],
            analytics: { views: 0, unique_views: 0, downloads: 0, shares: 0, engagement_rate: 0 },
            is_featured: false,
            user: {
              name: post.user_name || 'User',
              avatar_url: post.user_avatar_url
            }
          })) : [])}
          currentIndex={currentImageIndex}
          onIndexChange={setCurrentImageIndex}
          entityId={post.user_id || post.entity_id || 'unknown'}
          entityType={post.entity_type || 'user'}
          isOwner={false}
        />
      )}
    </div>
  )
}