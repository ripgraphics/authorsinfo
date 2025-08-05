"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ContentSection } from "@/components/ui/content-section"
import {
  BookOpen,
  User,
  Users,
  Building,
  Star,
  Heart,
  MessageSquare,
  Share2,
  Ellipsis,
  Calendar,
  Loader2
} from "lucide-react"

interface Activity {
  id: string
  activity_type: string
  entity_type: string
  entity_id: string
  data: any
  created_at: string
  user_id: string
  entity_details: any
}

interface TimelineActivitiesProps {
  userId: string
  userAvatarUrl: string
  userName: string
}

export function TimelineActivities({ userId, userAvatarUrl, userName }: TimelineActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true)
        const response = await fetch(`/api/profile/${userId}/activities`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch activities')
        }

        setActivities(data.activities)
      } catch (err) {
        console.error('Error fetching activities:', err)
        setError(err instanceof Error ? err.message : 'Failed to load activities')
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [userId])

  const getActivityIcon = (activityType: string, entityType: string) => {
    switch (activityType) {
      case 'book_added':
      case 'book_updated':
        return <BookOpen className="h-4 w-4" />
      case 'author_created':
      case 'author_updated':
        return <User className="h-4 w-4" />
      case 'publisher_created':
      case 'publisher_updated':
        return <Building className="h-4 w-4" />
      case 'group_created':
      case 'group_joined':
        return <Users className="h-4 w-4" />
      case 'book_reviewed':
      case 'book_rated':
        return <Star className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getActivityText = (activity: Activity) => {
    const { activity_type, entity_type, entity_details, data } = activity

    switch (activity_type) {
      case 'book_added':
        return (
          <>
            added a new book{" "}
            <Link 
              href={`/books/${activity.entity_id}`} 
              className="text-primary hover:underline font-medium"
            >
              {entity_details?.title || data?.book_title || 'Unknown Book'}
            </Link>
            {entity_details?.author && (
              <> by {entity_details.author}</>
            )}
          </>
        )
        
      case 'book_updated':
        return (
          <>
            updated the book{" "}
            <Link 
              href={`/books/${activity.entity_id}`} 
              className="text-primary hover:underline font-medium"
            >
              {entity_details?.title || data?.book_title || 'Unknown Book'}
            </Link>
          </>
        )
        
      case 'author_created':
        return (
          <>
            added a new author{" "}
            <Link 
              href={`/authors/${activity.entity_id}`} 
              className="text-primary hover:underline font-medium"
            >
              {entity_details?.name || data?.author_name || 'Unknown Author'}
            </Link>
            {data?.books_count && (
              <> with {data.books_count} book{data.books_count !== 1 ? 's' : ''}</>
            )}
          </>
        )
        
      case 'author_updated':
        return (
          <>
            updated the author{" "}
            <Link 
              href={`/authors/${activity.entity_id}`} 
              className="text-primary hover:underline font-medium"
            >
              {entity_details?.name || data?.author_name || 'Unknown Author'}
            </Link>
          </>
        )
        
      case 'publisher_created':
        return (
          <>
            added a new publisher{" "}
            <Link 
              href={`/publishers/${activity.entity_id}`} 
              className="text-primary hover:underline font-medium"
            >
              {entity_details?.name || data?.publisher_name || 'Unknown Publisher'}
            </Link>
          </>
        )
        
      case 'publisher_updated':
        return (
          <>
            updated the publisher{" "}
            <Link 
              href={`/publishers/${activity.entity_id}`} 
              className="text-primary hover:underline font-medium"
            >
              {entity_details?.name || data?.publisher_name || 'Unknown Publisher'}
            </Link>
          </>
        )
        
      case 'group_created':
        return (
          <>
            created a new group{" "}
            <Link 
              href={`/groups/${activity.entity_id}`} 
              className="text-primary hover:underline font-medium"
            >
              {entity_details?.name || data?.group_name || 'Unknown Group'}
            </Link>
          </>
        )
        
      case 'group_joined':
        return (
          <>
            joined the group{" "}
            <Link 
              href={`/groups/${activity.entity_id}`} 
              className="text-primary hover:underline font-medium"
            >
              {entity_details?.name || data?.group_name || 'Unknown Group'}
            </Link>
          </>
        )
        
      case 'book_reviewed':
        return (
          <>
            reviewed{" "}
            <Link 
              href={`/books/${activity.entity_id}`} 
              className="text-primary hover:underline font-medium"
            >
              {entity_details?.title || data?.book_title || 'Unknown Book'}
            </Link>
            {data?.rating && (
              <> and gave it {data.rating} star{data.rating !== 1 ? 's' : ''}</>
            )}
          </>
        )
        
      case 'book_rated':
        return (
          <>
            rated{" "}
            <Link 
              href={`/books/${activity.entity_id}`} 
              className="text-primary hover:underline font-medium"
            >
              {entity_details?.title || data?.book_title || 'Unknown Book'}
            </Link>
            {data?.rating && (
              <> {data.rating} star{data.rating !== 1 ? 's' : ''}</>
            )}
          </>
        )
        
      default:
        return (
          <>
            performed action "{activity_type}" on {entity_type}
            {entity_details?.name || entity_details?.title && (
              <>
                {" "}
                <span className="font-medium">
                  {entity_details.name || entity_details.title}
                </span>
              </>
            )}
          </>
        )
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return 'just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days !== 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <ContentSection title="Recent Activity">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading activities...</span>
        </div>
      </ContentSection>
    )
  }

  if (error) {
    return (
      <ContentSection title="Recent Activity">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Failed to load activities</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      </ContentSection>
    )
  }

  if (activities.length === 0) {
    return (
      <ContentSection title="Recent Activity">
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No activities yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Activities will appear here when {userName} starts using the platform
          </p>
        </div>
      </ContentSection>
    )
  }

  return (
    <ContentSection title="Recent Activity">
      <div className="space-y-6">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <span className="relative flex shrink-0 overflow-hidden rounded-full h-10 w-10">
                <img
                  src={userAvatarUrl || "/placeholder.svg?height=200&width=200"}
                  alt={userName}
                  className="aspect-square h-full w-full"
                />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">
                    {userName} {getActivityText(activity)}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    {getActivityIcon(activity.activity_type, activity.entity_type)}
                    {formatTimeAgo(activity.created_at)}
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Show additional content for certain activity types */}
              {activity.data?.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {activity.data.description}
                </p>
              )}
              
              <div className="flex items-center gap-6 mt-4">
                <Button variant="ghost" size="sm" className="gap-1">
                  <Heart className="h-4 w-4" />
                  <span>Like</span>
                </Button>
                <Button variant="ghost" size="sm" className="gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>Comment</span>
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4" />
                  <span className="ml-1">Share</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        {activities.length >= 20 && (
          <div className="text-center pt-4">
            <Button variant="outline">Load More Activities</Button>
          </div>
        )}
      </div>
    </ContentSection>
  )
}