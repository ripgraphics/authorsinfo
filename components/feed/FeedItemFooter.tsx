import { ThumbsUp, MessageSquare, Share2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FeedItemFooterProps {
  views?: number
  onLike?: () => void
  onReply?: () => void
  onShare?: () => void
  likeCount?: number
  replyCount?: number
  isLiked?: boolean
}

export function FeedItemFooter({
  views = 0,
  onLike,
  onReply,
  onShare,
  likeCount = 0,
  replyCount = 0,
  isLiked = false,
}: FeedItemFooterProps) {
  return (
    <div className="px-4 py-3 bg-muted/50 flex items-center justify-between text-sm">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLike}
          className={`gap-1 ${isLiked ? 'text-primary' : ''}`}
        >
          <ThumbsUp className="h-4 w-4" />
          <span>{likeCount > 0 ? likeCount : 'Like'}</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={onReply} className="gap-1">
          <MessageSquare className="h-4 w-4" />
          <span>{replyCount > 0 ? replyCount : 'Reply'}</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={onShare} className="gap-1">
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </Button>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Eye className="h-4 w-4" />
        <span>{views.toLocaleString()} views</span>
      </div>
    </div>
  )
}
