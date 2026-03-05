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
  X,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { BookCover } from '@/components/book-cover'
import { EntityHoverCard } from '@/components/entity-hover-cards'
import type { UserStats } from '@/hooks/useUserStats'
import EntityName from '@/components/entity-name'
import EntityAvatar from '@/components/entity-avatar'
import { EnterpriseEngagementActions } from '@/components/enterprise/enterprise-engagement-actions'
import type { EntityType } from '@/lib/engagement/config'
import { ENGAGEMENT_ENTITY_TYPE_POST } from '@/lib/engagement/config'
import { ReactionType, useEngagement } from '@/contexts/engagement-context'
import { CommentActionButtons } from '@/components/enterprise/comment-action-buttons'
import { NestedCommentThread } from '@/components/enterprise/nested-comment-thread'
import { SophisticatedPhotoGrid } from '@/components/photo-gallery/sophisticated-photo-grid'
import { EnterprisePhotoViewer } from '@/components/photo-gallery/enterprise-photo-viewer'
import {
  FeedPost,
  PostContent,
  PostVisibility,
  PostPublishStatus,
  getPostText,
  getPostImages,
  getPostContentType,
  hasImageContent,
  hasTextContent,
} from '@/types/feed'
import { useAuth } from '@/hooks/useAuth'
import { deduplicatedRequest } from '@/lib/request-utils'
import { ReactionsModal } from '@/components/enterprise/reactions-modal'
import { ReusableModal } from '@/components/ui/reusable-modal'
import { EngagementDisplay } from '@/components/enterprise/engagement-display'
import EntityCommentComposer from '@/components/entity-comment-composer'
import dynamic from 'next/dynamic'
import { extractLinks, extractFirstLink } from '@/lib/link-preview/link-extractor'
import { TaggedTextRenderer } from '@/components/tags/tagged-text-renderer'
import ReusableCommentThread, {
  type ReusableCommentNode,
} from '@/components/enterprise/reusable-comment-thread'

// Code splitting: Lazy load link preview components
const EnterpriseLinkPreviewCard = dynamic(
  () => import('@/components/enterprise/link-preview/enterprise-link-preview-card').then((mod) => ({ default: mod.EnterpriseLinkPreviewCard })),
  {
    loading: () => <div className="h-32 w-full animate-pulse rounded-lg bg-muted" />,
    ssr: false, // Disable SSR for link previews to reduce initial bundle size
  }
)

