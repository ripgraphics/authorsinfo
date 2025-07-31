'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { UserHoverCard } from '@/components/entity-hover-cards'
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Download, 
  Send,
  MoreVertical,
  Reply,
  Flag,
  Trash2
} from 'lucide-react'

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
  entityName: string
  entityAvatar?: string
  entityCreatedAt: string
  isOwner: boolean
}

export default function EntityComments({
  entityId,
  entityType,
  entityName,
  entityAvatar,
  entityCreatedAt,
  isOwner
}: EntityCommentsProps) {
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [likeCount, setLikeCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [shareCount, setShareCount] = useState(0)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [entityUser, setEntityUser] = useState<any>(null)
  
  // Refs for contentEditable elements
  const commentInputRef = useRef<HTMLDivElement>(null)

  // Format date as "Jul 30, 2025"
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Get entity user data for hover card
  const getEntityUserData = useCallback(async () => {
    try {
      // If entityType is 'user', we need to get the user data
      if (entityType === 'user' || entityType === 'photo') {
        // For photos, we need to get the user who uploaded the photo
        if (entityType === 'photo') {
          // First try to get from the new uploader_id field if it exists
          let imageData: any = null;
          try {
            const { data } = await supabase
              .from('images')
              .select('uploader_id, metadata')
              .eq('id', entityId)
              .single();
            imageData = data;

          } catch (error) {
            // If uploader_id column doesn't exist yet, fall back to metadata
            const { data } = await supabase
              .from('images')
              .select('metadata, entity_id, entity_type_id')
              .eq('id', entityId)
              .single();
            imageData = data;
          }
          
          if (imageData) {
            let userId = null;
            
            // Try uploader_id first (if migration has been run)
            if (imageData.uploader_id) {
              userId = imageData.uploader_id;
            }
            // Fall back to metadata.user_id
            else if (imageData.metadata?.user_id) {
              userId = imageData.metadata.user_id;
            }
            
            if (userId) {
              const { data: userData } = await supabase
                .from('users')
                .select('id, name, email, created_at')
                .eq('id', userId)
                .single();
              if (userData) {
                setEntityUser({
                  id: userData.id,
                  name: userData.name || userData.email || entityName,
                  created_at: userData.created_at
                });
                return;
              }
            }
          }


        } else {
          // For user entities, use the entityId as the user ID
          const { data: userData } = await supabase
            .from('users')
            .select('id, name, email, created_at')
            .eq('id', entityId)
            .single();
          
          if (userData) {
            setEntityUser({
              id: userData.id,
              name: userData.name || userData.email || entityName,
              created_at: userData.created_at
            });
            return;
          }
        }
      }
      
      // If we couldn't get user data, set a fallback with the provided entityName
      if (entityName && entityName !== 'User') {
        setEntityUser({
          id: entityId,
          name: entityName,
          created_at: entityCreatedAt
        });
      }
    } catch (error) {
      console.error('Error getting entity user data:', error);
      // Set fallback if we have a meaningful entityName
      if (entityName && entityName !== 'User') {
        setEntityUser({
          id: entityId,
          name: entityName,
          created_at: entityCreatedAt
        });
      }
    }
  }, [entityType, entityId, entityName, entityCreatedAt, supabase]);

  // Get current user data
  const getCurrentUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser({
          id: user.id,
          name: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
          avatar_url: user.user_metadata?.avatar_url
        })
      }
    } catch (error) {
      console.error('Error getting current user:', error)
    }
  }, [supabase])

  // Load comments for the entity
  const loadComments = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Load top-level comments
      const { data: topLevelComments, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .is('parent_id', null)
        .eq('is_deleted', false)
        .eq('is_hidden', false)
        .order('created_at', { ascending: true })

      if (commentsError) {
        console.error('Error loading comments:', commentsError)
        toast({
          title: "Error",
          description: "Failed to load comments",
          variant: "destructive"
        })
        return
      }

      // Load user data for each comment
      const commentsWithUsers = await Promise.all(
        (topLevelComments || []).map(async (comment) => {
          // Get user data
          const { data: userData } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', comment.user_id)
            .single()
          


          // Get replies for this comment
          const { data: replies } = await supabase
            .from('comments')
            .select('*')
            .eq('parent_id', comment.id)
            .eq('is_deleted', false)
            .eq('is_hidden', false)
            .order('created_at', { ascending: true })

          // Get user data for replies
          const repliesWithUsers = await Promise.all(
            (replies || []).map(async (reply) => {
              const { data: replyUserData } = await supabase
                .from('users')
                .select('id, name, email')
                .eq('id', reply.user_id)
                .single()

              return {
                ...reply,
                user: replyUserData ? {
                  id: replyUserData.id,
                  name: replyUserData.name || replyUserData.email || 'Unknown User',
                  avatar_url: undefined
                } : {
                  id: reply.user_id,
                  name: 'Unknown User',
                  avatar_url: undefined
                }
              }
            })
          )

          return {
            ...comment,
            user: userData ? {
              id: userData.id,
              name: userData.name || userData.email || 'Unknown User',
              avatar_url: undefined
            } : {
              id: comment.user_id,
              name: 'Unknown User',
              avatar_url: undefined
            },
            replies: repliesWithUsers
          }
        })
      )

      setComments(commentsWithUsers)
    } catch (error) {
      console.error('Error in loadComments:', error)
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [entityType, entityId, supabase, toast])

  // Load social stats for the entity
  const loadSocialStats = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get like count and status
      const { count: likeCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)

      const { data: userLike } = await supabase
        .from('likes')
        .select('id')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('user_id', user.id)
        .single()

      // Get share count
      const { count: shareCount } = await supabase
        .from('shares')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)

      // Get bookmark count and status
      const { count: bookmarkCount } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)

      const { data: userBookmark } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('user_id', user.id)
        .single()

      setLikeCount(likeCount || 0)
      setIsLiked(!!userLike)
      setShareCount(shareCount || 0)
      setBookmarkCount(bookmarkCount || 0)
      setIsBookmarked(!!userBookmark)
    } catch (error) {
      console.error('Error loading social stats:', error)
    }
  }, [entityType, entityId, supabase])

  // Handle like/unlike
  const handleLike = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to like",
          variant: "destructive"
        })
        return
      }

      if (isLiked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('entity_type', entityType)
          .eq('entity_id', entityId)
        
        setLikeCount(prev => prev - 1)
        setIsLiked(false)
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            entity_type: entityType,
            entity_id: entityId
          })
        
        setLikeCount(prev => prev + 1)
        setIsLiked(true)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive"
      })
    }
  }, [isLiked, entityType, entityId, supabase, toast])

  // Handle comment submission
  const handleComment = useCallback(async (content: string, parentId?: string) => {
    try {
      setIsSubmitting(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to comment",
          variant: "destructive"
        })
        return
      }

      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          entity_type: entityType,
          entity_id: entityId,
          content: content.trim(),
          parent_id: parentId || null
        })

      if (error) {
        console.error('Error adding comment:', error)
        toast({
          title: "Error",
          description: "Failed to add comment",
          variant: "destructive"
        })
        return
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
      console.error('Error in handleComment:', error)
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [entityType, entityId, supabase, toast, loadComments])

  // Handle reply submission
  const handleReply = useCallback(async (commentId: string) => {
    if (!replyContent.trim()) return
    await handleComment(replyContent, commentId)
  }, [replyContent, handleComment])

  // Handle share
  const handleShare = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to share",
          variant: "destructive"
        })
        return
      }

      await supabase
        .from('shares')
        .insert({
          user_id: user.id,
          entity_type: entityType,
          entity_id: entityId,
          share_type: 'standard',
          is_public: true
        })

      setShareCount(prev => prev + 1)
      toast({
        title: "Success",
        description: "Shared successfully"
      })
    } catch (error) {
      console.error('Error sharing:', error)
      toast({
        title: "Error",
        description: "Failed to share",
        variant: "destructive"
      })
    }
  }, [entityType, entityId, supabase, toast])

  // Handle bookmark
  const handleBookmark = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to bookmark",
          variant: "destructive"
        })
        return
      }

      if (isBookmarked) {
        // Remove bookmark
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('entity_type', entityType)
          .eq('entity_id', entityId)
        
        setBookmarkCount(prev => prev - 1)
        setIsBookmarked(false)
      } else {
        // Add bookmark
        await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            entity_type: entityType,
            entity_id: entityId,
            bookmark_folder: 'default',
            is_private: false
          })
        
        setBookmarkCount(prev => prev + 1)
        setIsBookmarked(true)
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive"
      })
    }
  }, [isBookmarked, entityType, entityId, supabase, toast])

  // Initialize component
  useEffect(() => {
    getCurrentUser()
    getEntityUserData()
    loadComments()
    loadSocialStats()
  }, [getCurrentUser, getEntityUserData, loadComments, loadSocialStats])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-gray-500">Loading comments...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        {entityUser ? (
          <UserHoverCard user={entityUser}>
            <Avatar 
              src={entityAvatar} 
              name={entityUser.name}
              className="w-10 h-10"
            />
          </UserHoverCard>
        ) : (
          <Avatar 
            src={entityAvatar} 
            name={entityName}
            className="w-10 h-10"
          />
        )}
        <div className="flex-1">
          {entityUser ? (
            <UserHoverCard user={entityUser}>
              <div className="font-medium text-sm hover:underline cursor-pointer">
                {entityUser.name}
              </div>
            </UserHoverCard>
          ) : (
            <div className="font-medium text-sm">{entityName}</div>
          )}
          <div className="text-xs text-gray-500">{formatDate(entityCreatedAt)}</div>
        </div>
      </div>

      {/* Social Actions */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-gray-600'}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likeCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="flex items-center gap-2 text-gray-600"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm">{shareCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            className={`flex items-center gap-2 ${isBookmarked ? 'text-blue-500' : 'text-gray-600'}`}
          >
            <Download className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            <span className="text-sm">{bookmarkCount}</span>
          </Button>
        </div>
      </div>

      {/* Comments Section */}
      <div className="flex-1 overflow-y-auto p-4">
        {comments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUser={currentUser}
                onReply={setReplyingTo}
                onSubmitReply={handleReply}
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