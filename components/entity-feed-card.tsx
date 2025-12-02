'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
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
import EntityName from '@/components/entity-name'
import EntityAvatar from '@/components/entity-avatar'
import { EnterpriseEngagementActions } from '@/components/enterprise/enterprise-engagement-actions'
import { ReactionType } from '@/contexts/engagement-context'
import { NestedCommentThread } from '@/components/enterprise/nested-comment-thread'
import { SophisticatedPhotoGrid } from '@/components/photo-gallery/sophisticated-photo-grid'
import { EnterprisePhotoViewer } from '@/components/photo-gallery/enterprise-photo-viewer'
import { FeedPost, PostContent, PostVisibility, PostPublishStatus, getPostText, getPostImages, getPostContentType, hasImageContent, hasTextContent } from '@/types/feed'
import { useAuth } from '@/hooks/useAuth'
import { deduplicatedRequest } from '@/lib/request-utils'
import { ReactionsModal } from '@/components/enterprise/reactions-modal'
import { CommentsModal } from '@/components/enterprise/comments-modal'
import { EngagementDisplay } from '@/components/enterprise/engagement-display'
import EntityCommentComposer from '@/components/entity-comment-composer'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu'

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

  // Debug: Log the complete post structure when component mounts
  console.log('🔍 EntityFeedCard received post:', {
    id: post.id,
    user_id: post.user_id,
    activity_type: post.activity_type,
    entity_type: post.entity_type,
    content_type: post.content_type,
    hasContent: !!(post.text || post.data),
    hasData: !!(post as any).data,
    allKeys: Object.keys(post),
    fullPost: post
  })

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
  
      // Add state for comments and likes
    const [comments, setComments] = useState<any[]>([])
    const [likes, setLikes] = useState<any[]>([])
    const [isLoadingComments, setIsLoadingComments] = useState(false)
    const [isLoadingLikes, setIsLoadingLikes] = useState(false)
    const [showLikesModal, setShowLikesModal] = useState(false)
    const [showCommentsModal, setShowCommentsModal] = useState(false)
    const [commentFilter, setCommentFilter] = useState<'relevant' | 'all'>('relevant')
    const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({})
    const [canCommentModal, setCanCommentModal] = useState<boolean>(false)
  
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

  // Bottom composer state
  const [bottomComment, setBottomComment] = useState('')
  const [isBottomComposerActive, setIsBottomComposerActive] = useState(false)
  const [composerFocusTick, setComposerFocusTick] = useState(0)
  const bottomComposerRef = useRef<HTMLTextAreaElement>(null)
  const MAX_COMMENT_CHARS = 25000
  const MAX_COMPOSER_LINES = 9

  // Display helpers for names/avatars
  const postOwnerName = userDetails?.name || post.user_name || 'User'
  const postOwnerAvatar = userDetails?.avatar_url || post.user_avatar_url
  // Use hooks for current user data
  const currentUserDisplayName = (user as any)?.name || (user as any)?.user_metadata?.full_name || (user as any)?.email || 'You'
  const currentUserAvatar = (user as any)?.avatar_url || undefined

  // Single-comment preview helpers
  const firstCommentTextRef = useRef<HTMLDivElement>(null)
  const [isFirstCommentClamped, setIsFirstCommentClamped] = useState(false)

  const formatTimeAgo = useCallback((timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }, [])

  const focusBottomComposer = useCallback(() => {
    setIsBottomComposerActive(true)
    setComposerFocusTick((t) => t + 1)
    setTimeout(() => bottomComposerRef.current?.focus(), 0)
  }, [])

  const resizeBottomComposer = useCallback(() => {
    const el = bottomComposerRef.current
    if (!el) return
    el.style.height = 'auto'
    // Compute max height based on line height
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight || '20') || 20
    const maxHeight = lineHeight * MAX_COMPOSER_LINES
    const newHeight = Math.min(el.scrollHeight, Math.ceil(maxHeight))
    el.style.height = `${newHeight}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [])

  // submitBottomComment is declared after fetchComments to avoid TDZ issues

  // Function to fetch comments for this post
  const fetchComments = useCallback(async () => {
    try {
      setIsLoadingComments(true)
      console.log('🔍 FeedCard: Fetching comments for post:', post.id)
      
      const response = await fetch(`/api/engagement?entity_id=${post.id}&entity_type=${post.entity_type || 'activity'}`, {
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 FeedCard: Comments API response:', data)
        
        if (data.recent_comments && Array.isArray(data.recent_comments)) {
          console.log('🔍 FeedCard: Setting comments:', data.recent_comments)
          setComments(data.recent_comments)
        } else {
          console.log('🔍 FeedCard: No comments found, setting empty array')
          setComments([])
        }
      } else {
        console.error('🔍 FeedCard: Comments API response not ok:', response.status)
        setComments([])
      }
    } catch (error) {
      console.error('🔍 FeedCard: Error fetching comments:', error)
      if (error instanceof Error && error.name === 'TimeoutError') {
        console.error('🔍 FeedCard: Request timed out')
        toast({
          title: 'Timeout',
          description: 'Loading comments took too long. Please try again.',
          variant: 'destructive'
        })
      }
      setComments([])
    } finally {
      setIsLoadingComments(false)
    }
  }, [post.id, post.entity_type, toast])

  const submitBottomComment = useCallback(async () => {
    const text = bottomComment.trim()
    if (!text) return
    if (text.length > MAX_COMMENT_CHARS) return
    try {
      const resp = await fetch('/api/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_id: post.id,
          entity_type: post.entity_type || 'activity',
          engagement_type: 'comment',
          content: text
        }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      setBottomComment('')
      setIsBottomComposerActive(false)
      if (onPostUpdated) {
        const updatedPost = { ...post, comment_count: (post.comment_count || 0) + 1 }
        onPostUpdated(updatedPost)
      }
      // Add a small delay to ensure the database transaction is committed
      await new Promise(resolve => setTimeout(resolve, 500))
      fetchComments()
    } catch (e) {
      console.error('Failed to submit comment', e)
      if (e instanceof Error && e.name === 'TimeoutError') {
        toast({
          title: 'Timeout',
          description: 'The request took too long. Please try again.',
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to post comment. Please try again.',
          variant: 'destructive'
        })
      }
    }
  }, [bottomComment, post.id, post.entity_type, onPostUpdated, fetchComments, toast])

  useEffect(() => {
    if (isBottomComposerActive) {
      resizeBottomComposer()
    }
  }, [bottomComment, isBottomComposerActive, resizeBottomComposer])

  // Fetch likes for the post
  const fetchLikes = useCallback(async () => {
    if (!post.like_count || post.like_count === 0) {
      setLikes([])
      return
    }

    try {
      setIsLoadingLikes(true)
      console.log('🔍 FeedCard: Fetching likes for post:', post.id)
      
      const response = await fetch(`/api/engagement?entity_id=${post.id}&entity_type=${post.entity_type || 'activity'}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 FeedCard: Likes API response:', data)
        
        if (data.recent_likes && Array.isArray(data.recent_likes)) {
          console.log('🔍 FeedCard: Setting likes:', data.recent_likes)
          setLikes(data.recent_likes)
        } else {
          console.log('🔍 FeedCard: No likes found, setting empty array')
          setLikes([])
        }
      } else {
        console.error('🔍 FeedCard: Likes API response not ok:', response.status)
        setLikes([])
      }
    } catch (error) {
      console.error('🔍 FeedCard: Error fetching likes:', error)
      setLikes([])
    } finally {
      setIsLoadingLikes(false)
    }
  }, [post.id, post.entity_type, post.like_count])

  // Check if current user can edit this post
  const canEdit = user && post.user_id === user.id && !(post as any).is_deleted
  const canDelete = user && post.user_id === user.id && !(post as any).is_deleted
  
  // Fetch comments when component mounts
  useEffect(() => {
    if (showComments && post.comment_count > 0) {
      fetchComments()
    }
  }, [showComments, post.comment_count, fetchComments])

  // Fetch likes when component mounts
  useEffect(() => {
    if (post.like_count > 0) {
      fetchLikes()
    }
  }, [post.like_count, fetchLikes])
  
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

  // Debug post data changes
  useEffect(() => {
    if (post) {
      console.log('🔍 Post data updated in EntityFeedCard:', {
        postId: post.id,
        like_count: post.like_count,
        comment_count: post.comment_count,
        share_count: post.share_count,
        user_has_reacted: post.user_has_reacted,
        calculatedEngagement: (post.like_count || 0) + (post.comment_count || 0) + (post.share_count || 0)
      })
    }
  }, [post?.like_count, post?.comment_count, post?.share_count, post?.user_has_reacted])

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
    
    // PRIORITY 1: Check for direct columns first (from updated database function)
    if (post.text && post.text.trim() !== '') {
      return post.text
    }
    
    // PRIORITY 2: Check for content in the data JSONB field (old structure)
    if (post.data) {
      if (post.data.text && post.data.text.trim() !== '') {
        return post.data.text
      }
      if (post.data.content && post.data.content.trim() !== '') {
        return post.data.content
      }
      if (post.data.body && post.data.body.trim() !== '') {
        return post.data.body
      }
      if (post.data.message && post.data.message.trim() !== '') {
        return post.data.message
      }
      if (post.data.description && post.data.description.trim() !== '') {
        return post.data.description
      }
    }
    
    // PRIORITY 3: Check for content in metadata field (if it exists)
    if (post.metadata) {
      if (post.metadata.text && post.metadata.text.trim() !== '') {
        return post.metadata.text
      }
      if (post.metadata.content && post.metadata.content.trim() !== '') {
        return post.metadata.content
      }
    }
    
    // PRIORITY 4: Check for content_summary field
    if (post.content_summary && post.content_summary.trim() !== '') {
      return post.content_summary
    }
    
      // FINAL FALLBACK: Provide meaningful fallback based on activity type and content type
  if (post.content_type === 'image') {
    return post.image_url ? 'Shared an image' : 'Shared an image'
  } else if (post.content_type === 'video') {
    return 'Shared a video'
  } else if (post.content_type === 'link') {
    return post.link_url ? 'Shared a link' : 'Shared a link'
  } else if (post.content_type === 'book') {
    return 'Shared a book'
  } else if (post.content_type === 'author') {
    return 'Shared an author'
  } else if (post.content_type === 'text') {
    return 'Shared an update'
  } else if (post.activity_type === 'book_review') {
    return 'Shared a book review'
  } else if (post.activity_type === 'book_share') {
    return 'Shared a book'
  } else if (post.activity_type === 'reading_progress') {
    return 'Updated reading progress'
  } else if (post.activity_type === 'book_added') {
    return 'Added a book to their library'
  } else if (post.activity_type === 'author_follow') {
    return 'Started following an author'
  } else if (post.activity_type === 'book_recommendation') {
    return 'Recommended a book'
  } else if (post.activity_type) {
    return `Shared a ${post.activity_type.replace('_', ' ')}`
  }
  
  console.log('getPostText - No text found, returning default')
  return 'Shared an update'
  }

  const getPostImages = (post: any): string[] => {
    // Debug: Log the actual post structure for images
    console.log('getPostImages - Post image structure:', {
      hasImageUrl: !!post.image_url,
          hasContent: !!(post.text || post.data),
    contentImageUrl: post.image_url
    })
    
    // PRIORITY 1: Check for direct image_url column (from current schema)
    if (post.image_url && post.image_url.trim() !== '') {
      console.log('getPostImages - Found image_url in direct column:', post.image_url)
      return post.image_url.split(',').map((url: string) => url.trim()).filter(Boolean)
    }
    
    // PRIORITY 2: Check for images in data JSONB field
    if (post.data?.images) {
      console.log('getPostImages - Found images in data.images:', post.data.images)
      return Array.isArray(post.data.images) ? post.data.images : [post.data.images]
    }
    
    if (post.data?.image_url && post.data.image_url.trim() !== '') {
      console.log('getPostImages - Found image_url in data.image_url:', post.data.image_url)
      return post.data.image_url.split(',').map((url: string) => url.trim()).filter(Boolean)
    }
    
    // PRIORITY 3: Check for media_url in data
    if (post.data?.media_url && post.data.media_url.trim() !== '') {
      console.log('getPostImages - Found media_url in data.media_url:', post.data.media_url)
      return post.data.media_url.split(',').map((url: string) => url.trim()).filter(Boolean)
    }
    
    // PRIORITY 4: Check for nested content structure
    if (post.data?.content?.image_url && post.data.content.image_url.trim() !== '') {
      console.log('getPostImages - Found image_url in data.content.image_url:', post.data.content.image_url)
      return post.data.content.image_url.split(',').map((url: string) => url.trim()).filter(Boolean)
    }
    
    if (post.data?.content?.images) {
      console.log('getPostImages - Found images in data.content.images:', post.data.content.images)
      return Array.isArray(post.data.content.images) ? post.data.content.images : [post.data.content.images]
    }
    
    // Note: post.data.data nesting doesn't exist in current schema, removed these checks
    
    console.log('getPostImages - No images found, returning empty array')
    return []
  }

  const getPostContentType = (post: any): string => {
    // Debug: Log the actual post structure for content type
    console.log('getPostContentType - Post content type structure:', {
          hasContentType: !!post.content_type,
    hasContent: !!(post.text || post.data),
    contentType: post.content_type,
      postId: post.id,
      activityType: post.activity_type,
      hasText: !!(post.text || post.data?.text),
      hasImages: getPostImages(post).length > 0
    })
    
    // Handle like activities specifically
    if (post.activity_type === 'like') {
      console.log('getPostContentType - Returning like for like activity')
      return 'like'
    }
    
    // Try to get content type from various possible locations
    if (post.content_type) {
      console.log('getPostContentType - Found post.content_type:', post.content_type)
      return post.content_type
    }
    // Note: post.content doesn't exist in current schema, removed this check
    if (post.data?.content_type) {
      console.log('getPostContentType - Found post.data.content_type:', post.data.content_type)
      return post.data.content_type
    }
    if (post.data?.type) {
      console.log('getPostContentType - Found post.data.type:', post.data.type)
      return post.data.type
    }
    // Note: post.data.content doesn't exist in current schema, removed this check
    
    // Note: post.data.data nesting doesn't exist in current schema, removed these checks
    
    // Infer from content
    const images = getPostImages(post)
    if (images.length > 0) {
      console.log('getPostContentType - Inferring image from images array')
      return 'image'
    }
    if (post.link_url || post.data?.link_url || post.data?.url) {
      console.log('getPostContentType - Inferring link from link URLs')
      return 'link'
    }
    
    // If we have text content, default to text
    if (post.text || post.data?.text) {
      console.log('getPostContentType - Inferring text from text content')
      return 'text'
    }
    
    console.log('getPostContentType - No content type found, defaulting to text')
    return 'text'
  }

  const hasImageContent = (post: any): boolean => {
    return getPostImages(post).length > 0
  }

  const hasTextContent = (post: any): boolean => {
    const text = getPostText(post)
    const result = typeof text === 'string' && text.trim().length > 0
    console.log('hasTextContent function:', {
      postId: post.id,
      text,
      textType: typeof text,
      textLength: text?.length,
      trimmedLength: text?.trim()?.length,
      result
    })
    return result
  }

      // Get display values using helper functions
    const displayText = getPostText(post)
    const displayImageUrl = getPostImages(post).join(',')
    const displayContentType = getPostContentType(post)
    
    // Debug: Log what we got from the helper functions
    console.log('EntityFeedCard - Helper function results:', {
      postId: post.id,
      displayText,
      displayImageUrl,
      displayContentType,
      hasTextContent: hasTextContent(post),
      hasImageContent: hasImageContent(post)
    })

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
    if (isEditing) {
      // Cancel editing - reset content and images
      setEditContent(getPostText(post))
      setEditImages(getPostImages(post))
    } else {
      // Start editing - set content and images to current post values
      setEditContent(getPostText(post))
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
        content: { text: editContent.trim() },
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
      // Enhanced logging to debug the post structure
      console.log('=== DELETE DEBUG ===')
      console.log('Post ID:', post.id)
      console.log('Post keys:', Object.keys(post))
      console.log('Post activity_type:', post.activity_type)
      console.log('Post entity_type:', post.entity_type)
      console.log('Post content_type:', post.content_type)
      console.log('Post has text field:', !!post.text)
      console.log('Post has data field:', !!(post as any).data)
      console.log('========================')

      // All posts now use the unified activities table system
      const endpoint = '/api/activities'
      console.log('Deleting post from unified activities table')
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id })
      })

      console.log('Delete response status:', response.status)
      console.log('Delete response ok:', response.ok)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Delete error response:', errorData)
        throw new Error(errorData.error || `Failed to delete post (${response.status})`)
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
        description: error instanceof Error ? error.message : "Failed to delete post",
        variant: "destructive"
      })
    }
  }

  // Load engagement data with optimization - UPDATED to use built-in data
  const loadEngagementData = useCallback(async () => {
    if (!showEngagement || !post?.id) return

    setIsLoadingEngagement(true)
    try {
      // Since engagement data is now built into the activities table,
      // we don't need to make separate API calls
      console.log('✅ Using built-in engagement data from post:', {
        like_count: post.like_count,
        comment_count: post.comment_count,
        share_count: post.share_count
      })

      // Use the engagement data directly from the post
      setEngagementData({
        likes: [], // Individual likes not stored separately anymore
        comments: [], // Individual comments not stored separately anymore  
        shares: [],
        bookmarks: []
      })
    } catch (error) {
      console.error('Error setting engagement data:', error)
    } finally {
      setIsLoadingEngagement(false)
    }
  }, [post?.id, showEngagement])

  useEffect(() => {
    loadEngagementData()
  }, [loadEngagementData])

  // Fetch comment permission when modal opens
  useEffect(() => {
    let cancelled = false
    async function checkPermission() {
      if (!showCommentsModal) return
      try {
        const resp = await fetch(`/api/engagement/can-comment?entity_id=${post.id}&entity_type=${post.entity_type || 'activity'}`)
        if (!resp.ok) {
          if (!cancelled) setCanCommentModal(false)
          return
        }
        const data = await resp.json()
        if (!cancelled) setCanCommentModal(!!data?.allowed)
      } catch {
        if (!cancelled) setCanCommentModal(false)
      }
    }
    checkPermission()
    return () => { cancelled = true }
  }, [showCommentsModal, post.id, post.entity_type])

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
    console.log('renderContent called, isEditing:', isEditing)
    if (isEditing) {
      console.log('Rendering edit form with content:', editContent)
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
      hasText: !!post.text,
      hasData: !!post.data,
      contentText: post.text || post.data?.text
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
        hasImage: hasImageContent(post),
        displayText,
        displayImageUrl
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

    const content = { text: post.text || post.data?.text || '' } as PostContent

    console.log('Content type switch:', { 
      contentType: displayContentType, 
      postId: post.id,
      postContentType: post.content_type,
      postContent: { text: post.text || post.data?.text || '' }
    })
    
    switch (displayContentType) {
      case 'text':
        console.log('Rendering text content case:', {
          postId: post.id,
          displayText,
          hasDisplayText: !!displayText
        })
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
          hasImageUrl: !!post.image_url
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

      case 'like':
        return (
          <div className="enterprise-feed-card-like-content">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-shrink-0">
                <Heart className="h-6 w-6 text-red-500 fill-current" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar
                    src={post.user_avatar_url}
                    alt={post.user_name || 'User'}
                    name={post.user_name}
                    size="sm"
                    className="h-8 w-8"
                  />
                  <div>
                    <span className="font-semibold text-sm">{post.user_name || 'User'}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {post.metadata?.aggregated_likes_count > 1 
                        ? `and ${post.metadata.aggregated_likes_count - 1} others liked a post`
                        : 'liked a post'
                      }
                    </span>
                  </div>
                </div>
                
                {/* Show recent likers if aggregated */}
                {post.metadata?.recent_likers && post.metadata.recent_likers.length > 1 && (
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-xs text-muted-foreground">Recent likers:</span>
                    {post.metadata.recent_likers.slice(0, 3).map((liker: string, index: number) => (
                      <span key={index} className="text-xs font-medium text-blue-600">
                        {liker}{index < Math.min(2, post.metadata.recent_likers.length - 1) ? ', ' : ''}
                      </span>
                    ))}
                    {post.metadata.recent_likers.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        and {post.metadata.recent_likers.length - 3} more
                      </span>
                    )}
                  </div>
                )}
                
                {/* Show the original post content if available */}
                {post.metadata?.liked_activity_content && (
                  <div className="bg-white p-3 rounded border-l-4 border-blue-300">
                    <p className="text-sm text-gray-700">
                      "{post.metadata.liked_activity_content}"
                    </p>
                  </div>
                )}
                
                {/* Show the original post image if available */}
                {post.metadata?.liked_activity_image && (
                  <div className="mt-2">
                    <img
                      src={post.metadata.liked_activity_image}
                      alt="Liked post content"
                      className="w-16 h-16 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
            </div>
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
      <EngagementDisplay
        entityId={post.id}
        entityType={post.entity_type || 'activity'}
        reactionCount={post.like_count || 0}
        commentCount={post.comment_count || 0}
        onReactionsClick={() => setShowLikesModal(true)}
        onCommentsClick={() => setShowCommentsModal(true)}
        onUserClick={(userId) => {
          console.log('Navigate to user profile:', userId)
          // Add navigation logic here
        }}
        onAddFriend={(userId) => {
          console.log('Send friend request to:', userId)
          // Add friend request logic here
        }}
        customReactionIcon={<Heart className="h-3.5 w-3.5" />}
        customReactionColor="from-red-500 to-pink-500"
        showReactionTypes={false}
        maxPreviewItems={6}
        showAddFriendButtons={true}
      />
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
              name: postOwnerName,
              avatar_url: postOwnerAvatar
            }}
          >
            <span className="hover:underline cursor-pointer text-muted-foreground" data-state="closed">
              <div className="avatar-container relative w-10 h-10 overflow-hidden rounded-full border-2 border-white shadow-md enterprise-feed-card-user-avatar cursor-pointer">
                <Avatar
                  src={postOwnerAvatar}
                  alt={postOwnerName || 'User'}
                  name={postOwnerName}
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
                  name: postOwnerName,
                  avatar_url: postOwnerAvatar
                }}
              >
                <span className="hover:underline cursor-pointer text-muted-foreground" data-state="closed">
                  <EntityName
                    type="user"
                    id={post.user_id}
                    name={postOwnerName}
                    avatar_url={postOwnerAvatar}
                    className="enterprise-feed-card-user-name font-semibold text-sm"
                  />
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
                {new Date(post.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric'
                })}
              </span>

              {/* Scheduled Post */}
              {post.scheduled_at && (
                <span className="enterprise-feed-card-scheduled flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Scheduled for {new Date(post.scheduled_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric'
                  })}
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

        {/* Engagement Actions - Keep only the action buttons, remove duplicate stats */}
        {showActions && (
          <div className="enterprise-feed-card-engagement-actions mt-4">
            <EnterpriseEngagementActions
              entityId={post.id}
              entityType="activity"
              initialEngagementCount={post.like_count + post.comment_count + (post.share_count || 0)}
              commentCount={post.comment_count || 0}
              shareCount={post.share_count || 0}
              bookmarkCount={post.bookmark_count || 0}
              viewCount={post.view_count || 0}
              isLiked={post.user_has_reacted}
              isCommented={post.user_has_commented}
              isShared={post.user_has_shared}
              isBookmarked={post.user_has_bookmarked}
              isViewed={post.user_has_viewed}
              currentReaction={post.user_reaction_type as ReactionType | null || null}
              onEngagement={async (action: 'reaction' | 'comment' | 'share' | 'bookmark' | 'view', entityId: string, entityType: string, reactionType?: any) => {
                // Handle engagement
                console.log('Engagement action:', action, entityId, entityType, reactionType)
                // Update local state if needed
                if (onPostUpdated) {
                  const updatedPost = { ...post }
                  onPostUpdated(updatedPost)
                }
              }}
              onCommentAdded={async (newComment: any) => {
                // Add the new comment to the local state
                setEngagementData((prev: any) => ({
                  ...prev,
                  comments: [newComment, ...prev.comments]
                }))
                
                // Update the post's comment count
                if (onPostUpdated) {
                  const updatedPost = { ...post, comment_count: (post.comment_count || 0) + 1 }
                  onPostUpdated(updatedPost)
                }
              }}
              onShare={async (entityId: string, entityType: string) => {
                console.log('Share action:', entityId, entityType)
                // Handle share logic
              }}
              onBookmark={async (entityId: string, entityType: string) => {
                console.log('Bookmark action:', entityId, entityType)
                // Handle bookmark logic
              }}
              onCommentClick={focusBottomComposer}
            />
          </div>
        )}

        {/* Single-comment preview (above composer) */}
        {showComments && !isLoadingComments && comments.length > 0 && (
          <div className="enterprise-feed-card-comments mt-4">
            {(post.comment_count || comments.length) > 1 && (
              <button
                onClick={() => setShowCommentsModal(true)}
                className="text-sm text-gray-600 font-medium mb-2 hover:underline"
              >
                View more comments
              </button>
            )}

            {(() => {
              const first = comments[0]
              if (!first) return null
              const firstReply = Array.isArray(first.replies) && first.replies.length > 0 ? first.replies[0] : null
              return (
                <div className="space-y-3">
                  {/* First comment bubble */}
                  <div className="flex items-start gap-3">
                    <EntityAvatar type="user" id={first.user?.id} name={first.user?.name || 'User'} src={first.user?.avatar_url} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-100 rounded-2xl px-4 py-3 inline-block max-w-full">
                        <div className="flex items-center gap-2 mb-1">
                          <EntityName type="user" id={first.user?.id} name={first.user?.name || 'User'} className="text-sm font-semibold text-gray-900" />
            </div>
                        <div ref={firstCommentTextRef} className="text-sm text-gray-800 leading-relaxed line-clamp-5">
                          {first.comment_text}
              </div>
                        {isFirstCommentClamped && (
                          <button onClick={() => setShowCommentsModal(true)} className="mt-1 text-xs font-medium text-gray-600 hover:underline">
                            View more
                          </button>
                        )}
            </div>
                      <div className="flex items-center justify-between mt-1 ml-2">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{formatTimeAgo(first.created_at)}</span>
                          <button className="hover:underline">Like</button>
                          <button className="hover:underline">Reply</button>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded-full hover:bg-gray-100" aria-label="Comment actions">
                              <MoreHorizontal className="h-4 w-4 text-gray-500" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  await fetch('/api/comments/hide', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ comment_id: first.id })
                                  })
                                  fetchComments()
                                } catch (e) {
                                  console.error(e)
                                }
                              }}
                            >
                              Hide comment
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  await fetch('/api/users/block', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ user_id: first.user?.id })
                                  })
                                  fetchComments()
                                } catch (e) {
                                  console.error(e)
                                }
                              }}
                            >
                              Block {first.user?.name || 'user'}
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>More block options</DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem
                                  onClick={async () => {
                                    try {
                                      await fetch('/api/comments/hide-user', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ user_id: first.user?.id })
                                      })
                                      fetchComments()
                                    } catch (e) {
                                      console.error(e)
                                    }
                                  }}
                                >
                                  Hide all comments from this user
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={async () => {
                                    try {
                                      await fetch('/api/users/block', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ user_id: first.user?.id })
                                      })
                                      fetchComments()
                                    } catch (e) {
                                      console.error(e)
                                    }
                                  }}
                                >
                                  Block user globally
                                </DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  await fetch('/api/users/block', {
                                    method: 'DELETE',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ user_id: first.user?.id })
                                  })
                                  fetchComments()
                                } catch (e) {
                                  console.error(e)
                                }
                              }}
                            >
                              Unblock {first.user?.name || 'user'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  await fetch('/api/report', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ target_type: 'comment', target_id: first.id })
                                  })
                                } catch (e) {
                                  console.error(e)
                                }
                              }}
                            >
                              Report comment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
              </div>
                    </div>
                  </div>

                  {/* First reply (if any) */}
                  {firstReply && (
                    <div className="ml-10 flex items-start gap-2">
                      <EntityAvatar type="user" id={firstReply.user?.id} name={firstReply.user?.name || 'User'} src={firstReply.user?.avatar_url} size="xs" />
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-50 rounded-2xl px-3 py-2 inline-block max-w-full">
                          <div className="flex items-center gap-2 mb-0.5">
                            <EntityName type="user" id={firstReply.user?.id} name={firstReply.user?.name || 'User'} className="text-xs font-semibold text-gray-900" />
                    </div>
                          <div className="text-xs text-gray-800 leading-relaxed">
                            {firstReply.comment_text}
                  </div>
                </div>
                        <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] text-gray-500">
                          <span>{formatTimeAgo(firstReply.created_at)}</span>
                          <button className="hover:underline">Like</button>
                          <button className="hover:underline" onClick={() => setExpandedReplies(prev => ({ ...prev, [first.id]: true }))}>Reply</button>
              </div>
                        {expandedReplies[first.id] && (
                          <div className="mt-2">
                            <EntityCommentComposer
                              entityId={post.id}
                              entityType={post.entity_type || 'activity'}
                              currentUserId={user?.id}
                              currentUserName={currentUserDisplayName}
                              currentUserAvatar={currentUserAvatar}
                              parentCommentId={firstReply.id}
                              placeholder={`Reply to ${firstReply.user?.name || 'reply'}`}
                              onSubmitted={() => {
                                fetchComments()
                              }}
                            />
                          </div>
                        )}
            </div>
          </div>
        )}
                </div>
              )
            })()}
          </div>
        )}

        {/* Bottom comment composer (always at bottom) */}
        <div className="enterprise-feed-card-comment-composer mt-3">
          <EntityCommentComposer
            entityId={post.id}
            entityType={post.entity_type || 'activity'}
            currentUserId={user?.id}
            currentUserName={currentUserDisplayName}
            currentUserAvatar={currentUserAvatar}
            focusControl={composerFocusTick}
            rootClassName=""
            containerClassName="bg-white px-0 pt-3"
            rowClassName="enterprise-comment-composer-row flex items-center gap-3"
            avatarClassName="enterprise-comment-composer-avatar w-8 h-8 flex-shrink-0"
            triggerClassName="enterprise-comment-composer-trigger flex-1 flex items-center justify-between rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-left text-sm text-gray-600 cursor-text"
            triggerIconsClassName="enterprise-comment-composer-trigger-icons flex items-center gap-2 ml-3 text-gray-400"
            expandedClassName="enterprise-comment-composer-expanded bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2"
            textareaClassName="enterprise-comment-composer-textarea border-0 resize-none focus:ring-0 focus:outline-none min-h-[48px] text-sm bg-transparent"
            actionsClassName="enterprise-comment-composer-actions flex items-center justify-between mt-2"
            quickActionsClassName="enterprise-comment-composer-quick-actions flex items-center gap-2 text-gray-500"
            iconButtonClassName="enterprise-comment-composer-icon p-2 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100"
            cancelButtonClassName="enterprise-comment-composer-cancel h-8 px-3 text-xs"
            submitButtonClassName="enterprise-comment-composer-submit h-8 px-4 text-xs"
            onSubmitted={() => {
              if (onPostUpdated) {
                const updatedPost = { ...post, comment_count: (post.comment_count || 0) + 1 }
                onPostUpdated(updatedPost)
              }
              fetchComments()
            }}
          />
        </div>
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
            description: post.text || post.data?.text || `Image ${index + 1} from post`,
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

      {/* Reusable Reactions Modal */}
      <ReactionsModal
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        entityId={post.id}
        entityType={post.entity_type || 'activity'}
        reactionCount={post.like_count || 0}
        title="Reactions"
        description="People who reacted to this post"
        onUserClick={(userId) => {
          console.log('Navigate to user profile:', userId)
          // Add navigation logic here
        }}
        onAddFriend={(userId) => {
          console.log('Send friend request to:', userId)
          // Add friend request logic here
        }}
        customReactionIcon={<Heart className="h-5 w-5" />}
        customReactionColor="from-red-500 to-pink-500"
        showReactionTypes={false}
        maxReactions={50}
      />

      {/* Enhanced Comments Modal */}
      {showCommentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 h-[90vh] shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {postOwnerName}'s Post
                    </h3>
                    <p className="text-sm text-gray-500">
                      Join the conversation about this post
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCommentsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Single scrollable column: header + post content + filter + comments */}
              <div className="flex-1 overflow-y-auto">
                {/* Feed header (same as card header) */}
                <div className="px-6 pt-4">
                  <div className="enterprise-feed-card-header-content flex items-start gap-3">
                    <EntityHoverCard
                      type="user"
                      entity={{ id: post.user_id, name: postOwnerName, avatar_url: postOwnerAvatar }}
                    >
                      <span className="hover:underline cursor-pointer text-muted-foreground" data-state="closed">
                        <div className="avatar-container relative w-10 h-10 overflow-hidden rounded-full border-2 border-white shadow-md enterprise-feed-card-user-avatar cursor-pointer">
                          <Avatar
                            src={postOwnerAvatar}
                            alt={postOwnerName || 'User'}
                            name={postOwnerName}
                            size="sm"
                            className="object-cover rounded-full"
                          />
                        </div>
                      </span>
                    </EntityHoverCard>
                    <div className="enterprise-feed-card-header-info flex-1">
                      <div className="enterprise-feed-card-header-top flex items-center gap-2 mb-1">
                        <EntityHoverCard
                          type="user"
                          entity={{ id: post.user_id, name: postOwnerName, avatar_url: postOwnerAvatar }}
                        >
                          <span className="hover:underline cursor-pointer text-muted-foreground" data-state="closed">
                            <EntityName
                              type="user"
                              id={post.user_id}
                              name={postOwnerName}
                              avatar_url={postOwnerAvatar}
                              className="enterprise-feed-card-user-name font-semibold text-sm"
                            />
                          </span>
                        </EntityHoverCard>
                      </div>
                      <div className="enterprise-feed-card-header-bottom flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="enterprise-feed-card-timestamp">
                          {new Date(post.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Post content */}
                <div className="px-6 pt-2">
                  {renderContent()}
                </div>

                {/* Filter */}
                <div className="px-6 pt-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full px-3 py-1">
                        {commentFilter === 'relevant' ? 'Most relevant' : 'All comments'}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-80">
                      <DropdownMenuItem onClick={() => setCommentFilter('relevant')}>
                        <div>
                          <div className="font-medium">Most relevant</div>
                          <div className="text-xs text-gray-500">Show friends' comments and the most engaging comments first.</div>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setCommentFilter('all')}>
                        <div>
                          <div className="font-medium">All comments</div>
                          <div className="text-xs text-gray-500">Show all comments, including potential spam.</div>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Comments List */}
                <div className="px-6 py-4">
                {!isLoadingComments && comments.length > 0 ? (
                    <div className="space-y-4">
                    {(commentFilter === 'all' ? [...comments] : comments).map((comment) => (
                      <div key={comment.id} className="comment-item">
                      {/* Comment Header */}
                        <div className="flex items-start gap-3">
                        <EntityAvatar
                          type="user"
                          id={comment.user?.id}
                          name={comment.user?.name || 'User'}
                          src={comment.user?.avatar_url}
                          size="sm"
                        />
                          <div className="flex-1 min-w-0">
                            {/* Comment Bubble */}
                            <div className="bg-gray-100 rounded-2xl px-4 py-3 inline-block max-w-full">
                              <div className="flex items-center gap-2 mb-2">
                                <EntityName type="user" id={comment.user?.id} name={comment.user?.name || 'Unknown User'} className="text-sm font-semibold text-gray-900" />
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric'
                                  })}
                                </span>
                              </div>
                      
                      {/* Comment Text */}
                              <div className="text-sm text-gray-800 leading-relaxed">
                        {comment.comment_text}
                              </div>
                      </div>
                      
                            {/* Comment Actions */}
                            <div className="flex items-center justify-between mt-2 ml-2">
                              <div className="flex items-center gap-4">
                              <button className="text-xs text-gray-500 hover:text-blue-600 transition-colors hover:underline">
                                Like
                              </button>
                              <button className="text-xs text-gray-500 hover:text-blue-600 transition-colors hover:underline" onClick={() => setExpandedReplies(prev => ({ ...prev, [comment.id]: true }))}>
                                Reply
                              </button>
                              <span className="text-xs text-gray-400">
                                {comment.reply_count > 0 && `${comment.reply_count} replies`}
                              </span>
                              {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                                <button
                                  className="text-xs text-gray-500 hover:text-blue-600 transition-colors hover:underline"
                                  onClick={() => setExpandedReplies(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}
                                >
                                  {expandedReplies[comment.id] ? 'Hide replies' : 'Show replies'}
                                </button>
                              )}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1 rounded-full hover:bg-gray-100" aria-label="Comment actions">
                                    <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={async () => { try { await fetch('/api/comments/hide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comment_id: comment.id }) }); fetchComments() } catch(e){ console.error(e) } }}>Hide comment</DropdownMenuItem>
                                  <DropdownMenuItem onClick={async () => { try { await fetch('/api/users/block', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: comment.user?.id }) }); fetchComments() } catch(e){ console.error(e) } }}>Block {comment.user?.name || 'user'}</DropdownMenuItem>
                                  <DropdownMenuItem onClick={async () => { try { await fetch('/api/users/block', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: comment.user?.id }) }); fetchComments() } catch(e){ console.error(e) } }}>Unblock {comment.user?.name || 'user'}</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={async () => { try { await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_type: 'comment', target_id: comment.id }) }) } catch(e){ console.error(e) } }}>Report comment</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            
                            {/* Nested Replies */}
                            {(comment.replies && comment.replies.length > 0 && expandedReplies[comment.id]) && (
                              <div className="ml-8 mt-3 space-y-3">
                                {comment.replies.map((reply: any) => (
                                  <div key={reply.id} className="flex items-start gap-3">
                                    <EntityAvatar type="user" id={reply.user?.id} name={reply.user?.name || 'User'} src={reply.user?.avatar_url} size="xs" />
                                    <div className="flex-1 min-w-0">
                                      <div className="bg-gray-50 rounded-2xl px-3 py-2 inline-block max-w-full">
                                        <div className="flex items-center gap-2 mb-1">
                                          <EntityName type="user" id={reply.user?.id} name={reply.user?.name || 'Unknown User'} className="text-xs font-semibold text-gray-900" />
                                          <span className="text-xs text-gray-400">
                                            {new Date(reply.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric'
                        })}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-800 leading-relaxed">
                                          {reply.comment_text}
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-between mt-1 ml-2">
                                        <div className="flex items-center gap-3">
                                          <button className="text-xs text-gray-500 hover:text-blue-600 transition-colors hover:underline">
                                            Like
                                          </button>
                                          <button className="text-xs text-gray-500 hover:text-blue-600 transition-colors hover:underline">
                                            Reply
                                          </button>
                                        </div>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <button className="p-1 rounded-full hover:bg-gray-100" aria-label="Reply actions">
                                              <MoreHorizontal className="h-3 w-3 text-gray-500" />
                                            </button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={async () => { try { await fetch('/api/comments/hide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comment_id: reply.id }) }); fetchComments() } catch(e){ console.error(e) } }}>Hide reply</DropdownMenuItem>
                                            <DropdownMenuItem onClick={async () => { try { await fetch('/api/users/block', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: reply.user?.id }) }); fetchComments() } catch(e){ console.error(e) } }}>Block {reply.user?.name || 'user'}</DropdownMenuItem>
                                            <DropdownMenuItem onClick={async () => { try { await fetch('/api/users/block', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: reply.user?.id }) }); fetchComments() } catch(e){ console.error(e) } }}>Unblock {reply.user?.name || 'user'}</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={async () => { try { await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_type: 'comment', target_id: reply.id }) }) } catch(e){ console.error(e) } }}>Report reply</DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                      
                                      {/* Nested Replies (replies to replies) */}
                                      {reply.replies && reply.replies.length > 0 && (
                                        <div className="ml-6 mt-2 space-y-2">
                                          {reply.replies.map((nestedReply: any) => (
                                            <div key={nestedReply.id} className="flex items-start gap-2">
                                              <EntityAvatar type="user" id={nestedReply.user?.id} name={nestedReply.user?.name || 'User'} src={nestedReply.user?.avatar_url} size="xs" />
                                              <div className="flex-1 min-w-0">
                                                <div className="bg-gray-50 rounded-2xl px-3 py-2 inline-block max-w-full">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <EntityName type="user" id={nestedReply.user?.id} name={nestedReply.user?.name || 'Unknown User'} className="text-xs font-semibold text-gray-900" />
                                                    <span className="text-xs text-gray-400">
                                                      {new Date(nestedReply.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: 'numeric',
                                                        minute: 'numeric'
                                                      })}
                                                    </span>
                                                  </div>
                                                  <div className="text-xs text-gray-800 leading-relaxed">
                                                    {nestedReply.comment_text}
                                                  </div>
                                                </div>
                                                <div className="flex items-center justify-between mt-1 ml-2">
                                                  <div className="flex items-center gap-3">
                                                    <button className="text-xs text-gray-500 hover:text-blue-600 transition-colors hover:underline">
                                                      Like
                                                    </button>
                                                    <button className="text-xs text-gray-500 hover:text-blue-600 transition-colors hover:underline">
                                                      Reply
                                                    </button>
                                                  </div>
                                                  <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                      <button className="p-1 rounded-full hover:bg-gray-100" aria-label="Nested reply actions">
                                                        <MoreHorizontal className="h-3 w-3 text-gray-500" />
                                                      </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                      <DropdownMenuItem onClick={async () => { try { await fetch('/api/comments/hide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comment_id: nestedReply.id }) }); fetchComments() } catch(e){ console.error(e) } }}>Hide reply</DropdownMenuItem>
                                                      <DropdownMenuItem onClick={async () => { try { await fetch('/api/users/block', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: nestedReply.user?.id }) }); fetchComments() } catch(e){ console.error(e) } }}>Block {nestedReply.user?.name || 'user'}</DropdownMenuItem>
                                                      <DropdownMenuItem onClick={async () => { try { await fetch('/api/users/block', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: nestedReply.user?.id }) }); fetchComments() } catch(e){ console.error(e) } }}>Unblock {nestedReply.user?.name || 'user'}</DropdownMenuItem>
                                                      <DropdownMenuSeparator />
                                                      <DropdownMenuItem onClick={async () => { try { await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_type: 'comment', target_id: nestedReply.id }) }) } catch(e){ console.error(e) } }}>Report reply</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                  </DropdownMenu>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {expandedReplies[comment.id] && (
                              <div className="ml-8 mt-3">
                                <EntityCommentComposer
                                  entityId={post.id}
                                  entityType={post.entity_type || 'activity'}
                                  currentUserId={user?.id}
                                  currentUserName={currentUserDisplayName}
                                  currentUserAvatar={currentUserAvatar}
                                  parentCommentId={comment.id}
                                  placeholder={`Reply to ${comment.user?.name || 'comment'}`}
                                  onSubmitted={() => {
                                    fetchComments()
                                  }}
                                />
                              </div>
                            )}
                          </div>
                      </div>
                      </div>
                    ))}
                  </div>
                ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="h-8 w-8 text-gray-400" />
                    </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>
                      <p className="text-gray-500">Be the first to share your thoughts!</p>
                  </div>
                )}
                </div>
              </div>

              {/* Comment Input Section (reused composer) */}
              {canCommentModal && (
                <div className="bg-white px-6 py-3 border-t border-gray-200 shrink-0">
                  <EntityCommentComposer
                    entityId={post.id}
                    entityType={post.entity_type || 'activity'}
                    currentUserId={user?.id}
                    currentUserName={currentUserDisplayName}
                    currentUserAvatar={currentUserAvatar}
                    containerClassName=""
                    rowClassName="flex items-center gap-3"
                    avatarClassName="w-8 h-8 flex-shrink-0"
                    triggerClassName="flex-1 flex items-center justify-between rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-left text-sm text-gray-600 cursor-text"
                    triggerIconsClassName="flex items-center gap-2 ml-3 text-gray-400"
                    expandedClassName="bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2"
                    textareaClassName="border-0 resize-none focus:ring-0 focus:outline-none min-h-[48px] text-sm bg-transparent"
                    actionsClassName="flex items-center justify-between mt-2"
                    quickActionsClassName="flex items-center gap-2 text-gray-500"
                    iconButtonClassName="p-2 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100"
                    cancelButtonClassName="h-8 px-3 text-xs"
                    submitButtonClassName="h-8 px-4 text-xs"
                    onSubmitted={() => {
                      if (onPostUpdated) {
                        const updatedPost = { ...post, comment_count: (post.comment_count || 0) + 1 }
                        onPostUpdated(updatedPost)
                      }
                      fetchComments()
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
