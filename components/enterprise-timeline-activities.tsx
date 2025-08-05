"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ContentSection } from "@/components/ui/content-section"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EntityHoverCard } from "@/components/entity-hover-cards"
// import { useInView } from "react-intersection-observer"
import { useDebounce } from "@/hooks/use-debounce"
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
  Loader2,
  Search,
  Filter,
  Download,
  Eye,
  TrendingUp,
  Clock,
  Zap,
  Shield,
  BarChart3
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
  metadata?: {
    engagement_count?: number
    is_premium?: boolean
    privacy_level?: 'public' | 'friends' | 'private'
    monetization?: {
      price?: number
      currency?: string
      revenue_share?: number
    }
  }
}

interface TimelineAnalytics {
  total_activities: number
  engagement_rate: number
  top_activity_type: string
  average_engagement: number
  revenue_generated: number
  growth_rate: number
}

interface EnterpriseTimelineProps {
  userId: string
  userAvatarUrl: string
  userName: string
  isOwnProfile?: boolean
  privacySettings?: {
    show_activities: boolean
    show_engagement: boolean
    show_revenue: boolean
  }
}

export function EnterpriseTimelineActivities({ 
  userId, 
  userAvatarUrl, 
  userName, 
  isOwnProfile = false,
  privacySettings = {
    show_activities: true,
    show_engagement: true,
    show_revenue: false
  }
}: EnterpriseTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [analytics, setAnalytics] = useState<TimelineAnalytics | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [engagementLoading, setEngagementLoading] = useState<string | null>(null)
  
  const debouncedSearch = useDebounce(searchTerm, 300)

  // Performance: Memoized filtered activities
  const filteredActivities = useMemo(() => {
    let filtered = activities

    // Apply search filter
    if (debouncedSearch) {
      filtered = filtered.filter(activity => {
        const searchLower = debouncedSearch.toLowerCase()
        // Simple text search in activity data
        const entityName = activity.entity_details?.name || 
                          activity.entity_details?.title || 
                          activity.data?.book_title || 
                          activity.data?.author_name || ''
        const activityType = activity.activity_type || ''
        return entityName.toLowerCase().includes(searchLower) || 
               activityType.toLowerCase().includes(searchLower)
      })
    }

    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(activity => activity.activity_type === filter)
    }

    return filtered
  }, [activities, debouncedSearch, filter])

  // Performance: Optimized activity fetching with caching
  const fetchActivities = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(true)
      setError(null) // Clear previous errors
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
        filter: filter,
        search: debouncedSearch
      })

      const response = await fetch(`/api/profile/${userId}/activities?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch activities`)
      }
      
      const data = await response.json()

      if (append) {
        setActivities(prev => [...prev, ...data.activities])
      } else {
        setActivities(data.activities)
      }

      setHasMore(data.has_more)
      setAnalytics(data.analytics)
    } catch (err) {
      console.error('Error fetching activities:', err)
      setError(err instanceof Error ? err.message : 'Failed to load activities')
    } finally {
      setLoading(false)
    }
  }, [userId, filter, debouncedSearch])

  // Performance: Load more functionality (simplified)
  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1)
      fetchActivities(page + 1, true)
    }
  }, [hasMore, loading, page, fetchActivities])

  // Performance: Debounced search
  useEffect(() => {
    setPage(1)
    fetchActivities(1, false)
  }, [debouncedSearch, filter, fetchActivities])

  // Enterprise: Engagement tracking
  const handleEngagement = useCallback(async (activityId: string, action: 'like' | 'comment' | 'share') => {
    setEngagementLoading(activityId)
    try {
      const response = await fetch('/api/activities/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_id: activityId, action })
      })
      
      if (response.ok) {
        // Update local state optimistically
        setActivities(prev => prev.map(activity => 
          activity.id === activityId 
            ? { 
                ...activity, 
                metadata: {
                  ...activity.metadata,
                  engagement_count: ((activity.metadata?.engagement_count || 0) + 1)
                }
              }
            : activity
        ))
      }
    } catch (error) {
      console.error('Error tracking engagement:', error)
    } finally {
      setEngagementLoading(null)
    }
  }, [])

  // Enterprise: Analytics display
  const renderAnalytics = () => {
    if (!analytics || !privacySettings.show_engagement) return null

    return (
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Timeline Analytics
          </h3>
          <Badge variant="secondary" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {analytics.growth_rate}% growth
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{analytics.total_activities}</div>
            <div className="text-sm text-muted-foreground">Total Activities</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{analytics.engagement_rate}%</div>
            <div className="text-sm text-muted-foreground">Engagement Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{analytics.average_engagement}</div>
            <div className="text-sm text-muted-foreground">Avg. Engagement</div>
          </div>
          {privacySettings.show_revenue && (
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">${analytics.revenue_generated}</div>
              <div className="text-sm text-muted-foreground">Revenue Generated</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Performance: Memoized activity rendering
  const renderActivity = useCallback((activity: Activity) => {
    const isPremium = activity.metadata?.is_premium || false
    const engagementCount = activity.metadata?.engagement_count || 0

    return (
      <div key={activity.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-4 mb-4">
        {/* Header Section - Facebook Style */}
        <div className="flex items-start space-x-3 mb-4">
          <div className="flex-shrink-0">
            <span className="relative flex shrink-0 overflow-hidden rounded-full h-10 w-10">
              <img
                src={userAvatarUrl || "/placeholder.svg?height=200&width=200"}
                alt={userName}
                className="aspect-square h-full w-full object-cover"
              />
              {isPremium && (
                <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                  <Star className="h-3 w-3 text-white" />
                </div>
              )}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm">
                    {userName}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {getActivityText(activity)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                  {formatTimeAgo(activity.created_at)}
                  {activity.metadata?.privacy_level && (
                    <Badge variant="outline" className="text-xs">
                      {activity.metadata.privacy_level}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {privacySettings.show_engagement && engagementCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    {engagementCount}
                  </Badge>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Section */}
        {activity.data?.description && (
          <p className="mt-3 text-sm text-gray-700 leading-relaxed">
            {activity.data.description}
          </p>
        )}
        
        {/* Enterprise: Show review text for book reviews */}
        {activity.activity_type === 'book_reviewed' && activity.data?.review_text && (
          <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-sm italic text-gray-700 leading-relaxed">"{activity.data.review_text}"</p>
            {activity.data?.rating && (
              <div className="flex items-center mt-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-4 w-4 ${
                      i < activity.data.rating 
                        ? "text-yellow-500 fill-yellow-500" 
                        : "text-gray-300"
                    }`} 
                  />
                ))}
                <span className="ml-2 text-xs text-gray-500">
                  {activity.data.rating}/5 stars
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Enterprise: Show reading progress for progress updates */}
        {activity.activity_type === 'reading_progress' && activity.data?.progress_percentage && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Reading Progress</span>
              <span>{activity.data.progress_percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${activity.data.progress_percentage}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Action Buttons Section */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            onClick={() => handleEngagement(activity.id, 'like')}
            disabled={engagementLoading === activity.id}
          >
            <Heart className="h-4 w-4" />
            <span>Like</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 text-gray-600 hover:text-green-600 hover:bg-green-50"
            onClick={() => handleEngagement(activity.id, 'comment')}
            disabled={engagementLoading === activity.id}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Comment</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="gap-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50"
            onClick={() => handleEngagement(activity.id, 'share')}
            disabled={engagementLoading === activity.id}
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
          
          {isPremium && activity.metadata?.monetization && (
            <Badge variant="default" className="bg-yellow-500 text-white ml-auto">
              <Zap className="h-3 w-3 mr-1" />
              ${activity.metadata.monetization.price}
            </Badge>
          )}
        </div>
      </div>
    )
  }, [userAvatarUrl, userName, privacySettings, handleEngagement, engagementLoading])

  // Performance: Loading skeleton
  const renderSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start space-x-4 p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  if (error) {
    return (
      <ContentSection title="Recent Activity">
        <div className="text-center py-8">
          <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <p className="text-muted-foreground">Failed to load activities</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <Button onClick={() => fetchActivities(1, false)} className="mt-4">
            Retry
          </Button>
        </div>
      </ContentSection>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Enterprise Analytics Header */}
      {analytics && privacySettings.show_engagement && (
        <div className="mb-6">
          {renderAnalytics()}
        </div>
      )}
      
      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="book">Book Activities</SelectItem>
              <SelectItem value="author">Author Activities</SelectItem>
              <SelectItem value="publisher">Publisher Activities</SelectItem>
              <SelectItem value="group">Group Activities</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Activities Feed */}
      <div className="space-y-4">
        {loading ? (
          renderSkeleton()
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">Error loading activities</div>
            <Button onClick={fetchActivities} variant="outline">
              <Loader2 className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-2">No activities found</div>
            <p className="text-sm text-muted-foreground">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Activities will appear here when you interact with books, authors, and other content'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map(renderActivity)}
            
            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-4">
                <Button 
                  onClick={handleLoadMore} 
                  variant="outline"
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Load More Activities
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Performance: Memoized helper functions
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
      case 'profile_updated':
        return <User className="h-4 w-4" />
      case 'author_followed':
        return <User className="h-4 w-4" />
      case 'reading_progress':
        return <BookOpen className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
  }
}

const getActivityText = (activity: Activity): React.ReactNode => {
  const { activity_type, entity_type, entity_details, data } = activity

  switch (activity_type) {
    case 'book_added':
      return (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {/* Book Cover Image */}
              <Link href={`/books/${activity.entity_id}`}>
                <div className="relative w-16 h-24 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {entity_details?.cover_image?.url || entity_details?.cover_image_url ? (
                    <Image
                      src={entity_details.cover_image?.url || entity_details.cover_image_url}
                      alt={entity_details?.title || data?.book_title || 'Book Cover'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </Link>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm">
                added{" "}
                <Link 
                  href={`/books/${activity.entity_id}`} 
                  className="text-primary hover:underline font-medium"
                >
                  {entity_details?.title || data?.book_title || 'Unknown Book'}
                </Link>
                {entity_details?.author && (
                  <> by{" "}
                    <EntityHoverCard
                      type="author"
                      entity={{
                        id: entity_details.author.id,
                        name: entity_details.author.name,
                        author_image: entity_details.author.author_image,
                        bookCount: entity_details.author.bookCount || 0
                      }}
                    >
                      <span className="text-primary hover:underline cursor-pointer">
                        {entity_details.author.name}
                      </span>
                    </EntityHoverCard>
                  </>
                )}
                {data?.book_author && !entity_details?.author && (
                  <> by {data.book_author}</>
                )}
                {data?.shelf && (
                  <> to {data.shelf}</>
                )}
              </div>
            </div>
          </div>
        </div>
      )
      
    case 'book_updated':
      return (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {/* Book Cover Image */}
              <Link href={`/books/${activity.entity_id}`}>
                <div className="relative w-16 h-24 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {entity_details?.cover_image?.url || entity_details?.cover_image_url ? (
                    <Image
                      src={entity_details.cover_image?.url || entity_details.cover_image_url}
                      alt={entity_details?.title || data?.book_title || 'Book Cover'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </Link>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm">
                updated the book{" "}
                <Link 
                  href={`/books/${activity.entity_id}`} 
                  className="text-primary hover:underline font-medium"
                >
                  {entity_details?.title || data?.book_title || 'Unknown Book'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )
      
    case 'book_reviewed':
      return (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {/* Book Cover Image */}
              <Link href={`/books/${activity.entity_id}`}>
                <div className="relative w-16 h-24 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {entity_details?.cover_image?.url || entity_details?.cover_image_url ? (
                    <Image
                      src={entity_details.cover_image?.url || entity_details.cover_image_url}
                      alt={entity_details?.title || data?.book_title || 'Book Cover'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </Link>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm">
                reviewed{" "}
                <Link 
                  href={`/books/${activity.entity_id}`} 
                  className="text-primary hover:underline font-medium"
                >
                  {entity_details?.title || data?.book_title || 'Unknown Book'}
                </Link>
                {entity_details?.author && (
                  <> by{" "}
                    <EntityHoverCard
                      type="author"
                      entity={{
                        id: entity_details.author.id,
                        name: entity_details.author.name,
                        author_image: entity_details.author.author_image,
                        bookCount: entity_details.author.bookCount || 0
                      }}
                    >
                      <span className="text-primary hover:underline cursor-pointer">
                        {entity_details.author.name}
                      </span>
                    </EntityHoverCard>
                  </>
                )}
                {data?.book_author && !entity_details?.author && (
                  <> by {data.book_author}</>
                )}
              </div>
            </div>
          </div>
        </div>
      )
      
    case 'reading_progress':
      return (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {/* Book Cover Image */}
              <Link href={`/books/${activity.entity_id}`}>
                <div className="relative w-16 h-24 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {entity_details?.cover_image?.url || entity_details?.cover_image_url ? (
                    <Image
                      src={entity_details.cover_image?.url || entity_details.cover_image_url}
                      alt={entity_details?.title || data?.book_title || 'Book Cover'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </Link>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm">
                updated reading progress for{" "}
                <Link 
                  href={`/books/${activity.entity_id}`} 
                  className="text-primary hover:underline font-medium"
                >
                  {entity_details?.title || data?.book_title || 'Unknown Book'}
                </Link>
                {entity_details?.author && (
                  <> by{" "}
                    <EntityHoverCard
                      type="author"
                      entity={{
                        id: entity_details.author.id,
                        name: entity_details.author.name,
                        author_image: entity_details.author.author_image,
                        bookCount: entity_details.author.bookCount || 0
                      }}
                    >
                      <span className="text-primary hover:underline cursor-pointer">
                        {entity_details.author.name}
                      </span>
                    </EntityHoverCard>
                  </>
                )}
                {data?.book_author && !entity_details?.author && (
                  <> by {data.book_author}</>
                )}
              </div>
            </div>
          </div>
        </div>
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
      
    case 'group_updated':
      return (
        <>
          updated the group{" "}
          <Link 
            href={`/groups/${activity.entity_id}`} 
            className="text-primary hover:underline font-medium"
          >
            {entity_details?.name || data?.group_name || 'Unknown Group'}
          </Link>
        </>
      )
      
    case 'rating':
      return (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {/* Book Cover Image */}
              <Link href={`/books/${activity.entity_id}`}>
                <div className="relative w-16 h-24 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {entity_details?.cover_image?.url || entity_details?.cover_image_url ? (
                    <Image
                      src={entity_details.cover_image?.url || entity_details.cover_image_url}
                      alt={entity_details?.title || data?.book_title || 'Book Cover'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </Link>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm">
                rated{" "}
                <Link 
                  href={`/books/${activity.entity_id}`} 
                  className="text-primary hover:underline font-medium"
                >
                  {entity_details?.title || data?.book_title || 'Unknown Book'}
                </Link>
                {entity_details?.author && (
                  <> by{" "}
                    <EntityHoverCard
                      type="author"
                      entity={{
                        id: entity_details.author.id,
                        name: entity_details.author.name,
                        author_image: entity_details.author.author_image,
                        bookCount: entity_details.author.bookCount || 0
                      }}
                    >
                      <span className="text-primary hover:underline cursor-pointer">
                        {entity_details.author.name}
                      </span>
                    </EntityHoverCard>
                  </>
                )}
                {data?.book_author && !entity_details?.author && (
                  <> by {data.book_author}</>
                )}
                {data?.rating && (
                  <> with {data.rating} stars</>
                )}
              </div>
            </div>
          </div>
        </div>
      )
      
    case 'finished':
      return (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {/* Book Cover Image */}
              <Link href={`/books/${activity.entity_id}`}>
                <div className="relative w-16 h-24 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {entity_details?.cover_image?.url || entity_details?.cover_image_url ? (
                    <Image
                      src={entity_details.cover_image?.url || entity_details.cover_image_url}
                      alt={entity_details?.title || data?.book_title || 'Book Cover'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </Link>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm">
                finished reading{" "}
                <Link 
                  href={`/books/${activity.entity_id}`} 
                  className="text-primary hover:underline font-medium"
                >
                  {entity_details?.title || data?.book_title || 'Unknown Book'}
                </Link>
                {entity_details?.author && (
                  <> by{" "}
                    <EntityHoverCard
                      type="author"
                      entity={{
                        id: entity_details.author.id,
                        name: entity_details.author.name,
                        author_image: entity_details.author.author_image,
                        bookCount: entity_details.author.bookCount || 0
                      }}
                    >
                      <span className="text-primary hover:underline cursor-pointer">
                        {entity_details.author.name}
                      </span>
                    </EntityHoverCard>
                  </>
                )}
                {data?.book_author && !entity_details?.author && (
                  <> by {data.book_author}</>
                )}
              </div>
            </div>
          </div>
        </div>
      )
      
    case 'added':
      return (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {/* Book Cover Image */}
              <Link href={`/books/${activity.entity_id}`}>
                <div className="relative w-16 h-24 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {entity_details?.cover_image?.url || entity_details?.cover_image_url ? (
                    <Image
                      src={entity_details.cover_image?.url || entity_details.cover_image_url}
                      alt={entity_details?.title || data?.book_title || 'Book Cover'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </Link>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm">
                added{" "}
                <Link 
                  href={`/books/${activity.entity_id}`} 
                  className="text-primary hover:underline font-medium"
                >
                  {entity_details?.title || data?.book_title || 'Unknown Book'}
                </Link>
                {entity_details?.author && (
                  <> by{" "}
                    <EntityHoverCard
                      type="author"
                      entity={{
                        id: entity_details.author.id,
                        name: entity_details.author.name,
                        author_image: entity_details.author.author_image,
                        bookCount: entity_details.author.bookCount || 0
                      }}
                    >
                      <span className="text-primary hover:underline cursor-pointer">
                        {entity_details.author.name}
                      </span>
                    </EntityHoverCard>
                  </>
                )}
                {data?.book_author && !entity_details?.author && (
                  <> by {data.book_author}</>
                )}
                {data?.shelf && (
                  <> to {data.shelf}</>
                )}
              </div>
            </div>
          </div>
        </div>
      )
      
    default:
      return (
        <>
          performed {activity_type} on {entity_type} {activity.entity_id}
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