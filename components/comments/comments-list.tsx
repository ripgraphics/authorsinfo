'use client'

import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { ThumbsUp, MessageSquare } from 'lucide-react'

interface Comment {
  id: string
  comment_text: string
  created_at: string
  user: {
    id: string
    name: string
    avatar_url?: string
  }
}

interface CommentsListProps {
  entityId: string
  entityType: string
}

export function CommentsList({ entityId, entityType }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Debug: Log the props when component mounts
  console.log('🔍 CommentsList: Component mounted with props:', { entityId, entityType })

  useEffect(() => {
    console.log('🔍 CommentsList: useEffect triggered with:', { entityId, entityType })
    fetchComments()
  }, [entityId, entityType])

  const fetchComments = async () => {
    try {
      setIsLoading(true)
      console.log('🔍 CommentsList: Fetching comments for:', { entityId, entityType })
      
      const response = await fetch(`/api/engagement?entity_id=${entityId}&entity_type=${entityType}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 CommentsList: API response:', data)
        console.log('🔍 CommentsList: API response type:', typeof data)
        console.log('🔍 CommentsList: API response keys:', Object.keys(data))
        console.log('🔍 CommentsList: recent_comments exists:', !!data.recent_comments)
        console.log('🔍 CommentsList: recent_comments type:', typeof data.recent_comments)
        console.log('🔍 CommentsList: recent_comments is array:', Array.isArray(data.recent_comments))
        console.log('🔍 CommentsList: recent_comments length:', data.recent_comments?.length)
        
        // The API returns recent_comments, not comments
        if (data.recent_comments && Array.isArray(data.recent_comments)) {
          console.log('🔍 CommentsList: Setting comments:', data.recent_comments)
          console.log('🔍 CommentsList: First comment structure:', data.recent_comments[0])
          setComments(data.recent_comments)
        } else {
          console.log('🔍 CommentsList: No recent_comments found, setting empty array')
          console.log('🔍 CommentsList: Data structure:', data)
          setComments([])
        }
      } else {
        console.error('🔍 CommentsList: API response not ok:', response.status)
        setComments([])
      }
    } catch (error) {
      console.error('🔍 CommentsList: Error fetching comments:', error)
      setComments([])
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo`
    return `${Math.floor(diffInSeconds / 31536000)}y`
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (comments.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="comment-item" role="article">
          <div className="flex gap-3">
            {/* User Avatar */}
            <div className="flex-shrink-0">
              <Avatar 
                src={comment.user?.avatar_url || '/placeholder.svg?height=32&width=32'} 
                alt={`${comment.user?.name || 'User'} avatar`}
                name={comment.user?.name || 'User'}
                className="w-8 h-8"
              />
            </div>
            
            {/* Comment Content */}
            <div className="flex-1 min-w-0">
              <div className="bg-gray-50 rounded-lg p-3">
                {/* User Name */}
                <div className="mb-1">
                  <a href="#" className="text-sm font-semibold text-blue-600 hover:underline">
                    {comment.user?.name || 'Unknown User'}
                  </a>
                </div>
                
                {/* Comment Text */}
                <div className="text-sm text-gray-800">
                  {comment.comment_text}
                </div>
              </div>
              
              {/* Comment Actions */}
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                <button className="hover:text-blue-600 transition-colors flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  Like
                </button>
                <button className="hover:text-blue-600 transition-colors flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  Reply
                </button>
                <span className="text-gray-400">•</span>
                <span>{formatTimestamp(comment.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
