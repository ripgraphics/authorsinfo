'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Heart, MessageSquare, Share2, Bookmark, Send } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// ============================================================================
// SIMPLE TYPE DEFINITIONS
// ============================================================================

export interface EnterpriseEngagementActionsProps {
  entityId: string
  entityType: string
  className?: string
}

// ============================================================================
// SIMPLE COMPONENT
// ============================================================================

const EnterpriseEngagementActions = React.memo(
  ({ entityId, entityType, className }: EnterpriseEngagementActionsProps) => {
    const { user } = useAuth()
    const { toast } = useToast()

    // Simple state
    const [showCommentInput, setShowCommentInput] = useState(false)
    const [showShareMenu, setShowShareMenu] = useState(false)
    const [commentText, setCommentText] = useState('')
    const [isLiked, setIsLiked] = useState(false)
    const [isBookmarked, setIsBookmarked] = useState(false)

    // Simple handlers
    const handleLike = () => {
      setIsLiked(!isLiked)
      toast({
        title: isLiked ? 'Like removed' : 'Liked!',
        description: isLiked ? 'Your like has been removed.' : 'You liked this content!',
        variant: 'default',
      })
    }

    const handleComment = () => {
      setShowCommentInput(!showCommentInput)
    }

    const handleShare = () => {
      setShowShareMenu(!showShareMenu)
      toast({
        title: 'Shared',
        description: 'Content shared successfully!',
        variant: 'default',
      })
    }

    const handleBookmark = () => {
      setIsBookmarked(!isBookmarked)
      toast({
        title: isBookmarked ? 'Bookmark removed' : 'Bookmarked!',
        description: isBookmarked
          ? 'Item removed from your bookmarks.'
          : 'Item added to your bookmarks!',
        variant: 'default',
      })
    }

    const handleCommentSubmit = () => {
      if (commentText.trim()) {
        toast({
          title: 'Comment posted',
          description: 'Your comment has been posted successfully!',
          variant: 'default',
        })
        setCommentText('')
        setShowCommentInput(false)
      }
    }

    return (
      <div className={cn('enterprise-engagement-actions p-4', className)}>
        {/* Main Action Buttons */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn(
              'flex-1',
              isLiked ? 'text-red-600 hover:text-red-700' : 'text-gray-600 hover:text-gray-700'
            )}
          >
            <Heart className={cn('h-5 w-5 mr-2', isLiked && 'fill-current')} />
            {isLiked ? 'Liked' : 'Like'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleComment}
            className="flex-1 text-gray-600 hover:text-gray-700"
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            Comment
          </Button>

          <Popover open={showShareMenu} onOpenChange={setShowShareMenu}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-gray-600 hover:text-gray-700"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Share
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Share this {entityType}</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share to Feed
                  </Button>
                  <Button variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            className={cn(
              'flex-1',
              isBookmarked
                ? 'text-blue-600 hover:text-blue-700'
                : 'text-gray-600 hover:text-gray-700'
            )}
          >
            <Bookmark className={cn('h-5 w-5 mr-2', isBookmarked && 'fill-current')} />
            {isBookmarked ? 'Saved' : 'Save'}
          </Button>
        </div>

        {/* Comment Input */}
        {showCommentInput && (
          <div className="border-t pt-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </div>

              <div className="flex-1">
                <Textarea
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[80px] mb-3"
                />

                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCommentInput(false)
                      setCommentText('')
                    }}
                  >
                    Cancel
                  </Button>

                  <Button size="sm" onClick={handleCommentSubmit} disabled={!commentText.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Post Comment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

EnterpriseEngagementActions.displayName = 'EnterpriseEngagementActions'

export default EnterpriseEngagementActions
