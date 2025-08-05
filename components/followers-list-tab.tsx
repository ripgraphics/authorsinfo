import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"
import Link from "next/link"

interface FollowersListTabProps {
  followers: any[]
  followersCount: number
  entityId: string
  entityType: string
}

export function FollowersListTab({
  followers,
  followersCount,
  entityId,
  entityType
}: FollowersListTabProps) {
  return (
    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-semibold leading-none tracking-tight">
            Followers · {followersCount}
          </div>
          <div className="flex items-center gap-2">
            <Input className="w-[200px]" placeholder="Search followers..." type="search" />
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <CardContent className="p-6 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {followers.length > 0 ? (
            followers.map((follower) => (
              <Link
                key={follower.id}
                href={follower.permalink ? `/profile/${follower.permalink}` : `/profile/${follower.id}`}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14 bg-muted">
                  <img
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(follower.name || 'User')}`}
                    alt={follower.name || 'User'}
                    className="aspect-square h-full w-full"
                  />
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{follower.name || 'Unknown User'}</h3>
                  <p className="text-xs text-muted-foreground">{follower.email || 'No email available'}</p>
                  <p className="text-xs text-muted-foreground">
                    Following since {follower.followSince ? new Date(follower.followSince).toLocaleDateString() : 'unknown date'}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-3 text-center p-6">
              <p className="text-muted-foreground">No followers yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 