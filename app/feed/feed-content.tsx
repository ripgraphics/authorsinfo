'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { PhotoAlbumFeedItem } from '@/components/photo-album-feed-item'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  Share2, 
  MessageCircle, 
  RefreshCw,
  BookOpen,
  User
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Activity {
  id: string
  user_id: string
  activity_type: string
  entity_type: string
  entity_id: string
  is_public: boolean
  metadata: any
  created_at: string
  user_name: string
  user_avatar_url?: string
  like_count: number
  comment_count: number
  is_liked: boolean
}

export function FeedContent() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async (pageNum = 0) => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .rpc('get_user_feed_activities', {
          p_user_id: user.id,
          p_limit: 10,
          p_offset: pageNum * 10
        })

      if (error) throw error

      if (pageNum === 0) {
        setActivities(data || [])
      } else {
        setActivities(prev => [...prev, ...(data || [])])
      }

      setHasMore((data || []).length === 10)
      setPage(pageNum)
    } catch (err) {
      console.error('Error loading activities:', err)
      setError('Failed to load activities')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    loadActivities(0)
  }

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadActivities(page + 1)
    }
  }

  const handleLike = async (activityId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('activity_likes')
        .select('id')
        .eq('activity_id', activityId)
        .eq('user_id', user.id)
        .single()

      if (existingLike) {
        // Unlike
        await supabase
          .from('activity_likes')
          .delete()
          .eq('activity_id', activityId)
          .eq('user_id', user.id)

        setActivities(prev => prev.map(activity => 
          activity.id === activityId 
            ? { ...activity, like_count: Math.max(0, activity.like_count - 1), is_liked: false }
            : activity
        ))
      } else {
        // Like
        await supabase
          .from('activity_likes')
          .insert({
            activity_id: activityId,
            user_id: user.id
          })

        setActivities(prev => prev.map(activity => 
          activity.id === activityId 
            ? { ...activity, like_count: activity.like_count + 1, is_liked: true }
            : activity
        ))
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleShare = async (activityId: string) => {
    try {
      const shareUrl = `${window.location.origin}/feed?activity=${activityId}`
      await navigator.clipboard.writeText(shareUrl)
      // You could show a toast notification here
      console.log('Activity link copied to clipboard')
    } catch (error) {
      console.error('Error sharing activity:', error)
    }
  }

  const handleComment = (activityId: string) => {
    // TODO: Implement comment functionality
    console.log('Comment on activity:', activityId)
  }

  const renderActivity = (activity: Activity) => {
    switch (activity.activity_type) {
      case 'album_created':
        return (
          <PhotoAlbumFeedItem
            key={activity.id}
            activity={activity}
            onLike={handleLike}
            onShare={handleShare}
            onComment={handleComment}
          />
        )
      
      case 'reading_progress':
        return (
          <Card key={activity.id} className="mb-4">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={activity.user_avatar_url} alt={activity.user_name} />
                  <AvatarFallback>
                    {activity.user_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Link 
                      href={`/profile/${activity.user_id}`}
                      className="font-semibold hover:underline"
                    >
                      {activity.user_name}
                    </Link>
                    <span className="text-muted-foreground">
                      {activity.metadata.status === 'completed' ? 'finished reading' : 'is reading'}
                    </span>
                    <span className="font-medium">{activity.metadata.book_title}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                    <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
                    <Badge variant="outline" className="text-xs">
                      <BookOpen className="h-3 w-3 mr-1" />
                      Reading
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(activity.id)}
                      className={`flex items-center space-x-1 ${
                        activity.is_liked ? 'text-red-500' : 'text-muted-foreground'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${activity.is_liked ? 'fill-current' : ''}`} />
                      <span>{activity.like_count}</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleComment(activity.id)}
                      className="flex items-center space-x-1 text-muted-foreground"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{activity.comment_count}</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare(activity.id)}
                      className="flex items-center space-x-1 text-muted-foreground"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      
      default:
        return (
          <Card key={activity.id} className="mb-4">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={activity.user_avatar_url} alt={activity.user_name} />
                  <AvatarFallback>
                    {activity.user_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Link 
                      href={`/profile/${activity.user_id}`}
                      className="font-semibold hover:underline"
                    >
                      {activity.user_name}
                    </Link>
                    <span className="text-muted-foreground">
                      {activity.activity_type.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-4">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </div>

                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(activity.id)}
                      className={`flex items-center space-x-1 ${
                        activity.is_liked ? 'text-red-500' : 'text-muted-foreground'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${activity.is_liked ? 'fill-current' : ''}`} />
                      <span>{activity.like_count}</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleComment(activity.id)}
                      className="flex items-center space-x-1 text-muted-foreground"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{activity.comment_count}</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare(activity.id)}
                      className="flex items-center space-x-1 text-muted-foreground"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
    }
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0 && !isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <User className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No activities yet</h3>
              <p className="text-muted-foreground">
                When you and your friends create public photo albums or update reading progress, 
                they'll appear here.
              </p>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Recent Activity</h2>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {activities.map(renderActivity)}
      </div>

      {hasMore && (
        <div className="text-center">
          <Button 
            onClick={handleLoadMore} 
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  )
} 