const MultipleLinkPreview = dynamic(
  () => import('@/components/enterprise/link-preview/multiple-link-preview').then((mod) => ({ default: mod.MultipleLinkPreview })),
  {
    loading: () => <div className="h-32 w-full animate-pulse rounded-lg bg-muted" />,
    ssr: false,
  }
)
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
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
  /** Engagement entity type (e.g. activity for timeline posts). Defaults to activity for feed posts. */
  engagementEntityType?: EntityType
  /** When viewing a user profile, the profile owner's stats for consistent hover card display */
  profileOwnerId?: string
  profileOwnerUserStats?: UserStats
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
  onPostDeleted,
  engagementEntityType = ENGAGEMENT_ENTITY_TYPE_POST,
  profileOwnerId,
  profileOwnerUserStats,
}: EntityFeedCardProps) {
  // Safety check for post object
  if (!post) {
    console.warn('EntityFeedCard: post prop is undefined')
    return null
  }

  const { toast } = useToast()
  const { user } = useAuth()
  const { getEngagement, addComment, batchUpdateEngagement } = useEngagement()
  const [currentVisibility, setCurrentVisibility] = useState(post.visibility)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFullContent, setShowFullContent] = useState(false)
  const [engagementData, setEngagementData] = useState<any>({
    reactions: [],
    comments: [],
    shares: [],
    bookmarks: [],
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
  const [replyComposerFocusTicks, setReplyComposerFocusTicks] = useState<Record<string, number>>({})
  const [activeReplyComposerId, setActiveReplyComposerId] = useState<string | null>(null)
  const [activeReplyAnchorId, setActiveReplyAnchorId] = useState<string | null>(null)
  const [activeReplyParentId, setActiveReplyParentId] = useState<string | null>(null)
  const [replyComposerDraftState, setReplyComposerDraftState] = useState<Record<string, boolean>>({})
  const [canCommentModal, setCanCommentModal] = useState<boolean>(false)

  // Inline editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editImages, setEditImages] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Image modal state
  const [selectedImage, setSelectedImage] = useState<{ url: string; index: number } | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Bottom composer state
  const [bottomComment, setBottomComment] = useState('')
  const [isBottomComposerActive, setIsBottomComposerActive] = useState(false)
  const [composerFocusTick, setComposerFocusTick] = useState(0)
  const [modalComposerFocusTick, setModalComposerFocusTick] = useState(0)
  const bottomComposerRef = useRef<HTMLTextAreaElement>(null)
  const toastRef = useRef(toast)
  const MAX_COMMENT_CHARS = 25000
  const MAX_COMPOSER_LINES = 9

  useEffect(() => {
    toastRef.current = toast
  }, [toast])

  // Display helpers for names/avatars
  const postOwnerName = userDetails?.name || post.user_name || 'User'
  const postOwnerAvatar = userDetails?.avatar_url || post.user_avatar_url
  // Use hooks for current user data
  const currentUserDisplayName =
    (user as any)?.name || (user as any)?.user_metadata?.full_name || (user as any)?.email || 'You'

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

  const focusModalComposer = useCallback(() => {
    setModalComposerFocusTick((t) => t + 1)
  }, [])

  const focusReplyComposer = useCallback(
    (commentId: string, anchorId?: string, parentId?: string) => {
      const targetAnchorId = anchorId || commentId
      const targetParentId = parentId || commentId

      setExpandedReplies((prev) => ({ ...prev, [commentId]: true }))

      let shouldOpenTarget = true
      if (
        activeReplyComposerId &&
        (activeReplyComposerId !== commentId || activeReplyAnchorId !== targetAnchorId) &&
        replyComposerDraftState[activeReplyComposerId]
      ) {
        const shouldDiscardDraft = window.confirm(
          "You haven't submitted your current reply. Closing it will remove the unsent reply. Continue?"
        )

        if (!shouldDiscardDraft) {
          shouldOpenTarget = false
        } else {
          setReplyComposerDraftState((prev) => ({ ...prev, [activeReplyComposerId]: false }))
        }
      }

      if (!shouldOpenTarget) {
        return
      }

      setReplyComposerFocusTicks((prev) => ({
        ...prev,
        [commentId]: (prev[commentId] || 0) + 1,
      }))
      setActiveReplyComposerId(commentId)
      setActiveReplyAnchorId(targetAnchorId)
      setActiveReplyParentId(targetParentId)
    },
    [activeReplyAnchorId, activeReplyComposerId, replyComposerDraftState]
  )

  const handleReplyComposerClosed = useCallback((commentId: string) => {
    setReplyComposerDraftState((prev) => {
      if (!prev[commentId]) {
        return prev
      }

      return { ...prev, [commentId]: false }
    })
    setActiveReplyComposerId((prev) => (prev === commentId ? null : prev))
    setActiveReplyAnchorId((prev) => (activeReplyComposerId === commentId ? null : prev))
    setActiveReplyParentId((prev) => (activeReplyComposerId === commentId ? null : prev))
  }, [activeReplyComposerId])

  const handleReplyDraftStateChange = useCallback((commentId: string, hasDraft: boolean) => {
    setReplyComposerDraftState((prev) => {
      if (prev[commentId] === hasDraft) {
        return prev
      }

      return { ...prev, [commentId]: hasDraft }
    })
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

      const response = await fetch(
        `/api/comments?entity_id=${post.id}&entity_type=${engagementEntityType}`,
        {
          signal: AbortSignal.timeout(30000), // 30 second timeout
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('🔍 FeedCard: Comments API response:', data)

        if (data.data && Array.isArray(data.data)) {
          console.log('🔍 FeedCard: Setting comments:', data.data)
          setComments(data.data)
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
        toastRef.current({
          title: 'Timeout',
          description: 'Loading comments took too long. Please try again.',
          variant: 'destructive',
        })
      }
      setComments([])
    } finally {
      setIsLoadingComments(false)
    }
  }, [post.id, engagementEntityType])

  const handleCommentSubmitted = useCallback(() => {
    if (onPostUpdated) {
      onPostUpdated({
        ...post,
        comment_count: (post.comment_count || 0) + 1,
      })
    }
    fetchComments()
  }, [fetchComments, onPostUpdated, post])

  const submitBottomComment = useCallback(async () => {
    const text = bottomComment.trim()
    if (!text) return
    if (text.length > MAX_COMMENT_CHARS) return

    try {
      setIsSaving(true)

      // Use the global context's addComment which handles:
      // 1. Authentication check
      // 2. API call to /api/engagement/comment
      // 3. Optimistic count update (INCREMENT_COUNT)
      // 4. Toast notifications
      const success = await addComment(post.id, engagementEntityType, text)

      if (success) {
        setBottomComment('')
        setIsBottomComposerActive(false)

        if (onPostUpdated) {
          const updatedPost = { ...post, comment_count: (post.comment_count || 0) + 1 }
          onPostUpdated(updatedPost)
        }

        // Add a small delay to ensure the database transaction is committed
        await new Promise((resolve) => setTimeout(resolve, 500))
        fetchComments()
      }
    } catch (e) {
      console.error('Failed to submit comment', e)
    } finally {
      setIsSaving(false)
    }
  }, [bottomComment, post.id, engagementEntityType, onPostUpdated, fetchComments, addComment])

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

      const response = await fetch(
        `/api/engagement?entity_id=${post.id}&entity_type=${engagementEntityType}`
      )

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

  // Initialize edit content from post data, but avoid state updates when values are unchanged
  useEffect(() => {
    const nextContent = getPostText(post)
    const nextImages = getPostImages(post)

    setEditContent((prev) => (prev === nextContent ? prev : nextContent))
    setEditImages((prev) => {
      const sameLength = prev.length === nextImages.length
      const sameValues = sameLength && prev.every((value, index) => value === nextImages[index])
      return sameValues ? prev : nextImages
    })
  }, [post.id, post.text, post.data, post.image_url, post.content_type])

  // When engagement context updates (e.g. after reaction), notify parent so list/cache stays in sync
  const engagement = showActions ? getEngagement(post.id, engagementEntityType) : null
  const prevEngagementRef = useRef<{ reactionCount: number; userReaction: string | null } | null>(null)
  useEffect(() => {
    if (!onPostUpdated || !engagement) return
    const next = { reactionCount: engagement.reactionCount, userReaction: engagement.userReaction }
    const prev = prevEngagementRef.current
    prevEngagementRef.current = next
    if (prev != null && (prev.reactionCount !== next.reactionCount || prev.userReaction !== next.userReaction)) {
      onPostUpdated({
        ...post,
        like_count: next.reactionCount,
        user_reaction_type: next.userReaction ?? undefined,
        user_has_reacted: !!next.userReaction,
      })
    }
  }, [engagement?.reactionCount, engagement?.userReaction, onPostUpdated, post])

  // Debug post data changes
  useEffect(() => {
    if (post) {
      console.log('🔍 Post data updated in EntityFeedCard:', {
        postId: post.id,
        like_count: post.like_count,
        comment_count: post.comment_count,
        share_count: post.share_count,
        user_has_reacted: post.user_has_reacted,
        calculatedEngagement:
          (post.like_count || 0) + (post.comment_count || 0) + (post.share_count || 0),
      })
    }
  }, [post?.like_count, post?.comment_count, post?.share_count, post?.user_has_reacted])

  // Content type configurations
  const contentTypeConfigs = {
    text: {
      icon: MessageSquare,
      label: 'Text Post',
      color: 'bg-app-theme-blue/10 text-blue-800',
    },
    photo: {
      icon: ImageIcon,
      label: 'Photo Post',
      color: 'bg-green-100 text-green-800',
    },
    video: {
      icon: Video,
      label: 'Video Post',
      color: 'bg-purple-100 text-purple-800',
    },
    link: {
      icon: ExternalLink,
      label: 'Link Post',
      color: 'bg-orange-100 text-orange-800',
    },
    poll: {
      icon: HashIcon,
      label: 'Poll Post',
      color: 'bg-pink-100 text-pink-800',
    },
    review: {
      icon: StarIcon,
      label: 'Review Post',
      color: 'bg-yellow-100 text-yellow-800',
    },
    article: {
      icon: BookOpen,
      label: 'Article Post',
      color: 'bg-indigo-100 text-indigo-800',
    },
  }

  // Entity type configurations
  const entityTypeConfigs = {
    user: { icon: User, label: 'User Post', color: 'bg-app-theme-blue/10 text-blue-800' },
    book: { icon: BookOpen, label: 'Book Post', color: 'bg-green-100 text-green-800' },
    author: { icon: Building, label: 'Author Post', color: 'bg-purple-100 text-purple-800' },
    publisher: { icon: Building, label: 'Publisher Post', color: 'bg-orange-100 text-orange-800' },
    group: { icon: Users2, label: 'Group Post', color: 'bg-indigo-100 text-indigo-800' },
  }

  // Visibility configurations
  const visibilityConfigs = {
    public: { icon: Globe, label: 'Public', color: 'text-green-600' },
    private: { icon: Lock, label: 'Private', color: 'text-red-600' },
    friends: { icon: Users, label: 'Friends', color: 'text-app-theme-blue' },
    followers: { icon: Users2, label: 'Followers', color: 'text-purple-600' },
    custom: { icon: Eye, label: 'Custom', color: 'text-orange-600' },
  }

  // Content safety configurations
  const safetyConfigs = {
    high: { icon: Shield, label: 'Safe', color: 'text-green-600', bgColor: 'bg-green-50' },
    medium: {
      icon: AlertTriangle,
      label: 'Caution',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    low: { icon: Flag, label: 'Flagged', color: 'text-red-600', bgColor: 'bg-red-50' },
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

    return 'Shared an update'
  }

  const getPostImages = (post: any): string[] => {
    // PRIORITY 1: Check for direct image_url column (from current schema)
    if (post.image_url && post.image_url.trim() !== '') {
      return post.image_url
        .split(',')
        .map((url: string) => url.trim())
        .filter(Boolean)
    }

    // PRIORITY 2: Check for images in data JSONB field
    if (post.data?.images) {
      return Array.isArray(post.data.images) ? post.data.images : [post.data.images]
    }

    if (post.data?.image_url && post.data.image_url.trim() !== '') {
      return post.data.image_url
        .split(',')
        .map((url: string) => url.trim())
        .filter(Boolean)
    }

    // PRIORITY 3: Check for media_url in data
    if (post.data?.media_url && post.data.media_url.trim() !== '') {
      return post.data.media_url
        .split(',')
        .map((url: string) => url.trim())
        .filter(Boolean)
    }

    // PRIORITY 4: Check for nested content structure
    if (post.data?.content?.image_url && post.data.content.image_url.trim() !== '') {
      return post.data.content.image_url
        .split(',')
        .map((url: string) => url.trim())
        .filter(Boolean)
    }

    if (post.data?.content?.images) {
      return Array.isArray(post.data.content.images)
        ? post.data.content.images
        : [post.data.content.images]
    }

    // Note: post.data.data nesting doesn't exist in current schema, removed these checks

    return []
  }

  const getPostContentType = (post: any): string => {
    // Handle like activities specifically
    if (post.activity_type === 'like') {
      return 'like'
    }

    // Try to get content type from various possible locations
    if (post.content_type) {
      return post.content_type
    }
    // Note: post.content doesn't exist in current schema, removed this check
    if (post.data?.content_type) {
      return post.data.content_type
    }
    if (post.data?.type) {
      return post.data.type
    }
    // Note: post.data.content doesn't exist in current schema, removed this check

    // Note: post.data.data nesting doesn't exist in current schema, removed these checks

    // Infer from content
    const images = getPostImages(post)
    if (images.length > 0) {
      return 'image'
    }
    if (post.link_url || post.data?.link_url || post.data?.url) {
      return 'link'
    }

    // If we have text content, default to text
    if (post.text || post.data?.text) {
      return 'text'
    }

    return 'text'
  }

  const hasImageContent = (post: any): boolean => {
    return getPostImages(post).length > 0
  }

  const hasTextContent = (post: any): boolean => {
    const text = getPostText(post)
    return typeof text === 'string' && text.trim().length > 0
  }

  // Get display values using helper functions
  const displayText = getPostText(post)
  const displayImageUrl = getPostImages(post).join(',')
  const displayContentType = getPostContentType(post)

  // Handle image click for modal
  const handleImageClick = (url: string, index: number) => {
    console.log('Image clicked:', { url, index, postId: post.id })
    setSelectedImage({ url, index })
    setCurrentImageIndex(index) // Set current index for EnterprisePhotoViewer
    setShowImageModal(true)
  }

  // Close image modal
  const closeImageModal = () => {
    setShowImageModal(false)
    setSelectedImage(null)
    setCurrentImageIndex(0) // Reset current index
  }

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
            setEditImages((prev) => [...prev, ...newImages])
          }
        }
        reader.readAsDataURL(file)
      }
    }
  }

  // Handle image removal
  const handleRemoveImage = (index: number) => {
    setEditImages((prev) => prev.filter((_, i) => i !== index))
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
        title: 'Error',
        description: 'Post content cannot be empty',
        variant: 'destructive',
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
        image_url: editImages.join(','),
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
          image_url: editImages.join(','),
        }),
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
        updated_at: updatedActivity.updated_at,
      })

      setIsEditing(false)
      toast({
        title: 'Success',
        description: 'Post updated successfully',
      })
    } catch (error) {
      console.error('Error updating post:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update post',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleVisibilityChange = async (nextVisibility: string) => {
    if (!nextVisibility || nextVisibility === post.visibility) return
    setIsUpdatingVisibility(true)
    try {
      const response = await fetch('/api/activities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: post.id,
          visibility: nextVisibility,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to update visibility')
      }

      const responseData = await response.json()
      const updatedActivity = responseData.activity || responseData

      if (onPostUpdated) {
        onPostUpdated(updatedActivity)
      }

      Object.assign(post, { visibility: nextVisibility })
      setCurrentVisibility(nextVisibility)
      toast({
        title: 'Visibility updated',
        description: `Post is now ${nextVisibility}.`,
      })
    } catch (error) {
      console.error('Error updating visibility:', error)
      toast({
        title: 'Error',
        description: 'Failed to update post visibility. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingVisibility(false)
    }
  }

  // Handle delete post
  const handleDeletePost = async () => {
    if (isDeleting) return // Prevent double-clicks

    // Validate post ID
    if (!post?.id) {
      console.error('❌ Cannot delete: Post ID is missing')
      toast({
        title: 'Error',
        description: 'Post ID is missing. Cannot delete post.',
        variant: 'destructive',
      })
      return
    }

    console.log('🗑️ Delete button clicked!')
    setIsDeleting(true)

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
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ id: post.id }),
      })

      console.log('Delete response status:', response.status)
      console.log('Delete response ok:', response.ok)

      // Parse response body - handle both success and error cases
      let responseData: any = {}
      try {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json()
        } else {
          const responseText = await response.text()
          if (responseText) {
            try {
              responseData = JSON.parse(responseText)
            } catch {
              responseData = { error: responseText || 'Unknown error' }
            }
          }
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError)
        responseData = { error: 'Failed to parse server response' }
      }

      if (!response.ok) {
        console.error('Delete error response status:', response.status)
        console.error('Delete error response body:', responseData)
        const errorMessage = responseData.error || responseData.message || `Failed to delete post (${response.status})`
        throw new Error(errorMessage)
      }

      // Check for success in response
      if (responseData.success === true || (responseData.success !== false && !responseData.error)) {
        console.log('✅ Post deleted successfully')

        // Call the callback to remove post from UI
        if (onPostDeleted) {
          console.log('Calling onPostDeleted callback with post ID:', post.id)
          onPostDeleted(post.id)
        } else {
          console.warn('⚠️ onPostDeleted callback not provided - post may not be removed from UI')
        }

        toast({
          title: 'Success',
          description: responseData.message || 'Post deleted successfully',
        })
      } else {
        const errorMessage = responseData.error || responseData.message || 'Failed to delete post'
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('❌ Error deleting post:', error)

      // Handle network errors specifically
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast({
          title: 'Network Error',
          description: 'Unable to connect to the server. Please check your internet connection.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to delete post',
          variant: 'destructive',
        })
      }
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
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
        share_count: post.share_count,
      })

      // Use the engagement data directly from the post
      setEngagementData({
        likes: [], // Individual likes not stored separately anymore
        comments: [], // Individual comments not stored separately anymore
        shares: [],
        bookmarks: [],
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
        const resp = await fetch(
          `/api/engagement/can-comment?entity_id=${post.id}&entity_type=${'post'}`
        )
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
    return () => {
      cancelled = true
    }
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
    if (!post.metadata?.content_safety_score || post.metadata.content_safety_score >= 0.8)
      return null

    const safetyLevel = getContentSafetyLevel(post.metadata.content_safety_score)
    const config = safetyConfigs[safetyLevel]

    return (
      <div className={cn('p-3 rounded-lg mb-4 flex items-center gap-2', config.bgColor)}>
        <config.icon className={cn('h-4 w-4', config.color)} />
        <span className={cn('text-sm font-medium', config.color)}>
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
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center transition-colors hover:border-blue-400"
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
                  <p className="text-xs text-gray-500 mt-1">
                    Supports JPG, PNG, GIF up to 10MB each
                  </p>
                </label>
              </div>
            )}

            {/* Image Grid with Drag & Drop */}
            {editImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {editImages.map((image, index) => (
                  <div
                    key={index}
                    className={`relative group cursor-move ${dragIndex === index ? 'opacity-50' : ''
                      } ${dragOverIndex === index ? 'ring-2 ring-blue-500' : ''}`}
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
              <Button variant="outline" size="sm" onClick={handleEditToggle} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={isSaving || !editContent.trim()}>
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

    // Handle both old and new post structures
    // Old posts: direct text, image_url fields
    // New posts: content object with content_type
    const displayText = getPostText(post)
    const displayImageUrl = getPostImages(post)
    const displayContentType = getPostContentType(post)

    if (!hasTextContent(post) && !hasImageContent(post)) {
      return (
        <div className="enterprise-feed-card-no-content">
          <p className="text-muted-foreground">No content available</p>
        </div>
      )
    }

    // Special check for posts that have images but wrong content_type
    // Auto-correct content type if post has images but wrong content_type
    // (no action needed, effectiveContentType handles this below)

    const content = { text: post.text || post.data?.text || '' } as PostContent

    // Extract link from text if no explicit link_url
    let detectedLink: string | null = null
    if (!post.link_url && !content.links?.length && displayText) {
      const extracted = extractFirstLink(displayText)
      if (extracted) {
        detectedLink = extracted.url
      }
    }

    // Check if post has link_url or detected link - if so, treat as link post
    const hasLinkUrl = !!(post.link_url || content.links?.length || detectedLink)
    const effectiveContentType = hasLinkUrl && displayContentType !== 'image' ? 'link' : displayContentType

    switch (effectiveContentType) {
      case 'text':
        return (
          <div className="enterprise-feed-card-text-content">
            <div className="enterprise-feed-card-text prose prose-sm max-w-none">
              <div className="enterprise-feed-card-text-preview">
                {displayText ? (
                  <TaggedTextRenderer
                    text={displayText}
                    showPreviews={true}
                    className="text-foreground"
                  />
                ) : (
                  <div className="text-muted-foreground">No text content available</div>
                )}
              </div>
            </div>
          </div>
        )

      case 'image':
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
          is_featured: false,
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
                <TaggedTextRenderer
                  text={displayText}
                  showPreviews={true}
                  className="text-sm text-muted-foreground"
                />
              </div>
            )}
          </div>
        )

      case 'video':
        return (
          <div className="enterprise-feed-card-video-content">
            {content.media_files && content.media_files.find((m) => m.type === 'video') && (
              <video
                src={content.media_files.find((m) => m.type === 'video')?.url}
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
                        : 'liked a post'}
                    </span>
                  </div>
                </div>

                {/* Show recent likers if aggregated */}
                {post.metadata?.recent_likers && post.metadata.recent_likers.length > 1 && (
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-xs text-muted-foreground">Recent likers:</span>
                    {post.metadata.recent_likers.slice(0, 3).map((liker: string, index: number) => (
                      <span key={index} className="text-xs font-medium text-app-theme-blue">
                        {liker}
                        {index < Math.min(2, post.metadata.recent_likers.length - 1) ? ', ' : ''}
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
                  <div className="bg-white p-3 rounded-sm border-l-4 border-blue-300">
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
                      className="w-16 h-16 object-cover rounded-sm border"
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
                    <p className="text-sm text-muted-foreground">
                      by {content.book_details.author}
                    </p>
                  )}
                </div>
              )}
              {content.book_details?.rating && (
                <div className="enterprise-feed-card-rating flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={cn(
                        'h-4 w-4',
                        star <= (content.book_details!.rating || 0)
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300'
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
                        <div
                          dangerouslySetInnerHTML={{
                            __html: content.book_details.review.substring(0, 300),
                          }}
                        />
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
                          title: 'Vote Cast',
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
        // Collect all links: from content.links, post.link_url, or detected from text
        const allLinks: Array<{ url: string; metadata?: any }> = []

        // Add links from content.links array
        if (content.links && content.links.length > 0) {
          content.links.forEach((link) => {
            allLinks.push({
              url: link.url,
              metadata: link.preview_metadata,
            })
          })
        }

        // Add link_url if not already in links
        if (post.link_url && !allLinks.some((l) => l.url === post.link_url)) {
          allLinks.push({ url: post.link_url })
        }

        // Add detected link if not already present
        if (detectedLink && !allLinks.some((l) => l.url === detectedLink)) {
          allLinks.push({ url: detectedLink })
        }

        // Extract text without the link URLs for caption
        let captionText = content.text || displayText || ''
        allLinks.forEach((link) => {
          if (captionText.includes(link.url)) {
            captionText = captionText.replace(link.url, '').trim()
          }
        })

        // If no links found, return null
        if (allLinks.length === 0) {
          return (
            <div className="enterprise-feed-card-link-content">
              <TaggedTextRenderer
                text={displayText}
                showPreviews={true}
                className="text-sm text-muted-foreground"
              />
            </div>
          )
        }

        return (
          <div className="enterprise-feed-card-link-content space-y-3">
            {/* Post caption/text above link preview (only if there's text beyond the URLs) */}
            {captionText && captionText.length > 0 && (
              <div className="enterprise-feed-card-link-caption">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{captionText}</p>
              </div>
            )}

            {/* Multiple links - use MultipleLinkPreview component */}
            {allLinks.length > 1 ? (
              <MultipleLinkPreview
                links={allLinks}
                layout="carousel"
                maxVisible={3}
                className="enterprise-feed-card-link-preview"
              />
            ) : (
              /* Single link - use EnterpriseLinkPreviewCard */
              allLinks[0] && (
                <EnterpriseLinkPreviewCard
                  url={allLinks[0].url}
                  metadata={allLinks[0].metadata}
                  layout="horizontal"
                  showImage={true}
                  showDescription={true}
                  showSiteName={true}
                  showSecurityBadge={true}
                  trackAnalytics={true}
                  className="enterprise-feed-card-link-preview"
                />
              )
            )}
          </div>
        )

      default:
        return (
          <div className="enterprise-feed-card-default-content">
            <TaggedTextRenderer
              text={displayText}
              showPreviews={true}
              className="text-sm text-muted-foreground"
            />
          </div>
        )
    }
  }

  // Render engagement stats
  const renderEngagementStats = () => {
    if (!showEngagement) return null

    return (
      <div className="px-2 py-2 border-t border-gray-50 bg-gray-50/30">
        <EngagementDisplay
          entityId={post.id}
          entityType={engagementEntityType}
          reactionCount={post.like_count || 0}
          commentCount={post.comment_count || 0}
          userReactionType={post.user_reaction_type}
          onReactionsClick={() => setShowLikesModal(true)}
          onCommentsClick={() => setShowCommentsModal(true)}
          onUserClick={(userId) => {
            console.log('Navigate to user profile:', userId)
          }}
          showReactionTypes={false}
          maxPreviewItems={20}
          showAddFriendButtons={true}
        />
      </div>
    )
  }

  // Render tags
  const renderTags = () => {
    if (!post.tags || post.tags.length === 0) return null

    return (
      <div className="enterprise-feed-card-tags flex flex-wrap gap-1.5 px-4 mb-3">
        {post.tags.map((tag: string) => (
          <Badge key={tag} variant="secondary" className="enterprise-feed-card-tag bg-blue-50/50 hover:bg-app-theme-blue/10 text-app-theme-blue border-none text-[10px] font-medium px-2 py-0.5 transition-colors cursor-pointer rounded-full">
            #{tag}
          </Badge>
        ))}
      </div>
    )
  }

  const currentContentConfig =
    contentTypeConfigs[getPostContentType(post) as keyof typeof contentTypeConfigs]
  const currentEntityConfig = entityTypeConfigs[post.entity_type as keyof typeof entityTypeConfigs]
  useEffect(() => {
    setCurrentVisibility(post.visibility)
  }, [post.visibility])

  const currentVisibilityConfig =
    visibilityConfigs[currentVisibility as keyof typeof visibilityConfigs]
  const contentSafetyLevel = getContentSafetyLevel(post.metadata?.content_safety_score || 1)
  const currentSafetyConfig = safetyConfigs[contentSafetyLevel]

  return (
    <div className="rounded-xl border border-gray-100 bg-white text-card-foreground shadow-sm hover:shadow-md transition-all duration-300 enterprise-feed-card enterprise-timeline-feed-card mb-4">
      <div className="flex flex-col space-y-1.5 p-2 enterprise-feed-card-header">
        <div className="enterprise-feed-card-header-content flex items-start gap-3">
          {/* User Avatar */}
          <EntityHoverCard
            type="user"
            entity={{
              id: post.user_id,
              name: postOwnerName,
              avatar_url: postOwnerAvatar,
            }}
            userStats={
              profileOwnerId && post.user_id === profileOwnerId ? profileOwnerUserStats : undefined
            }
          >
            <div className="avatar-container relative w-10 h-10 overflow-hidden rounded-full border-2 border-white shadow-md enterprise-feed-card-user-avatar cursor-pointer transition-transform hover:scale-105">
              <Avatar
                src={postOwnerAvatar}
                alt={postOwnerName || 'User'}
                name={postOwnerName}
                size="sm"
                className="object-cover rounded-full"
              />
            </div>
          </EntityHoverCard>

          {/* Post Header Info */}
          <div className="enterprise-feed-card-header-info flex-1">
            <div className="enterprise-feed-card-header-top flex items-center gap-2 mb-1">
              <EntityName
                type="user"
                id={post.user_id}
                name={postOwnerName}
                avatar_url={postOwnerAvatar}
                className="enterprise-feed-card-user-name font-semibold text-sm"
                userStats={
                  profileOwnerId && post.user_id === profileOwnerId
                    ? profileOwnerUserStats
                    : undefined
                }
              />

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
                    'enterprise-feed-card-safety',
                    currentSafetyConfig.bgColor,
                    currentSafetyConfig.color
                  )}
                >
                  <currentSafetyConfig.icon className="h-3.5 w-3.5 mr-1.5" />
                  {currentSafetyConfig.label}
                </Badge>
              )}

              {/* Cross-post Badge */}
              {post.metadata?.cross_post && (
                <Badge variant="secondary" className="enterprise-feed-card-cross-post">
                  <Share2 className="h-3.5 w-3.5 mr-1.5" />
                  Cross-posted from{' '}
                  {post.metadata.cross_post.origin_entity_type
                    ? post.metadata.cross_post.origin_entity_type.charAt(0).toUpperCase() +
                    post.metadata.cross_post.origin_entity_type.slice(1)
                    : 'another timeline'}
                </Badge>
              )}

              {/* Visibility Badge / Control */}
              {currentVisibilityConfig &&
                (canEdit ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        title={currentVisibilityConfig.label}
                        className="h-8 w-8 p-0 enterprise-feed-card-visibility rounded-full hover:bg-gray-100 transition-colors"
                        disabled={isUpdatingVisibility}
                      >
                        <currentVisibilityConfig.icon className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => handleVisibilityChange('public')}>
                        <Globe className="h-3.5 w-3.5 mr-2" />
                        Public
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleVisibilityChange('friends')}>
                        <Users className="h-3.5 w-3.5 mr-2" />
                        Friends
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleVisibilityChange('followers')}>
                        <Users2 className="h-3.5 w-3.5 mr-2" />
                        Followers
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleVisibilityChange('private')}>
                        <Lock className="h-3.5 w-3.5 mr-2" />
                        Only me
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div
                    title={currentVisibilityConfig.label}
                    className="h-8 w-8 flex items-center justify-center enterprise-feed-card-visibility text-muted-foreground"
                  >
                    <currentVisibilityConfig.icon className="h-3.5 w-3.5" />
                  </div>
                ))}

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
                  minute: 'numeric',
                })}
              </span>

              {/* Scheduled Post */}
              {post.scheduled_at && (
                <span className="enterprise-feed-card-scheduled flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Scheduled for{' '}
                  {new Date(post.scheduled_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  })}
                </span>
              )}

              {/* Featured Post */}
              {post.is_featured && (
                <span className="enterprise-feed-card-featured flex items-center gap-1.5 text-amber-600 font-medium">
                  <StarIcon className="h-3.5 w-3.5 fill-amber-600" />
                  Featured
                </span>
              )}

              {/* Pinned Post */}
              {post.is_pinned && (
                <span className="enterprise-feed-card-pinned flex items-center gap-1.5 text-app-theme-blue font-medium">
                  <Bookmark className="h-3.5 w-3.5 fill-blue-600" />
                  Pinned
                </span>
              )}

              {/* Verified Post */}
              {post.is_verified && (
                <span className="enterprise-feed-card-verified flex items-center gap-1.5 text-emerald-600 font-medium">
                  <CheckCircle className="h-3.5 w-3.5 fill-emerald-600" />
                  Verified
                </span>
              )}

            </div>
          </div>

          {/* Post Actions Menu */}
          <div className="enterprise-feed-card-actions">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 rounded-full hover:bg-gray-100 transition-all duration-200"
                >
                  <MoreHorizontal className="h-5 w-5 text-gray-500" />
                  <span className="sr-only">Open actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 p-1.5">
                {canEdit && (
                  <DropdownMenuItem
                    onClick={handleEditToggle}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors focus:bg-gray-100 rounded-md"
                  >
                    <Edit className="h-4 w-4 text-app-theme-blue" />
                    <span className="font-medium">Edit Post</span>
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors focus:bg-red-50 text-red-600 rounded-md mt-0.5"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="font-medium">Delete Post</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="my-1.5" />
                <DropdownMenuItem
                  className="flex items-center gap-2 px-3 py-2 cursor-default text-gray-500 rounded-md"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="p-2 pt-0 enterprise-feed-card-content">
        {/* Content Warnings */}
        {renderContentWarnings()}

        {/* Main Content */}
        <div className="enterprise-feed-card-main-content px-2 py-2">{renderContent()}</div>

        {/* Tags */}
        {renderTags()}

        {/* Engagement Stats */}
        {renderEngagementStats()}

        {/* Engagement Actions - Keep only the action buttons, remove duplicate stats */}
        {showActions && (
          <div className="enterprise-feed-card-engagement-actions px-2 pb-2">
            <EnterpriseEngagementActions
              entityId={post.id}
              entityType={engagementEntityType}
              initialEngagementCount={
                post.like_count + post.comment_count + (post.share_count || 0)
              }
              commentCount={post.comment_count || 0}
              shareCount={post.share_count || 0}
              bookmarkCount={post.bookmark_count || 0}
              viewCount={post.view_count || 0}
              isLiked={post.is_liked}
              isCommented={post.user_has_commented}
              isShared={post.user_has_shared}
              isBookmarked={post.user_has_bookmarked}
              isViewed={post.user_has_viewed}
              currentReaction={(post.user_reaction_type as ReactionType | null) || null}
              showReactionSummary={false}
              onEngagement={async (
                action: 'reaction' | 'comment' | 'share' | 'bookmark' | 'view',
                entityId: string,
                entityType: string,
                reactionType?: any
              ) => {
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
                  comments: [newComment, ...prev.comments],
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
                className="text-sm text-gray-600 font-medium mb-2 hover-app-theme view-more-comments"
              >
                View more comments
              </button>
            )}

            {(() => {
              const first = comments[0]
              if (!first) return null

              const previewComments: ReusableCommentNode[] = [
                {
                  id: first.id,
                  commentText: first.comment_text || '',
                  createdAt: first.created_at,
                  replyCount: first.reply_count || 0,
                  user: {
                    id: first.user?.id,
                    name: first.user?.name || 'User',
                    avatarUrl: first.user?.avatar_url,
                  },
                  replies: Array.isArray(first.replies)
                    ? first.replies.slice(0, 1).map((reply: any) => ({
                        id: reply.id,
                        commentText: reply.comment_text || '',
                        createdAt: reply.created_at,
                        user: {
                          id: reply.user?.id,
                          name: reply.user?.name || 'User',
                          avatarUrl: reply.user?.avatar_url,
                        },
                      }))
                    : [],
                },
              ]

              return (
                <ReusableCommentThread
                  comments={previewComments}
                  layoutPreset="preview"
                  maxRootItems={1}
                  maxRepliesPerRoot={1}
                  expandedReplies={{ [first.id]: true }}
                  rootActionOptions={{
                    className: 'gap-4',
                    showLike: false,
                    showReply: false,
                  }}
                  replyActionOptions={{
                    textSize: 'text-[11px]',
                    showLike: false,
                    showReply: false,
                  }}
                  timestampFormatter={(comment) => formatTimeAgo(comment.createdAt)}
                  renderCommentText={(comment, depth) => {
                    if (depth === 0) {
                      return (
                        <>
                          <div ref={firstCommentTextRef}>
                            <TaggedTextRenderer
                              text={comment.commentText || ''}
                              showPreviews={true}
                              renderMediaUrls={true}
                              textClassName="text-sm text-gray-800 leading-relaxed line-clamp-5"
                            />
                          </div>
                          {isFirstCommentClamped && (
                            <button
                              onClick={() => setShowCommentsModal(true)}
                              className="mt-1 text-xs font-medium text-gray-600 hover:underline"
                            >
                              View more
                            </button>
                          )}
                        </>
                      )
                    }

                    return (
                      <TaggedTextRenderer
                        text={comment.commentText || ''}
                        showPreviews={true}
                        renderMediaUrls={true}
                        textClassName="text-xs text-gray-800 leading-relaxed"
                      />
                    )
                  }}
                  onReplyClick={(comment, rootComment) => {
                    if (comment.id !== rootComment.id) {
                      focusReplyComposer(rootComment.id, comment.id, comment.id)
                    }
                  }}
                  renderRootTrailing={() => (
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
                                body: JSON.stringify({ comment_id: first.id }),
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
                                body: JSON.stringify({ user_id: first.user?.id }),
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
                                    body: JSON.stringify({ user_id: first.user?.id }),
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
                                    body: JSON.stringify({ user_id: first.user?.id }),
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
                                body: JSON.stringify({ user_id: first.user?.id }),
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
                                body: JSON.stringify({
                                  target_type: 'comment',
                                  target_id: first.id,
                                }),
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
                  )}
                  renderReplyAfterActions={(replyComment, rootComment) => {
                    if (activeReplyComposerId !== rootComment.id || activeReplyAnchorId !== replyComment.id) {
                      return null
                    }

                    return (
                      <div className="mt-2">
                        <EntityCommentComposer
                          entityId={post.id}
                          entityType={engagementEntityType}
                          currentUserId={user?.id}
                          currentUserName={currentUserDisplayName}
                          focusControl={replyComposerFocusTicks[rootComment.id] || 0}
                          parentCommentId={activeReplyParentId || replyComment.id}
                          placeholder={`Reply to ${replyComment.user?.name || 'reply'}`}
                          onDraftStateChange={(hasDraft) =>
                            handleReplyDraftStateChange(rootComment.id, hasDraft)
                          }
                          onClosed={() => handleReplyComposerClosed(rootComment.id)}
                          onSubmitted={handleCommentSubmitted}
                        />
                      </div>
                    )
                  }}
                />
              )
            })()}
          </div>
        )}

        {/* Bottom comment composer (only for authenticated users) */}
        {user && (
          <div className="enterprise-feed-card-comment-composer mt-3">
          <EntityCommentComposer
            entityId={post.id}
            entityType={engagementEntityType}
            currentUserId={user?.id}
            currentUserName={currentUserDisplayName}
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
            onSubmitted={handleCommentSubmitted}
          />
        </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <EnterprisePhotoViewer
          isOpen={showImageModal}
          onClose={closeImageModal}
          photos={
            post.image_url
              ? post.image_url.split(',').map((url: string, index: number) => ({
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
                  user_name: post.user_name,
                },
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
                is_featured: false,
                user: {
                  name: post.user_name || 'User',
                  avatar_url: post.user_avatar_url,
                },
              }))
              : []
          }
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
        entityType={'post'}
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

      {/* Detailed Feed Card Modal with Comments */}
      <ReusableModal
        open={showCommentsModal}
        onOpenChange={(open: boolean) => setShowCommentsModal(open)}
        title={`${postOwnerName}'s Post`}
        description="Join the conversation about this content"
        contentClassName="max-w-2xl max-h-[90vh]"
        footer={
          canCommentModal && user ? (
            <div className="w-full">
              <EntityCommentComposer
                entityId={post.id}
                entityType={engagementEntityType}
                currentUserId={user?.id}
                currentUserName={currentUserDisplayName}
                focusControl={modalComposerFocusTick}
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
                onSubmitted={handleCommentSubmitted}
              />
            </div>
          ) : (
            <div className="w-full text-center py-2 text-sm text-muted-foreground bg-gray-50 rounded-lg">
              Please <Button variant="link" className="p-0 h-auto font-semibold" onClick={() => window.location.href = '/login'}>sign in</Button> to join the conversation.
            </div>
          )
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col space-y-1.5 p-2 enterprise-feed-card-header">
            <div className="enterprise-feed-card-header-content flex items-start gap-3">
              {/* User Avatar */}
              <EntityHoverCard
                type="user"
                entity={{
                  id: post.user_id,
                  name: postOwnerName,
                  avatar_url: postOwnerAvatar,
                }}
                userStats={
                  profileOwnerId && post.user_id === profileOwnerId
                    ? profileOwnerUserStats
                    : undefined
                }
              >
                <div className="avatar-container relative w-10 h-10 overflow-hidden rounded-full border-2 border-white shadow-md enterprise-feed-card-user-avatar cursor-pointer transition-transform hover:scale-105">
                  <Avatar
                    src={postOwnerAvatar}
                    alt={postOwnerName || 'User'}
                    name={postOwnerName}
                    size="sm"
                    className="object-cover rounded-full"
                  />
                </div>
              </EntityHoverCard>

              {/* Post Header Info */}
              <div className="enterprise-feed-card-header-info flex-1">
                <div className="enterprise-feed-card-header-top flex items-center gap-2 mb-1">
                  <EntityName
                    type="user"
                    id={post.user_id}
                    name={postOwnerName}
                    avatar_url={postOwnerAvatar}
                    className="enterprise-feed-card-user-name font-semibold text-sm"
                    userStats={
                      profileOwnerId && post.user_id === profileOwnerId
                        ? profileOwnerUserStats
                        : undefined
                    }
                  />

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
                        'enterprise-feed-card-safety',
                        currentSafetyConfig.bgColor,
                        currentSafetyConfig.color
                      )}
                    >
                      <currentSafetyConfig.icon className="h-3.5 w-3.5 mr-1.5" />
                      {currentSafetyConfig.label}
                    </Badge>
                  )}

                  {/* Cross-post Badge */}
                  {post.metadata?.cross_post && (
                    <Badge variant="secondary" className="enterprise-feed-card-cross-post">
                      <Share2 className="h-3.5 w-3.5 mr-1.5" />
                      Cross-posted from{' '}
                      {post.metadata.cross_post.origin_entity_type
                        ? post.metadata.cross_post.origin_entity_type.charAt(0).toUpperCase() +
                          post.metadata.cross_post.origin_entity_type.slice(1)
                        : 'another timeline'}
                    </Badge>
                  )}

                  {/* Visibility Badge / Control */}
                  {currentVisibilityConfig &&
                    (canEdit ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            title={currentVisibilityConfig.label}
                            className="h-8 w-8 p-0 enterprise-feed-card-visibility rounded-full hover:bg-gray-100 transition-colors"
                            disabled={isUpdatingVisibility}
                          >
                            <currentVisibilityConfig.icon className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => handleVisibilityChange('public')}>
                            <Globe className="h-3.5 w-3.5 mr-2" />
                            Public
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVisibilityChange('friends')}>
                            <Users className="h-3.5 w-3.5 mr-2" />
                            Friends
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVisibilityChange('followers')}>
                            <Users2 className="h-3.5 w-3.5 mr-2" />
                            Followers
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVisibilityChange('private')}>
                            <Lock className="h-3.5 w-3.5 mr-2" />
                            Only me
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <div
                        title={currentVisibilityConfig.label}
                        className="h-8 w-8 flex items-center justify-center enterprise-feed-card-visibility text-muted-foreground"
                      >
                        <currentVisibilityConfig.icon className="h-3.5 w-3.5" />
                      </div>
                    ))}

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
                      minute: 'numeric',
                    })}
                  </span>

                  {/* Scheduled Post */}
                  {post.scheduled_at && (
                    <span className="enterprise-feed-card-scheduled flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Scheduled for{' '}
                      {new Date(post.scheduled_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                      })}
                    </span>
                  )}

                  {/* Featured Post */}
                  {post.is_featured && (
                    <span className="enterprise-feed-card-featured flex items-center gap-1.5 text-amber-600 font-medium">
                      <StarIcon className="h-3.5 w-3.5 fill-amber-600" />
                      Featured
                    </span>
                  )}

                  {/* Pinned Post */}
                  {post.is_pinned && (
                    <span className="enterprise-feed-card-pinned flex items-center gap-1.5 text-app-theme-blue font-medium">
                      <Bookmark className="h-3.5 w-3.5 fill-blue-600" />
                      Pinned
                    </span>
                  )}

                  {/* Verified Post */}
                  {post.is_verified && (
                    <span className="enterprise-feed-card-verified flex items-center gap-1.5 text-emerald-600 font-medium">
                      <CheckCircle className="h-3.5 w-3.5 fill-emerald-600" />
                      Verified
                    </span>
                  )}

                </div>
              </div>

              {/* Post Actions Menu */}
              <div className="enterprise-feed-card-actions">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-full hover:bg-gray-100 transition-all duration-200"
                    >
                      <MoreHorizontal className="h-5 w-5 text-gray-500" />
                      <span className="sr-only">Open actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 p-1.5">
                    {canEdit && (
                      <DropdownMenuItem
                        onClick={handleEditToggle}
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors focus:bg-gray-100 rounded-md"
                      >
                        <Edit className="h-4 w-4 text-app-theme-blue" />
                        <span className="font-medium">Edit Post</span>
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors focus:bg-red-50 text-red-600 rounded-md mt-0.5"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="font-medium">Delete Post</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="my-1.5" />
                    <DropdownMenuItem
                      className="flex items-center gap-2 px-3 py-2 cursor-default text-gray-500 rounded-md"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="p-2 pt-0 enterprise-feed-card-content">
            {/* Content Warnings */}
            {renderContentWarnings()}

            {/* Main Content */}
            <div className="enterprise-feed-card-main-content px-2 py-2">{renderContent()}</div>

            {/* Tags */}
            {renderTags()}

            {/* Engagement Stats */}
            {renderEngagementStats()}

            {/* Engagement Actions - Keep only the action buttons, remove duplicate stats */}
            {showActions && (
              <div className="enterprise-feed-card-engagement-actions px-2 pb-2">
                <EnterpriseEngagementActions
                  entityId={post.id}
                  entityType={engagementEntityType}
                  initialEngagementCount={
                    post.like_count + post.comment_count + (post.share_count || 0)
                  }
                  commentCount={post.comment_count || 0}
                  shareCount={post.share_count || 0}
                  bookmarkCount={post.bookmark_count || 0}
                  viewCount={post.view_count || 0}
                  isLiked={post.is_liked}
                  isCommented={post.user_has_commented}
                  isShared={post.user_has_shared}
                  isBookmarked={post.user_has_bookmarked}
                  isViewed={post.user_has_viewed}
                  currentReaction={(post.user_reaction_type as ReactionType | null) || null}
                  showReactionSummary={false}
                  onEngagement={async (
                    action: 'reaction' | 'comment' | 'share' | 'bookmark' | 'view',
                    entityId: string,
                    entityType: string,
                    reactionType?: any
                  ) => {
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
                      comments: [newComment, ...prev.comments],
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
                  onCommentClick={focusModalComposer}
                />
              </div>
            )}
          </div>

          {/* Comment Filter Bar */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {post.comment_count || 0} Comments
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="rounded-full h-7 text-xs gap-1">
                  {commentFilter === 'relevant' ? 'Most relevant' : 'All comments'}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuItem onClick={() => setCommentFilter('relevant')}>
                  <div>
                    <div className="font-medium">Most relevant</div>
                    <div className="text-xs text-gray-500">
                      Show friends' comments and the most engaging comments first.
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCommentFilter('all')}>
                  <div>
                    <div className="font-medium">All comments</div>
                    <div className="text-xs text-gray-500">
                      Show all comments, including potential spam.
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Comments List Section */}
          <div className="space-y-6 mt-4">
            {!isLoadingComments && comments.length > 0 ? (
              <div className="space-y-6">
                {(commentFilter === 'all' ? [...comments] : comments).map((comment) => (
                  <div key={comment.id} className="space-y-4">
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
                          <div className="flex items-center gap-2 mb-1">
                            <EntityName
                              type="user"
                              id={comment.user?.id}
                              name={comment.user?.name || 'Unknown User'}
                              avatar_url={comment.user?.avatar_url}
                              className="text-sm font-semibold text-gray-900"
                            />
                          </div>
                          <div className="text-sm text-gray-800 leading-relaxed">
                            <TaggedTextRenderer
                              text={comment.comment_text || ''}
                              showPreviews={true}
                              renderMediaUrls={true}
                              textClassName="text-sm text-gray-800 leading-relaxed"
                            />
                          </div>
                        </div>

                        {/* Comment Actions */}
                        <div className="flex items-center justify-between mt-1 ml-2">
                          <div className="flex items-center gap-4">
                            <CommentActionButtons
                              entityId={comment.id}
                              entityType="comment"
                              timestamp={formatTimeAgo(comment.created_at)}
                              onReplyClick={() => focusReplyComposer(comment.id, comment.id, comment.id)}
                              showLike={!!user}
                              showReply={!!user}
                            />
                            {comment.reply_count > 0 && (
                              <button
                                className="text-xs font-medium text-gray-500 hover-app-theme action-small-pad"
                                onClick={() =>
                                  setExpandedReplies((prev) => ({
                                    ...prev,
                                    [comment.id]: !prev[comment.id],
                                  }))
                                }
                              >
                                {expandedReplies[comment.id]
                                  ? 'Hide'
                                  : `Show ${comment.reply_count} replies`}
                              </button>
                            )}
                          </div>
                        </div>

                        {user &&
                          activeReplyComposerId === comment.id &&
                          activeReplyAnchorId === comment.id && (
                            <div className="pt-2">
                              <EntityCommentComposer
                                entityId={post.id}
                                entityType={engagementEntityType}
                                currentUserId={user?.id}
                                currentUserName={currentUserDisplayName}
                                focusControl={replyComposerFocusTicks[comment.id] || 0}
                                parentCommentId={activeReplyParentId || comment.id}
                                placeholder={`Reply to ${comment.user?.name || 'comment'}...`}
                                onDraftStateChange={(hasDraft) =>
                                  handleReplyDraftStateChange(comment.id, hasDraft)
                                }
                                onClosed={() => handleReplyComposerClosed(comment.id)}
                                onSubmitted={handleCommentSubmitted}
                                cancelButtonClassName="h-7 px-2 text-[10px]"
                                submitButtonClassName="h-7 px-3 text-[10px]"
                                textareaClassName="min-h-[32px] text-xs"
                              />
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Nested Replies Section */}
                    {(expandedReplies[comment.id] || !user) && (
                      <div className="space-y-4">
                        {comment.replies?.map((reply: any) => (
                          <div key={reply.id} className="ml-4 flex items-start gap-2">
                            <EntityAvatar
                              type="user"
                              id={reply.user?.id}
                              name={reply.user?.name || 'User'}
                              src={reply.user?.avatar_url}
                              size="xs"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="bg-gray-50 rounded-2xl px-3 py-2 inline-block max-w-full">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <EntityName
                                    type="user"
                                    id={reply.user?.id}
                                    name={reply.user?.name || 'Unknown User'}
                                    avatar_url={reply.user?.avatar_url}
                                    className="text-xs font-semibold text-gray-900"
                                  />
                                </div>
                                <div className="text-xs text-gray-800 leading-relaxed">
                                  <TaggedTextRenderer
                                    text={reply.comment_text || ''}
                                    showPreviews={true}
                                    renderMediaUrls={true}
                                    textClassName="text-xs text-gray-800 leading-relaxed"
                                  />
                                </div>
                              </div>

                              {/* Reply Actions */}
                              <div className="flex items-center">
                                <CommentActionButtons
                                  entityId={reply.id}
                                  entityType="comment"
                                  timestamp={formatTimeAgo(reply.created_at)}
                                  textSize="text-[11px]"
                                  onReplyClick={() =>
                                    focusReplyComposer(comment.id, reply.id, reply.id)
                                  }
                                  showLike={!!user}
                                  showReply={!!user}
                                />
                              </div>

                              {user &&
                                activeReplyComposerId === comment.id &&
                                activeReplyAnchorId === reply.id && (
                                  <div className="pt-2">
                                    <EntityCommentComposer
                                      entityId={post.id}
                                      entityType={engagementEntityType}
                                      currentUserId={user?.id}
                                      currentUserName={currentUserDisplayName}
                                      focusControl={replyComposerFocusTicks[comment.id] || 0}
                                      parentCommentId={activeReplyParentId || reply.id}
                                      placeholder={`Reply to ${reply.user?.name || 'reply'}...`}
                                      onDraftStateChange={(hasDraft) =>
                                        handleReplyDraftStateChange(comment.id, hasDraft)
                                      }
                                      onClosed={() => handleReplyComposerClosed(comment.id)}
                                      onSubmitted={handleCommentSubmitted}
                                      cancelButtonClassName="h-7 px-2 text-[10px]"
                                      submitButtonClassName="h-7 px-3 text-[10px]"
                                      textareaClassName="min-h-[32px] text-xs"
                                    />
                                  </div>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : isLoadingComments ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
                <p className="text-sm text-gray-500">Loading comments...</p>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <MessageCircle className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>
                <p className="text-gray-500">Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </div>
      </ReusableModal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
