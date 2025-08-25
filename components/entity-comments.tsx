'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { UserHoverCard } from '@/components/entity-hover-cards'
import { EntityHoverCard } from '@/components/entity-hover-cards'
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Download, 
  Send,
  MoreVertical,
  Reply,
  Flag,
  Trash2,
  ChevronDown,
  Users
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface Comment {
  id: string
  user_id: string
  entity_type: string
  entity_id: string
  content: string
  parent_id?: string
  created_at: string
  updated_at?: string
  is_hidden: boolean
  is_deleted: boolean
  user: {
    id: string
    name: string
    avatar_url?: string
  }
  replies?: Comment[]
  reaction_count?: number
  user_reaction?: string
}

interface EntityCommentsProps {
  entityId: string
  entityType: string
  entityName?: string
  entityAvatar?: string
  entityCreatedAt?: string
  isOwner?: boolean
  entityDisplayInfo?: {
    name: string
    avatar?: string
    type: string
  }
}

export default function EntityComments({
  entityId,
  entityType,
  entityName,
  entityAvatar,
  entityCreatedAt,
  isOwner,
  entityDisplayInfo
}: EntityCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [shareCount, setShareCount] = useState(0)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [commentInputRef] = useState(useRef<HTMLDivElement>(null))
  const [supabase] = useState(() => supabaseClient)
  const { toast } = useToast()

  // Get current user
  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Get user data from the users table
        const { data: userData } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', user.id)
          .single()
        
        setCurrentUser({
          id: user.id,
          email: user.email,
          name: userData?.name || user.email?.split('@')[0] || 'User',
          avatar_url: undefined // We'll handle avatars separately if needed
        })
      }
    } catch (error) {
      console.error('Error getting current user:', error)
    }
  }

  // Load comments for the entity
  const loadComments = useCallback(async () => {
    try {
      setIsLoading(true)
      
      console.log('🔍 EntityComments: Loading comments for entity:', { entityId, entityType })
      
      // Use the correct engagement system - call the get_entity_engagement function
      const response = await fetch(`/api/engagement?entity_type=${entityType}&entity_id=${entityId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load comments: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('🔍 EntityComments: Raw API response:', data)
      
      const commentsData = data.recent_comments || []
      console.log('🔍 EntityComments: Comments data from API:', commentsData)
      
      // Transform the comment data to match the Comment interface
      const transformedComments: Comment[] = commentsData.map((comment: any) => ({
        id: comment.id,
        user_id: comment.user_id,
        entity_type: entityType,
        entity_id: entityId,
        content: comment.comment_text || comment.content || '',
        parent_id: comment.parent_comment_id || comment.parent_id || null,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        is_hidden: comment.is_hidden || false,
        is_deleted: comment.is_deleted || false,
        user: {
          id: comment.user?.id || comment.user_id,
          name: comment.user?.name || comment.user?.email || 'Unknown User',
          avatar_url: comment.user?.avatar_url || undefined
        },
        replies: comment.replies || [] // Handle nested replies if available
      }))

      console.log('🔍 EntityComments: Transformed comments:', transformedComments)
      setComments(transformedComments)
    } catch (error) {
      console.error('Error loading comments:', error)
      // Set empty comments array on error to prevent UI issues
      setComments([])
    } finally {
      setIsLoading(false)
    }
  }, [entityType, entityId])

  // Load like status and count
  const loadLikeStatus = useCallback(async () => {
    try {
      if (!currentUser) return

      // Use the correct engagement system - call the get_entity_engagement function
      const response = await fetch(`/api/engagement?entity_type=${entityType}&entity_id=${entityId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load like status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Check if current user liked this entity
      const userLike = data.recent_likes?.find((like: any) => like.user_id === currentUser.id)
      setIsLiked(!!userLike)
      
      // Set like count
      setLikeCount(data.likes_count || 0)
    } catch (error) {
      console.error('Error loading like status:', error)
      // Set default values on error
      setIsLiked(false)
      setLikeCount(0)
    }
  }, [entityType, entityId, currentUser])

  // Handle like toggle
  const handleLike = async () => {
    try {
      if (!currentUser) {
        toast({
          title: "Error",
          description: "You must be logged in to like",
          variant: "destructive"
        })
        return
      }

      // Use the correct engagement system - call the toggle_entity_like function
      const response = await fetch(`/api/engagement/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to toggle like: ${response.status}`)
      }

      // Toggle local state
      setIsLiked(!isLiked)
      setLikeCount(prev => isLiked ? Math.max(0, prev - 1) : prev + 1)
      
      // Reload like status to ensure consistency
      await loadLikeStatus()
    } catch (error) {
      console.error('Error toggling like:', error)
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive"
      })
    }
  }

  // Handle comment submission
  const handleComment = useCallback(async (content: string, parentId?: string) => {
    try {
      setIsSubmitting(true)
      
      // Check if this is a timeline photo (generated ID) or a real database entity
      const isTimelinePhoto = entityId.startsWith('post-') || entityId.startsWith('preview-')
      
      if (isTimelinePhoto) {
        toast({
          title: "Info",
          description: "Comments are not available for timeline photos",
          variant: "default"
        })
        return
      }
      
      // Use the correct engagement system - call the add_engagement_comment function
      const response = await fetch(`/api/engagement/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          comment_text: content.trim(),
          parent_comment_id: parentId || null
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to add comment: ${response.status}`)
      }

      // Clear form
      if (parentId) {
        setReplyContent('')
        setReplyingTo(null)
      } else {
        setNewComment('')
        // Clear the contentEditable div
        if (commentInputRef.current) {
          commentInputRef.current.innerText = ''
        }
      }

      // Reload comments
      await loadComments()
      
      toast({
        title: "Success",
        description: "Comment added successfully"
      })
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [entityType, entityId, commentInputRef, loadComments])

  // Handle share
  const handleShare = () => {
    toast({
      title: "Info",
      description: "Share functionality coming soon",
      variant: "default"
    })
  }

  // Handle bookmark
  const handleBookmark = () => {
    toast({
      title: "Info",
      description: "Bookmark functionality coming soon",
      variant: "default"
    })
  }

  // Load data on mount
  useEffect(() => {
    getCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadComments()
      loadLikeStatus()
    }
  }, [currentUser, loadComments, loadLikeStatus])

  // Debug logging
  useEffect(() => {
    console.log('🔍 EntityComments: Component state:', { 
      isLoading, 
      commentsCount: comments.length, 
      comments,
      entityId,
      entityType,
      currentUser: !!currentUser
    })
  }, [isLoading, comments, entityId, entityType, currentUser])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Get unique commenters for the comment count display
  const uniqueCommenters = comments.reduce((acc, comment) => {
    if (!acc.find(u => u.id === comment.user.id)) {
      acc.push(comment.user)
    }
    comment.replies?.forEach(reply => {
      if (!acc.find(u => u.id === reply.user.id)) {
        acc.push(reply.user)
      }
    })
    return acc
  }, [] as any[])

  // Get all likers for the like count display
  const [likers, setLikers] = useState<any[]>([])
  
  const loadLikers = useCallback(async () => {
    try {
      // Use the correct engagement system - call the get_entity_engagement function
      const response = await fetch(`/api/engagement?entity_type=${entityType}&entity_id=${entityId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load likers: ${response.status}`)
      }
      
      const data = await response.json()
      const likesData = data.recent_likes || []
      
      // Transform the data to match the expected format
      const transformedLikers = likesData.map((like: any) => ({
        id: like.user_id,
        name: like.user_name || 'Unknown User',
        email: like.user_email
      })).filter(Boolean)
      
      setLikers(transformedLikers)
    } catch (error) {
      console.error('Error loading likers:', error)
      setLikers([])
    }
  }, [entityType, entityId])

  useEffect(() => {
    loadLikers()
  }, [loadLikers])

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Entity Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Avatar 
          src={entityAvatar || entityDisplayInfo?.avatar} 
          name={entityName || entityDisplayInfo?.name || 'Entity'}
          className="w-10 h-10 flex-shrink-0"
        />
        <div className="flex-1">
          <div className="font-medium text-sm">{entityName || entityDisplayInfo?.name || 'Entity'}</div>
          <div className="text-xs text-gray-500">{formatDate(entityCreatedAt || new Date().toISOString())}</div>
        </div>
      </div>

      {/* Social Actions */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={entityId.startsWith('post-') || entityId.startsWith('preview-')}
            className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-gray-600'} ${(entityId.startsWith('post-') || entityId.startsWith('preview-')) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likeCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            disabled={entityId.startsWith('post-') || entityId.startsWith('preview-')}
            className={`flex items-center gap-2 text-gray-600 ${(entityId.startsWith('post-') || entityId.startsWith('preview-')) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm">{shareCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            disabled={entityId.startsWith('post-') || entityId.startsWith('preview-')}
            className={`flex items-center gap-2 text-gray-600 ${(entityId.startsWith('post-') || entityId.startsWith('preview-')) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Download className={`w-4 h-4`} />
            <span className="text-sm">{bookmarkCount}</span>
          </Button>
        </div>
      </div>

      {/* Engagement Summary - Facebook Style */}
      <div className="px-4 py-2 border-b bg-gray-50">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {/* Like Count with Hover Dropdown */}
          {likeCount > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-sm text-gray-600 hover:text-gray-900">
                  <Heart className="w-4 h-4 mr-1 fill-current text-red-500" />
                  {likeCount} {likeCount === 1 ? 'person' : 'people'} liked this
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-3 border-b">
                  <h4 className="font-medium text-sm">People who liked this</h4>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {likers.map((liker) => (
                    <div key={liker.id} className="flex items-center gap-3 p-3 hover:bg-gray-50">
                      <Avatar 
                        src={liker.avatar_url} 
                        name={liker.name}
                        className="w-8 h-8"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{liker.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Comment Count with Hover Dropdown */}
          {comments.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-sm text-gray-600 hover:text-gray-900">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-3 border-b">
                  <h4 className="font-medium text-sm">People who commented</h4>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {uniqueCommenters.map((commenter) => (
                    <div key={commenter.id} className="flex items-center gap-3 p-3 hover:bg-gray-50">
                      <Avatar 
                        src={commenter.avatar_url} 
                        name={commenter.name}
                        className="w-8 h-8"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{commenter.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-center text-gray-500 py-4">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center text-gray-500 py-4">No comments yet. Be the first to comment!</div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUser={currentUser}
                onReply={(commentId) => setReplyingTo(commentId)}
                onSubmitReply={(commentId) => handleComment(replyContent, commentId)}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
                isReplying={replyingTo === comment.id}
                isSubmitting={isSubmitting}
              />
            ))}
          </div>
        )}
      </div>

      {/* Comment Input */}
      <div className="p-4 border-t">
        {entityId.startsWith('post-') || entityId.startsWith('preview-') ? (
          <div className="text-center text-gray-500 py-4">
            Comments are not available for timeline photos
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <Avatar 
              src={currentUser?.avatar_url} 
              name={currentUser?.name}
              className="w-10 h-10 flex-shrink-0"
            />
            <div className="flex-1">
              <div
                ref={commentInputRef}
                contentEditable
                className="min-h-[40px] max-h-[120px] px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-placeholder="Write a comment..."
                onInput={(e) => {
                  const text = e.currentTarget.innerText || ''
                  setNewComment(text)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (newComment.trim()) {
                      handleComment(newComment)
                    }
                  }
                }}
                suppressContentEditableWarning
              />
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-gray-500">
                  Comment as {currentUser?.name || "User"}
                </div>
                <Button
                  size="sm"
                  onClick={() => handleComment(newComment)}
                  disabled={!newComment.trim() || isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Comment Item Component
interface CommentItemProps {
  comment: Comment
  currentUser: any
  onReply: (commentId: string) => void
  onSubmitReply: (commentId: string) => void
  replyContent: string
  setReplyContent: (content: string) => void
  isReplying: boolean
  isSubmitting: boolean
}

function CommentItem({
  comment,
  currentUser,
  onReply,
  onSubmitReply,
  replyContent,
  setReplyContent,
  isReplying,
  isSubmitting
}: CommentItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-3">
      {/* Main Comment */}
      <div className="flex items-start gap-3">
        <UserHoverCard user={comment.user}>
          <Avatar 
            src={comment.user.avatar_url} 
            name={comment.user.name}
            className="w-10 h-10 flex-shrink-0"
          />
        </UserHoverCard>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <UserHoverCard user={comment.user}>
              <span className="font-medium text-sm hover:underline cursor-pointer">
                {comment.user.name}
              </span>
            </UserHoverCard>
            <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
          </div>
          <div className="text-sm text-gray-900 mb-2">{comment.content}</div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(comment.id)}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </Button>
            {currentUser?.id === comment.user.id && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-600 hover:text-red-600"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            )}
            {currentUser?.id !== comment.user.id && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-600 hover:text-orange-600"
              >
                <Flag className="w-3 h-3 mr-1" />
                Report
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Reply Input */}
      {isReplying && (
        <div className="ml-11">
          <div className="flex items-start gap-3">
            <Avatar 
              src={currentUser?.avatar_url} 
              name={currentUser?.name}
              className="w-8 h-8 flex-shrink-0"
            />
            <div className="flex-1">
              <div
                contentEditable
                className="min-h-[32px] max-h-[100px] px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                data-placeholder="Write a reply..."
                onInput={(e) => {
                  const text = e.currentTarget.innerText || ''
                  setReplyContent(text)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (replyContent.trim()) {
                      onSubmitReply(comment.id)
                    }
                  }
                }}
                suppressContentEditableWarning
              />
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-gray-500">
                  Reply as {currentUser?.name || "User"}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReply('')}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onSubmitReply(comment.id)}
                    disabled={!replyContent.trim() || isSubmitting}
                    className="text-xs"
                  >
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 space-y-3">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-3">
              <UserHoverCard user={reply.user}>
                <Avatar 
                  src={reply.user.avatar_url} 
                  name={reply.user.name}
                  className="w-8 h-8 flex-shrink-0"
                />
              </UserHoverCard>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <UserHoverCard user={reply.user}>
                    <span className="font-medium text-xs hover:underline cursor-pointer">
                      {reply.user.name}
                    </span>
                  </UserHoverCard>
                  <span className="text-xs text-gray-500">{formatDate(reply.created_at)}</span>
                </div>
                <div className="text-sm text-gray-900">{reply.content}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 