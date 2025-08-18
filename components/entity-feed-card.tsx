'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Activity
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { BookCover } from '@/components/book-cover'
import { EntityHoverCard } from '@/components/entity-hover-cards'
import { EngagementActions } from '@/components/enterprise/engagement-actions'
import { SophisticatedPhotoGrid } from '@/components/photo-gallery/sophisticated-photo-grid'
import { EnterprisePhotoViewer } from '@/components/photo-gallery/enterprise-photo-viewer'
import { Post, PostContent, PostContentType, PostVisibility, PostPublishStatus } from '@/types/post'

export interface EntityFeedCardProps {
  post: Post
  entityDetails?: any
  userDetails?: any
  showActions?: boolean
  showComments?: boolean
  showEngagement?: boolean
  className?: string
  onPostUpdated?: (post: Post) => void
  onPostDeleted?: (postId: string) => void
}

// Legacy PostContent interface for backward compatibility
export interface LegacyPostContent {
  text?: string
  book_title?: string
  book_author?: string
  book_isbn?: string
  rating?: number
  review?: string
  poll_question?: string
  poll_options?: string[]
  link_url?: string
  link_title?: string
  link_description?: string
  article_title?: string
  article_summary?: string
  event_title?: string
  event_date?: string
  event_location?: string
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
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFullContent, setShowFullContent] = useState(false)
  const [engagementData, setEngagementData] = useState<any>({
    reactions: [],
    comments: [],
    shares: [],
    bookmarks: []
  })
  const [isLoadingEngagement, setIsLoadingEngagement] = useState(false)
  
  // Image modal state
  const [selectedImage, setSelectedImage] = useState<{url: string, index: number} | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

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
    user: {
      icon: User,
      label: 'User Profile',
      color: 'bg-gray-100 text-gray-800'
    },
    book: {
      icon: BookOpen,
      label: 'Book',
      color: 'bg-blue-100 text-blue-800'
    },
    author: {
      icon: User,
      label: 'Author',
      color: 'bg-green-100 text-green-800'
    },
    publisher: {
      icon: Building,
      label: 'Publisher',
      color: 'bg-purple-100 text-purple-800'
    },
    group: {
      icon: Users2,
      label: 'Group',
      color: 'bg-orange-100 text-orange-800'
    },
    event: {
      icon: CalendarDays,
      label: 'Event',
      color: 'bg-pink-100 text-pink-800'
    }
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

  // Get content summary
  const getContentSummary = (content: PostContent, contentType: string) => {
    if (contentType === 'text' && content.text) {
      return content.text.length > 200 ? content.text.substring(0, 200) + '...' : content.text
    }
    if (contentType === 'book' && content.book_details?.review) {
      return content.book_details.review.length > 200 ? content.book_details.review.substring(0, 300) + '...' : content.book_details.review
    }
    if (contentType === 'poll' && content.poll_question) {
      return `Poll: ${content.poll_question}`
    }
    if (contentType === 'link' && content.links?.[0]?.title) {
      return `Link: ${content.links[0].title}`
    }
    return 'Content post'
  }

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
    
    return date.toLocaleDateString()
  }

  // Render content based type
  const renderContent = () => {
    
    // Debug logging
    console.log('EntityFeedCard renderContent:', { 
      postId: post.id,
      contentType: post.content_type, 
      imageUrl: post.image_url,
      hasContent: !!post.content,
      contentText: post.content?.text,
      fullPost: JSON.stringify(post, null, 2)
    })
    
    if (!post.content || !post.content_type) {
      console.log('Missing content or content_type:', { 
        hasContent: !!post.content, 
        contentType: post.content_type,
        postId: post.id 
      })
      return (
        <div className="enterprise-feed-card-no-content">
          <p className="text-muted-foreground">No content available</p>
        </div>
      )
    }
    
    // Special check for posts that have images but wrong content_type
    if (post.image_url && post.content_type !== 'image') {
      console.log('Post has image but wrong content_type:', {
        postId: post.id,
        contentType: post.content_type,
        imageUrl: post.image_url,
        shouldBeImage: true
      })
    }

    const content = post.content as PostContent
    const contentType = post.content_type

    console.log('Content type switch:', { contentType, postId: post.id })
    
    switch (contentType) {
      case 'text':
        return (
          <div className="enterprise-feed-card-text-content">
            <div className="enterprise-feed-card-text prose prose-sm max-w-none">
              <div className="enterprise-feed-card-text-preview">
                {content.text ? (
                  <div dangerouslySetInnerHTML={{ __html: content.text }} />
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
        
        // Handle multiple images (comma-separated URLs)
        const imageUrls = post.image_url ? post.image_url.split(',').map((url: string) => url.trim()).filter((url: string) => url) : []
        const isMultiImage = imageUrls.length > 1
        
        // Convert image URLs to photo objects for SophisticatedPhotoGrid
        const photos = imageUrls.map((url: string, index: number) => ({
          id: `post-${post.id}-${index}`,
          url: url,
          thumbnail_url: url,
          alt_text: `Post image ${index + 1}`,
          description: content.text || `Image ${index + 1} from post`,
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
            
            {content.text && (
              <div className="enterprise-feed-card-photo-caption mt-3">
                <p className="text-sm text-muted-foreground">{content.text}</p>
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
            {content.link_url && (
              <div className="enterprise-feed-card-link-preview border rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <ExternalLink className="h-5 w-5 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    {content.link_title && (
                      <h4 className="font-semibold text-sm">{content.link_title}</h4>
                    )}
                    {content.link_description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {content.link_description}
                      </p>
                    )}
                    <a
                      href={content.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                    >
                      {content.link_url}
                    </a>
                  </div>
                </div>
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
              {getContentSummary(content, contentType)}
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
        {post.view_count > 0 && (
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
        {post.share_count > 0 && (
          <span className="enterprise-feed-card-shares flex items-center gap-1">
            <Share2 className="h-4 w-4" />
            {post.share_count} shares
          </span>
        )}
        {post.bookmark_count > 0 && (
          <span className="enterprise-feed-card-bookmarks flex items-center gap-1">
            <Bookmark className="h-4 w-4" />
            {post.bookmark_count} bookmarks
          </span>
        )}
      </div>
    )
  }

  // Render content warnings
  const renderContentWarnings = () => {
    if (!post.content_warnings || post.content_warnings.length === 0) return null

    return (
      <div className="enterprise-feed-card-warnings mb-3">
        <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            Content warnings: {post.content_warnings.join(', ')}
          </span>
        </div>
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

  // Render categories
  const renderCategories = () => {
    if (!post.categories || post.categories.length === 0) return null

    return (
      <div className="enterprise-feed-card-categories flex flex-wrap gap-1 mt-2">
        {post.categories.map((category: string) => (
          <Badge key={category} variant="outline" className="enterprise-feed-card-category">
            {category}
          </Badge>
        ))}
      </div>
    )
  }

  const currentContentConfig = contentTypeConfigs[post.content_type as keyof typeof contentTypeConfigs]
  const currentEntityConfig = entityTypeConfigs[post.entity_type as keyof typeof entityTypeConfigs]
  const currentVisibilityConfig = visibilityConfigs[post.visibility as keyof typeof visibilityConfigs]
  const contentSafetyLevel = getContentSafetyLevel(post.content_safety_score || 1)
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
          <div className="enterprise-feed-card-actions">
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
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

        {/* Tags and Categories */}
        {renderTags()}
        {renderCategories()}

        {/* Engagement Stats */}
        {renderEngagementStats()}

        {/* Engagement Actions */}
        {showActions && (
          <div className="enterprise-feed-card-engagement-actions mt-4">
            <EngagementActions
              entityId={post.id}
              entityType={post.entity_type as 'user' | 'book' | 'author' | 'publisher' | 'group'}
              initialEngagementCount={post.like_count + post.comment_count + post.share_count}
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