'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { PhotoAlbumFeedItem } from '@/components/photo-album-feed-item'
import { EntityFeedCard } from '@/components/entity-feed-card'
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
  User,
  MessageSquare,
  AlertCircle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { ProfileLink } from '@/components/profile-link'
import { FeedPost } from '@/types/feed'

export function FeedContent() {
  const [activities, setActivities] = useState<FeedPost[]>([])
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
      if (!user) {
        setError('Authentication required')
        return
      }

      // Get activities from activities table (unified system with enterprise features)
      const { data: activitiesData, error: activitiesError } = await supabase
        .rpc('get_user_feed_activities', {
          p_user_id: user.id,
          p_limit: 10,
          p_offset: pageNum * 10
        })

      if (activitiesError) {
        console.error('Activities error:', activitiesError)
        setError(activitiesError.message)
        return
      }

      // Process activities data (now includes all posts and enterprise features)
      const activities = activitiesData || []

      if (pageNum === 0) {
        setActivities(activities)
      } else {
        setActivities(prev => [...prev, ...activities])
      }

      setHasMore(activities.length === 10)
      setPage(pageNum)
    } catch (err) {
      console.error('Error loading activities:', err)
      setError(err instanceof Error ? err.message : 'Failed to load activities')
    } finally {
      setIsLoading(false)
    }
  }



  const handleRefresh = () => {
    setError(null)
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

      // Use the new database function to toggle like
      const { data, error } = await supabase
        .rpc('toggle_activity_like', {
          p_activity_id: activityId,
          p_user_id: user.id
        })

      if (error) {
        console.error('Error toggling like:', error)
        return
      }

      // Update local state with the new like count and status
      setActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              like_count: data.like_count, 
              is_liked: data.is_liked 
            }
          : activity
      ))
    } catch (error) {
      console.error('Error handling like:', error)
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
    // TODO: Implement comment functionality using the new add_activity_comment function
    console.log('Comment on activity:', activityId)
  }

  const renderActivity = (activity: FeedPost) => {
    // Handle post deletion for activities
    const handleActivityDelete = (activityId: string) => {
      setActivities(prev => prev.filter(a => a.id !== activityId))
    }

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
      
      case 'book_added':
      case 'book_updated':
      case 'book_reviewed':
        return (
          <Card key={activity.id} className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={activity.user_avatar_url} />
                  <AvatarFallback>
                    <BookOpen className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <ProfileLink userId={activity.user_id} className="font-medium hover:underline">
                      {activity.user_name}
                    </ProfileLink>
                    <span className="text-muted-foreground">
                      {activity.activity_type === 'book_added' ? 'added a book' :
                       activity.activity_type === 'book_updated' ? 'updated a book' :
                       'reviewed a book'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                    <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
                    <Badge variant="outline" className="text-xs">
                      <BookOpen className="h-3 w-4 mr-1" />
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

      case 'post_created':
        // Render post activities using EntityFeedCard for consistency
        return (
          <EntityFeedCard
            key={activity.id}
            post={activity}
            userDetails={{
              id: activity.user_id,
              name: activity.user_name,
              avatar_url: activity.user_avatar_url
            }}
            showActions={true}
            showComments={true}
            showEngagement={true}
            onPostUpdated={(updatedPost) => {
              // Update the activity in local state
              setActivities(prev => prev.map(a => a.id === updatedPost.id ? { ...a, ...updatedPost } : a))
            }}
            onPostDeleted={(postId) => {
              // Remove the activity from local state
              setActivities(prev => prev.filter(a => a.id !== postId))
            }}
          />
        )

      case 'profile_updated':
      case 'user_joined':
        return (
          <Card key={activity.id} className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={activity.user_avatar_url} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <ProfileLink userId={activity.user_id} className="font-medium hover:underline">
                      {activity.user_name}
                    </ProfileLink>
                    <span className="text-muted-foreground">
                      {activity.activity_type === 'profile_updated' ? 'updated their profile' : 'joined the community'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                    <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
                    <Badge variant="outline" className="text-xs">
                      <User className="h-3 w-4 mr-1" />
                      Profile
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
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={activity.user_avatar_url} />
                  <AvatarFallback>
                    <MessageSquare className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <ProfileLink userId={activity.user_id} className="font-medium hover:underline">
                      {activity.user_name}
                    </ProfileLink>
                    <span className="text-muted-foreground">
                      performed an action
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                    <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
                    <Badge variant="outline" className="text-xs">
                      {activity.activity_type}
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
    }
  }



  if (error) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Feed</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Recent Activity</h2>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Activities */}
      {activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map(renderActivity)}
        </div>
      ) : !isLoading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Activities Yet</h3>
            <p className="text-muted-foreground">
              Start interacting with the community to see activity here.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Posts are now handled through activities above */}

      {/* Load More Button */}
      {hasMore && activities.length > 0 && (
        <div className="text-center">
          <Button 
            onClick={handleLoadMore} 
            variant="outline" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && activities.length === 0 && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="h-10 w-10 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 