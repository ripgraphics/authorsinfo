import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, MessageSquare, Share2, Ellipsis } from "lucide-react"
import Link from "next/link"

export interface TimelineItem {
  id: string
  avatarUrl?: string
  name: string
  profileUrl?: string
  timestamp: string | Date
  content: React.ReactNode
  actions?: boolean
}

interface TimelineProps {
  items: TimelineItem[]
  showActions?: boolean
  className?: string
}

export function Timeline({ items, showActions = true, className = "" }: TimelineProps) {
  return (
    <div className={`timeline ${className}`}>
      {items.map(item => (
        <div key={item.id} className="timeline__item rounded-lg border bg-card text-card-foreground shadow-sm mb-6">
          <div className="timeline__header flex flex-col space-y-1.5 p-6 pb-3">
            <div className="timeline__header-row flex justify-between">
              <div className="timeline__user flex items-center gap-3">
                <Avatar src={item.avatarUrl} alt={item.name} name={item.name} size="sm" className="timeline__avatar" />
                <div>
                  <div className="timeline__name font-medium">
                    {item.profileUrl ? (
                      <Link href={item.profileUrl} className="timeline__profile-link hover:underline">{item.name}</Link>
                    ) : (
                      item.name
                    )}
                  </div>
                  <div className="timeline__timestamp text-xs text-muted-foreground">
                    {typeof item.timestamp === "string" ? item.timestamp : new Date(item.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="timeline__actions-btn">
                <Ellipsis className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="timeline__content p-6 pt-0 pb-3">
            {item.content}
          </div>
          {showActions && (
            <div className="timeline__footer p-6 flex items-center justify-between py-3">
              <div className="timeline__actions flex items-center gap-6">
                <Button variant="ghost" className="timeline__action-btn h-9 rounded-md px-3 gap-1">
                  <Heart className="h-4 w-4" />
                  <span>Like</span>
                </Button>
                <Button variant="ghost" className="timeline__action-btn h-9 rounded-md px-3 gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>Comment</span>
                </Button>
                <Button variant="ghost" className="timeline__action-btn h-9 rounded-md px-3">
                  <Share2 className="h-4 w-4" />
                  <span className="ml-1">Share</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
} 