'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef, useTransition } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import EntityFeedCard from '../entity-feed-card'
import EntityAvatar from '../entity-avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Textarea } from '../ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  MessageSquare,
  Image as ImageIcon,
  Link as LinkIcon,
  Calendar,
  Users,
  BookOpen,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Settings,
  Shield,
  Activity,
  BarChart3,
  Zap,
  Plus,
  Send,
  Sparkles,
  Globe,
  Lock,
  Users2,
  AtSign,
  Hash,
  Smile,
  Camera,
  Video,
  Mic,
  FileText,
  Link,
  MapPin,
  CalendarDays,
  Star,
  Target,
  TrendingUp as TrendingUpIcon,
  Bot,
  Crown,
  Gift,
  Rocket,
  Flame,
  Lightbulb,
  Compass,
  Network,
  UserPlus,
  UserCheck,
  UserX,
  HeartHandshake,
  MessageSquarePlus,
  Share,
  BookOpenCheck,
  Award,
  Trophy,
  Medal,
  BadgeCheck,
  Verified,
  Sparkles as SparklesIcon,
  Copy,
  Check,
  Info,
} from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { isValidLikeReactionType } from '@/lib/engagement/config'
import { useEngagement } from '@/contexts/engagement-context'
import { SophisticatedPhotoGrid } from '../photo-gallery/sophisticated-photo-grid'
import PostButton from '../ui/post-button'
import { FeedPost } from '@/types/feed'
import { CreatePostModal } from './create-post-modal'
import type { LinkPreviewMetadata } from '@/types/link-preview'

// ============================================================================
// PERFORMANCE OPTIMIZED INTERFACES
// ============================================================================

interface EnterpriseActivity {
  id: string
  user_id: string
  user_name: string
  user_avatar_url: string | null
  activity_type: string
  data: any
  created_at: string
  is_public: boolean
  like_count: number
  comment_count: number
  is_liked: boolean
  entity_type: string
  entity_id: string
  sentiment?: 'positive' | 'negative' | 'neutral'
  is_verified?: boolean
  is_bookmarked?: boolean
  is_following?: boolean
  content_safety_score?: number
  cross_posted_to?: string[]
  original_post_id?: string
  collaboration_type?: 'individual' | 'collaborative' | 'team'
  ai_enhanced?: boolean
  content_quality_score?: number
  viral_potential?: number
  reach_estimate?: number
  engagement_prediction?: number
  trending_score?: number
  social_influence?: number
  content_category?: string
  target_audience?: string[]
  monetization_status?: 'free' | 'premium' | 'sponsored'
  content_rights?: 'public' | 'licensed' | 'restricted'
  collaboration_members?: string[]
  ai_generated_tags?: string[]
  sentiment_breakdown?: {
    positive: number
    neutral: number
    negative: number
    mixed: number
  }
  content_insights?: {
    readability_score: number
    complexity_level: string
    topic_clustering: string[]
    keyword_density: Record<string, number>
    content_length_optimal: boolean
    engagement_hotspots: string[]
  }
  content_type?: string
  image_url?: string
  text?: string
  link_url?: string
  visibility?: string
  content_summary?: string
  hashtags?: string[]
  share_count?: number
  view_count?: number
  engagement_score?: number
  metadata?: any
  user_reaction_type?: string | null
}

// ============================================================================
// PERFORMANCE CONSTANTS
// ============================================================================

const PAGE_SIZE = 20
const MAX_RETRIES = 3
const DEBOUNCE_DELAY = 300
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const VIRTUAL_SCROLL_THRESHOLD = 100 // Enable virtual scrolling for 100+ items
const MAX_POST_CHARS = 25000
const MAX_COMPOSER_LINES = 9

// ============================================================================
// PERFORMANCE OPTIMIZED COMPONENT
// ============================================================================

const EnterpriseTimelineActivities = React.memo(
  ({
    entityId,
    entityType = 'user',
    isOwnEntity = false,
    entityDisplayInfo,
    showAnalytics = true,
    enableModeration = true,
    enableAI = true,
    enableAudit = true,
    enableRealTime = true,
    enableCrossPosting = true,
    enableCollaboration = true,
    enableAICreation = true,
    enableSocialNetworking = true,
    enableMonetization = true,
    enableReadingProgress = true,
    enablePrivacyControls = true,
    profileOwnerUserStats,
  }: {
    entityId: string
    entityType?: 'user' | 'author' | 'publisher' | 'group' | 'event' | 'book'
    isOwnEntity?: boolean
    entityDisplayInfo?: {
      id: string
      name: string
      type: string
      author_image?: string
      bookCount?: number
    }
    showAnalytics?: boolean
    enableModeration?: boolean
    enableAI?: boolean
    enableAudit?: boolean
    enableRealTime?: boolean
    enableCrossPosting?: boolean
    enableCollaboration?: boolean
    enableAICreation?: boolean
    enableSocialNetworking?: boolean
    enableMonetization?: boolean
    enableReadingProgress?: boolean
    enablePrivacyControls?: boolean
    profileOwnerUserStats?: {
      booksRead: number
      friendsCount: number
      followersCount: number
      location: string | null
      website: string | null
      joinedDate: string
    }
  }) => {
    const { user } = useAuth()
    const { toast } = useToast()
    const { batchUpdateEngagement } = useEngagement()
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const currentUserName = (user as any)?.name || (user as any)?.user_metadata?.full_name || (user as any)?.email || 'User'

    // ============================================================================
    // PERFORMANCE OPTIMIZED STATE MANAGEMENT
    // ============================================================================

    const [activities, setActivities] = useState<EnterpriseActivity[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [retryCount, setRetryCount] = useState(0)
    const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
    const [isPending, startTransition] = useTransition()
    // Composer & posting state
    const defaultVisibility = 'public'
    const [postForm, setPostForm] = useState({
      contentType: 'text',
      visibility: defaultVisibility as 'friends' | 'followers' | 'private' | 'public',
      imageUrl: '',
      linkUrl: '',
      hashtags: '',
    })
    const [isPosting, setIsPosting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    // Top post composer state (two-state, like comment composer)
    const [isTopComposerActive, setIsTopComposerActive] = useState(false)
    // Modal state for post creation
    const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false)
    // Permissions and connections
    const [userConnections, setUserConnections] = useState<{
      friends: string[]
      followers: string[]
      following: string[]
    }>({ friends: [], followers: [], following: [] })
    // Reading progress / privacy
    const [readingProgress, setReadingProgress] = useState<any>(null)
    const [privacySettings, setPrivacySettings] = useState<any>(null)
    const [privacySettingsLoading, setPrivacySettingsLoading] = useState(false)
    // Moderation & analytics & filters
    const [moderationSettings, setModerationSettings] = useState({
      autoModerate: true,
      safetyThreshold: 0.6,
    })
    const [analytics, setAnalytics] = useState({
      total_activities: 0,
      total_engagement: 0,
      average_engagement_rate: 0,
    })
    const [filters, setFilters] = useState({
      search_query: '',
      date_range: 'all' as 'all' | '1d' | '7d' | '30d',
      content_type: 'all' as 'all' | 'text' | 'image' | 'link',
    })

    // Performance optimization: Memoized refs
    const observerRef = useRef<IntersectionObserver | null>(null)
    const loadingRef = useRef<HTMLDivElement>(null)
    const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map())

    // ============================================================================
    // PERFORMANCE OPTIMIZED MEMOIZED VALUES
    // ============================================================================

    // Memoize entity type for performance
    const memoizedEntityType = useMemo(() => entityType, [entityType])

    // Memoize user ID for performance
    const memoizedUserId = useMemo(() => entityId, [entityId])

    // Memoize page size for performance
    const memoizedPageSize = useMemo(() => PAGE_SIZE, [])

    // ============================================================================
    // PERFORMANCE OPTIMIZED CALLBACKS
    // ============================================================================

    // Optimized data fetching with caching
    const fetchActivities = useCallback(
      async (pageNum = 1, append = false) => {
        try {
          setError(null)
          const startTime = performance.now()

          // Performance optimization: Check cache first
          const cacheKey = `${memoizedEntityType}_${memoizedUserId}_${pageNum}`
          const cached = cacheRef.current.get(cacheKey)

          if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('🚀 Using cached data for:', cacheKey)
            const data = cached.data

            if (append) {
              setActivities((prev) => [...prev, ...(data || [])])
            } else {
              setActivities(data || [])
            }

            setHasMore((data || []).length === memoizedPageSize)
            setLastFetchTime(new Date())
            return
          }

          // Resolve permalink to UUID when necessary
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          let resolvedEntityId = memoizedUserId
          if (!uuidRegex.test(resolvedEntityId)) {
            try {
              const table = memoizedEntityType === 'user' ? 'users' : `${memoizedEntityType}s`
              const { data: entityRow } = await supabase
                .from(table)
                .select('id, permalink')
                .or(`id.eq.${resolvedEntityId},permalink.eq.${resolvedEntityId}`)
                .maybeSingle()
              if (entityRow?.id) {
                resolvedEntityId = entityRow.id
              }
            } catch (e) {
              console.warn('Permalink resolution failed (continuing with provided id):', e)
            }
          }

          // Fetch via server API to avoid client network/env issues
          const rangeStart = (pageNum - 1) * memoizedPageSize
          const url = `/api/timeline?entityType=${encodeURIComponent(memoizedEntityType)}&entityId=${encodeURIComponent(resolvedEntityId)}&limit=${memoizedPageSize}&offset=${rangeStart}`
          const resp = await fetch(url, { method: 'GET', credentials: 'include' })
          if (!resp.ok) {
            const text = await resp.text()
            throw new Error(`Database query error: ${text || resp.status}`)
          }
          const json = await resp.json()
          const rows = json.activities || []

          const data: EnterpriseActivity[] = (rows || []).map((row: any) => ({
            id: row.id,
            user_id: row.user_id,
            user_name: row.user_name,
            user_avatar_url: row.user_avatar_url,
            activity_type: row.activity_type,
            data: row.data,
            created_at: row.created_at,
            is_public: row.is_public,
            like_count: row.like_count || 0,
            comment_count: row.comment_count || 0,
            is_liked: !!row.user_reaction_type,
            entity_type: row.entity_type,
            entity_id: row.entity_id,
            content_type: row.content_type,
            image_url: row.image_url,
            text: row.text,
            visibility: row.visibility,
            content_summary: row.content_summary,
            link_url: row.link_url,
            hashtags: row.hashtags || [],
            share_count: row.share_count || 0,
            view_count: row.view_count || 0,
            engagement_score: row.engagement_score || 0,
            metadata: row.metadata || {},
            user_reaction_type: row.user_reaction_type ?? null,
          }))

          const fetchTime = performance.now() - startTime

          // Performance optimization: Cache the result
          cacheRef.current.set(cacheKey, { data, timestamp: Date.now() })

          // Hydrate engagement context once at data layer (server as source of truth)
          const toHydrate = data || []
          if (toHydrate.length > 0) {
            batchUpdateEngagement(
              toHydrate.map((post) => ({
                entityId: post.id,
                entityType: 'activity' as const,
                updates: {
                  reactionCount: post.like_count ?? 0,
                  commentCount: post.comment_count ?? 0,
                  shareCount: post.share_count ?? 0,
                  userReaction:
                    post.user_reaction_type && isValidLikeReactionType(post.user_reaction_type)
                      ? post.user_reaction_type
                      : null,
                },
              }))
            )
          }

          // Performance optimization: Use transition for non-urgent updates
          startTransition(() => {
            if (append) {
              setActivities((prev) => [...prev, ...(data || [])])
            } else {
              setActivities(data || [])
            }

            setHasMore((data || []).length === memoizedPageSize)
            setLastFetchTime(new Date())
            setRetryCount(0)
          })
        } catch (err) {
          console.error('Error fetching activities:', err)

          if (retryCount < MAX_RETRIES) {
            setRetryCount((prev) => prev + 1)
            const backoffDelay = Math.pow(2, retryCount) * 1000

            setTimeout(() => {
              fetchActivities(pageNum, append)
            }, backoffDelay)
          } else {
            setError(err instanceof Error ? err.message : 'Failed to fetch activities')
          }
        } finally {
          if (!append) {
            setLoading(false)
          }
          setIsLoadingMore(false)
        }
      },
      [memoizedEntityType, memoizedUserId, memoizedPageSize, retryCount, supabase]
    )

    // Performance optimization: Debounced search
    const debouncedSearch = useCallback(
      debounce((query: string) => {
        // Implement search logic here
        console.log('Searching for:', query)
      }, DEBOUNCE_DELAY),
      []
    )

    // Performance optimization: Intersection observer for infinite scroll
    const setupInfiniteScroll = useCallback(() => {
      if (!loadingRef.current) return

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const target = entries[0]
          if (target.isIntersecting && hasMore && !isLoadingMore) {
            setIsLoadingMore(true)
            fetchActivities(page + 1, true)
            setPage((prev) => prev + 1)
          }
        },
        { threshold: 0.1 }
      )

      observerRef.current.observe(loadingRef.current)

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect()
        }
      }
    }, [hasMore, isLoadingMore, page, fetchActivities])

    // ============================================================================
    // PERFORMANCE OPTIMIZED EFFECTS
    // ============================================================================

    // Initial data fetch
    useEffect(() => {
      fetchActivities(1, false)
    }, [fetchActivities])

    // Setup infinite scroll
    useEffect(() => {
      const cleanup = setupInfiniteScroll()
      return cleanup
    }, [setupInfiniteScroll])

    // ============================================================================
    // PERMISSIONS, CONNECTIONS, PRIVACY, READING PROGRESS
    // ============================================================================

    const canUserPostOnTimeline = useCallback(
      async (
        posterUserId: string,
        timelineUserId: string
      ): Promise<{ canPost: boolean; reason?: string }> => {
        if (!posterUserId || !timelineUserId) return { canPost: false, reason: 'Invalid users' }
        if (posterUserId === timelineUserId) return { canPost: true }
        try {
          // Owner override setting lives in user_privacy_settings.default_privacy_level
          // Interpret levels for posting:
          // - public: any authenticated user can post
          // - followers: followers or friends can post
          // - friends: only friends can post
          // - private: only owner can post (already handled above)
          const { data: privacyData } = await supabase
            .from('user_privacy_settings')
            .select('default_privacy_level')
            .eq('user_id', timelineUserId)
            .maybeSingle()
          const level = (privacyData?.default_privacy_level as string | undefined) || 'public'

          if (level === 'public') {
            return { canPost: true }
          }

          if (level === 'followers') {
            const { data: followData } = await supabase
              .from('follows')
              .select('follower_id, following_id, status')
              .or(
                `and(follower_id.eq.${posterUserId},following_id.eq.${timelineUserId}),and(follower_id.eq.${timelineUserId},following_id.eq.${posterUserId})`
              )
            const isFollower =
              followData?.some(
                (r) =>
                  r.follower_id === posterUserId &&
                  r.following_id === timelineUserId &&
                  (r as any).status === 'accepted'
              ) || false
            return { canPost: isFollower, reason: 'Only followers can post' }
          }

          if (level === 'friends') {
            const { data: friendshipData, error: friendshipError } = await supabase
              .from('user_friends')
              .select('status')
              .or(
                `and(user_id.eq.${posterUserId},friend_id.eq.${timelineUserId}),and(user_id.eq.${timelineUserId},friend_id.eq.${posterUserId})`
              )
              .maybeSingle()
            if (friendshipError && (friendshipError as any).code !== 'PGRST116') {
              console.warn('Error checking friendship:', friendshipError)
            }
            return {
              canPost: friendshipData?.status === 'accepted',
              reason: 'Only friends can post',
            }
          }

          // private or unknown -> deny
          return { canPost: false, reason: 'Posting disabled' }
        } catch (e) {
          console.warn('Permission check failed:', e)
          return { canPost: false, reason: 'Error checking permissions' }
        }
      },
      [supabase]
    )

    const fetchUserConnections = useCallback(async () => {
      if (!user) return
      try {
        // Get user target type ID for follows queries
        const { data: userTargetType } = await supabase
          .from('follow_target_types')
          .select('id')
          .eq('name', 'user')
          .single()

        if (!userTargetType) {
          console.warn('Could not find user target type')
          return
        }

        const [{ data: friends }, { data: followers }, { data: following }] = await Promise.all([
          supabase
            .from('user_friends')
            .select('friend_id')
            .eq('user_id', user.id)
            .eq('status', 'accepted'),
          supabase
            .from('follows')
            .select('follower_id')
            .eq('following_id', user.id)
            .eq('target_type_id', userTargetType.id),
          supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id)
            .eq('target_type_id', userTargetType.id),
        ])
        setUserConnections({
          friends: friends?.map((f) => f.friend_id) || [],
          followers: followers?.map((f) => f.follower_id) || [],
          following: following?.map((f) => f.following_id) || [],
        })
      } catch (e) {
        console.warn('Error fetching connections:', e)
      }
    }, [user, supabase])

    const fetchReadingProgress = useCallback(async () => {
      try {
        if (!enableReadingProgress) return
        // Placeholder hook to keep parity; real endpoint optional
        setReadingProgress(null)
      } catch { }
    }, [enableReadingProgress])

    const fetchPrivacySettings = useCallback(async () => {
      try {
        if (!enablePrivacyControls || memoizedEntityType !== 'user') return
        setPrivacySettingsLoading(true)
        const { data } = await supabase
          .from('user_privacy_settings')
          .select('default_privacy_level')
          .eq('user_id', memoizedUserId)
          .maybeSingle()
        setPrivacySettings(data || null)
      } catch (e) {
        console.warn('Error fetching privacy settings:', e)
      } finally {
        setPrivacySettingsLoading(false)
      }
    }, [enablePrivacyControls, supabase, memoizedEntityType, memoizedUserId])

    // Performance optimization: Cleanup cache on unmount
    useEffect(() => {
      return () => {
        cacheRef.current.clear()
      }
    }, [])

    // Connections, privacy, reading progress
    useEffect(() => {
      fetchUserConnections()
      fetchPrivacySettings()
      fetchReadingProgress()
    }, [fetchUserConnections, fetchPrivacySettings, fetchReadingProgress])

    // Real-time updates: refetch on new activity affecting this timeline
    useEffect(() => {
      if (!enableRealTime) return
      const channel = supabase
        .channel('timeline-updates-optimized')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'activities' },
          (payload) => {
            const row = (payload.new || payload.old) as any
            if (!row) return
            if (row.entity_type === memoizedEntityType && row.entity_id === memoizedUserId) {
              fetchActivities(1, false)
            }
          }
        )
        .subscribe()
      return () => {
        try {
          supabase.removeChannel(channel)
        } catch { }
      }
    }, [enableRealTime, supabase, memoizedEntityType, memoizedUserId, fetchActivities])

    // ============================================================================
    // PERFORMANCE OPTIMIZED RENDER FUNCTIONS
    // ============================================================================

    // Transform EnterpriseActivity to FeedPost
    const transformActivityToPost = useCallback(
      (activity: EnterpriseActivity): FeedPost => ({
        id: activity.id,
        user_id: activity.user_id,
        activity_type: activity.activity_type,
        entity_type: activity.entity_type,
        entity_id: activity.entity_id,
        is_public: activity.is_public,
        metadata: activity.metadata,
        created_at: activity.created_at,
        user_name: activity.user_name,
        user_avatar_url: activity.user_avatar_url || undefined,
        like_count: activity.like_count,
        comment_count: activity.comment_count,
        share_count: activity.share_count,
        is_liked: activity.is_liked,
        text: activity.text,
        image_url: activity.image_url,
        link_url: activity.link_url,
        visibility: activity.visibility,
        content_type: activity.content_type,
        content_summary: activity.content_summary,
        content_safety_score: activity.content_safety_score,
        user_has_reacted: activity.is_liked,
        user_has_commented: false, // Default value
        user_has_shared: false, // Default value
        user_reaction_type: activity.user_reaction_type ?? undefined,
        user_has_bookmarked: activity.is_bookmarked || false,
        user_has_viewed: false, // Default value
        view_count: activity.view_count,
        bookmark_count: 0, // Default value
        tags: activity.hashtags || [],
        scheduled_at: undefined, // Default value
        is_featured: false, // Default value
        is_pinned: false, // Default value
        is_verified: activity.is_verified || false,
        engagement_score: activity.engagement_score,
      }),
      []
    )

    // Memoized activity renderer
    const renderActivity = useCallback(
      (activity: EnterpriseActivity, index: number) => {
        const post = transformActivityToPost(activity)
        return (
          <div key={`${activity.id}_${index}`} className="enterprise-feed-card">
            <EntityFeedCard
              post={post}
              showActions={true}
              showComments={true}
              showEngagement={true}
              className=""
              onPostUpdated={handlePostUpdated}
              onPostDeleted={handlePostDeleted}
              profileOwnerId={entityType === 'user' ? entityId : undefined}
              profileOwnerUserStats={profileOwnerUserStats ?? undefined}
            />
          </div>
        )
      },
      [transformActivityToPost, entityType, entityId, profileOwnerUserStats]
    )

    // Memoized loading skeleton
    const renderLoadingSkeleton = useCallback(
      () => (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded-sm w-3/4" />
                    <div className="h-4 bg-gray-200 rounded-sm w-1/2" />
                    <div className="h-32 bg-gray-200 rounded-sm w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ),
      []
    )

    // ============================================================================
    // FILTERS, ANALYTICS, MODERATION
    // ============================================================================

    const filteredActivities = useMemo(() => {
      let list = activities
      if (filters.search_query) {
        const q = filters.search_query.toLowerCase()
        list = list.filter(
          (a) =>
            (a.text || a.data?.content || '').toLowerCase().includes(q) ||
            (a.user_name || '').toLowerCase().includes(q)
        )
      }
      if (filters.content_type !== 'all') {
        list = list.filter((a) => (a.content_type || 'text') === filters.content_type)
      }
      if (filters.date_range !== 'all') {
        const now = new Date()
        const cutoff = new Date()
        if (filters.date_range === '1d') cutoff.setDate(now.getDate() - 1)
        if (filters.date_range === '7d') cutoff.setDate(now.getDate() - 7)
        if (filters.date_range === '30d') cutoff.setDate(now.getDate() - 30)
        list = list.filter((a) => new Date(a.created_at) >= cutoff)
      }
      return list
    }, [activities, filters])

    useEffect(() => {
      const totalEngagement = filteredActivities.reduce(
        (sum, a) => sum + (a.like_count || 0) + (a.comment_count || 0),
        0
      )
      const average = filteredActivities.length
        ? (totalEngagement / filteredActivities.length) * 100
        : 0
      setAnalytics({
        total_activities: filteredActivities.length,
        total_engagement: totalEngagement,
        average_engagement_rate: average,
      })
    }, [filteredActivities])

    const renderAnalyticsDashboard = useCallback(() => {
      if (!showAnalytics) return null
      return (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-semibold">{analytics.total_activities}</div>
                <div className="text-xs text-muted-foreground">Posts</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">{analytics.total_engagement}</div>
                <div className="text-xs text-muted-foreground">Engagement</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">{filteredActivities.length}</div>
                <div className="text-xs text-muted-foreground">Visible</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }, [analytics, filteredActivities.length, showAnalytics])

    const renderAdvancedFilters = useCallback(
      () => (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search posts..."
                  value={filters.search_query}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search_query: e.target.value }))
                  }
                  className="pl-10"
                />
              </div>
              <Select
                value={filters.date_range}
                onValueChange={(v) => setFilters((prev) => ({ ...prev, date_range: v as any }))}
              >
                <SelectTrigger className="w-[9rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="1d">Today</SelectItem>
                  <SelectItem value="7d">This Week</SelectItem>
                  <SelectItem value="30d">This Month</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.content_type}
                onValueChange={(v) => setFilters((prev) => ({ ...prev, content_type: v as any }))}
              >
                <SelectTrigger className="w-[9rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters({ search_query: '', date_range: 'all', content_type: 'all' })
                }
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      ),
      [filters]
    )

    // Moderation helpers
    const calculateContentSafetyScore = useCallback(
      (content: string) => {
        if (!moderationSettings.autoModerate) return 1
        const unsafe = ['spam', 'harassment', 'hate', 'abuse']
        const found = unsafe.filter((w) => content?.toLowerCase().includes(w)).length
        return Math.max(0, 1 - found * 0.2)
      },
      [moderationSettings.autoModerate]
    )

    // ============================================================================
    // COMPOSER: create post
    // ============================================================================

    const focusTopComposer = useCallback(() => {
      setIsTopComposerActive(true)
    }, [])

    // Handler for modal submission (with link preview metadata)
    const handleModalPostSubmit = useCallback(
      async (data: {
        text: string
        link_url?: string
        link_preview_metadata?: LinkPreviewMetadata
        image_url?: string
        visibility: string
      }) => {
        if (!user) return false
        const trimmed = data.text.trim()
        const hasContent = trimmed.length > 0 || data.link_url || data.image_url
        if (!hasContent) return false

        // Only allow posting to user timelines where permitted; allow entity posts otherwise
        if (memoizedEntityType === 'user') {
          const check = await canUserPostOnTimeline(user.id, memoizedUserId)
          if (!check.canPost) {
            toast({
              title: 'Access denied',
              description: check.reason || 'Cannot post here',
              variant: 'destructive',
            })
            return false
          }
        }
        setIsPosting(true)
        try {
          const now = new Date().toISOString()

          // Determine content type
          let contentType = 'text'
          if (data.image_url) {
            contentType = 'image'
          } else if (data.link_url) {
            contentType = 'link'
          }

          // Build content data with link preview
          const contentData: any = {
            text: trimmed,
            content_type: contentType,
          }

          // Add link preview metadata if available
          if (data.link_url && data.link_preview_metadata) {
            contentData.links = [
              {
                id: data.link_preview_metadata.id || crypto.randomUUID(),
                url: data.link_url,
                title: data.link_preview_metadata.title,
                description: data.link_preview_metadata.description,
                thumbnail_url: data.link_preview_metadata.thumbnail_url,
                domain: data.link_preview_metadata.domain,
                preview_metadata: data.link_preview_metadata,
              },
            ]
          }

          // Use schema-validated insert via server action
          const { createActivityWithValidation } =
            await import('@/app/actions/create-activity-with-validation')
          const result = await createActivityWithValidation({
            user_id: user.id,
            activity_type: 'post_created',
            visibility: data.visibility,
            content_type: contentType,
            text: trimmed,
            content_summary: trimmed.substring(0, 100),
            image_url: data.image_url || null,
            link_url: data.link_url || null,
            hashtags: [],
            data: contentData,
            entity_type: memoizedEntityType,
            entity_id: memoizedUserId,
            metadata: { privacy_level: data.visibility },
            publish_status: 'published',
            published_at: now,
            created_at: now,
            updated_at: now,
          })

          if (!result.success) {
            const errorMessage = result.error || 'Failed to create post'
            if (result.removedColumns && result.removedColumns.length > 0) {
              console.warn('Removed non-existent columns:', result.removedColumns)
            }
            throw new Error(errorMessage)
          }

          if (result.warnings && result.warnings.length > 0) {
            console.warn('Post creation warnings:', result.warnings)
          }

          setPostForm({
            contentType: 'text',
            visibility: defaultVisibility,
            imageUrl: '',
            linkUrl: '',
            hashtags: '',
          })
          setIsTopComposerActive(false)
          // Clear cache and refresh the timeline to show the new post
          cacheRef.current.clear()
          await fetchActivities(1, false)
          toast({ title: 'Posted', description: 'Your post is live.' })
          return true
        } catch (e: any) {
          console.error('Failed to create post:', e)
          toast({
            title: 'Failed to post',
            description: e?.message || 'Try again',
            variant: 'destructive',
          })
          return false
        } finally {
          setIsPosting(false)
        }
      },
      [
        user,
        memoizedEntityType,
        memoizedUserId,
        canUserPostOnTimeline,
        fetchActivities,
        toast,
        defaultVisibility,
      ]
    )

    const handleCreatePost = useCallback(
      async (content: string) => {
        if (!user) return false
        const trimmed = content.trim()
        if (!trimmed) return false
        // Only allow posting to user timelines where permitted; allow entity posts otherwise
        if (memoizedEntityType === 'user') {
          const check = await canUserPostOnTimeline(user.id, memoizedUserId)
          if (!check.canPost) {
            toast({
              title: 'Access denied',
              description: check.reason || 'Cannot post here',
              variant: 'destructive',
            })
            return false
          }
        }
        setIsPosting(true)
        try {
          const now = new Date().toISOString()

          // Use schema-validated insert via server action
          const { createActivityWithValidation } =
            await import('@/app/actions/create-activity-with-validation')
          const result = await createActivityWithValidation({
            user_id: user.id,
            activity_type: 'post_created',
            visibility: postForm.visibility,
            content_type: postForm.imageUrl ? 'image' : postForm.contentType,
            text: trimmed,
            content_summary: trimmed.substring(0, 100),
            image_url: postForm.imageUrl || null,
            link_url: postForm.linkUrl || null,
            hashtags: postForm.hashtags
              ? postForm.hashtags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
              : [],
            data: {
              content: trimmed,
              content_type: postForm.imageUrl ? 'image' : postForm.contentType,
            },
            entity_type: memoizedEntityType,
            entity_id: memoizedUserId,
            metadata: { privacy_level: postForm.visibility },
            publish_status: 'published',
            published_at: now,
            created_at: now,
            updated_at: now,
          })

          if (!result.success) {
            const errorMessage = result.error || 'Failed to create post'
            if (result.removedColumns && result.removedColumns.length > 0) {
              console.warn('Removed non-existent columns:', result.removedColumns)
            }
            throw new Error(errorMessage)
          }

          if (result.warnings && result.warnings.length > 0) {
            console.warn('Post creation warnings:', result.warnings)
          }

          setPostForm({
            contentType: 'text',
            visibility: defaultVisibility,
            imageUrl: '',
            linkUrl: '',
            hashtags: '',
          })
          setIsTopComposerActive(false)
          // Clear cache and refresh the timeline to show the new post
          cacheRef.current.clear()
          await fetchActivities(1, false)
          toast({ title: 'Posted', description: 'Your post is live.' })
          return true
        } catch (e: any) {
          console.error('Failed to create post:', e)
          toast({
            title: 'Failed to post',
            description: e?.message || 'Try again',
            variant: 'destructive',
          })
          return false
        } finally {
          setIsPosting(false)
        }
      },
      [
        user,
        postForm,
        memoizedEntityType,
        memoizedUserId,
        canUserPostOnTimeline,
        fetchActivities,
        toast,
      ]
    )

    const handlePostDeleted = useCallback((postId: string) => {
      // Remove the deleted post from the activities list
      setActivities((prev) => prev.filter((activity) => activity.id !== postId))
    }, [])

    const handlePostUpdated = useCallback((updatedPost: FeedPost) => {
      setActivities((prev) =>
        prev.map((a) =>
          a.id === updatedPost.id
            ? {
              ...a,
              like_count: updatedPost.like_count ?? a.like_count,
              user_reaction_type: updatedPost.user_reaction_type ?? a.user_reaction_type,
              is_liked: !!updatedPost.user_reaction_type,
            }
            : a
        )
      )
    }, [])

    const handlePhotoUpload = useCallback(() => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.multiple = true
      input.onchange = async (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || [])
        if (!files.length) return
        try {
          setIsUploading(true)
          const uploaded: string[] = []
          for (const file of files) {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('entityType', memoizedEntityType)
            formData.append('entityId', memoizedUserId)
            const resp = await fetch('/api/upload/post-photo', { method: 'POST', body: formData })
            if (!resp.ok) throw new Error(await resp.text())
            const result = await resp.json()
            if (result?.url) uploaded.push(result.url)
          }
          const current = postForm.imageUrl
            ? postForm.imageUrl
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
            : []
          setPostForm((prev) => ({ ...prev, imageUrl: [...current, ...uploaded].join(', ') }))
          toast({ title: 'Photos uploaded', description: `${uploaded.length} photo(s) ready` })
        } catch (e: any) {
          toast({
            title: 'Upload failed',
            description: e?.message || 'Try again',
            variant: 'destructive',
          })
        } finally {
          setIsUploading(false)
        }
      }
      input.click()
    }, [memoizedEntityType, memoizedUserId, postForm.imageUrl, toast])

    // ============================================================================
    // PERFORMANCE OPTIMIZED RENDER
    // ============================================================================

    if (loading) {
      return renderLoadingSkeleton()
    }

    if (error) {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Timeline</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => fetchActivities(1, false)} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-6">
        {renderAnalyticsDashboard()}
        {renderAdvancedFilters()}
        {/* Composer: two-state pill/expanded, matching comment composer */}
        {enablePrivacyControls && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <EntityAvatar
                  type="user"
                  id={user?.id || 'current-user'}
                  name={currentUserName}
                  size="sm"
                  className="w-10 h-10 flex-shrink-0"
                />
                {!isTopComposerActive ? (
                  <button
                    onClick={() => setIsCreatePostModalOpen(true)}
                    className="flex-1 flex items-center justify-between rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-left text-sm text-gray-600 cursor-text"
                    style={{ transition: 'none' }}
                    data-no-secondary-hover
                  >
                    <span className="truncate opacity-80">
                      {memoizedEntityType === 'user'
                        ? "What's on your mind?"
                        : 'Share your thoughts...'}
                    </span>
                    <div className="flex items-center gap-2 ml-3 text-gray-400">
                      <ImageIcon className="h-4 w-4" />
                      <Smile className="h-4 w-4" />
                      <span className="text-[10px] font-semibold">GIF</span>
                    </div>
                  </button>
                ) : (
                  <EnterpriseTimelineComposer
                    placeholder={
                      memoizedEntityType === 'user'
                        ? "What's on your mind?"
                        : 'Share your thoughts...'
                    }
                    imageUrl={postForm.imageUrl}
                    visibility={postForm.visibility}
                    onVisibilityChange={(value) =>
                      setPostForm((prev) => ({ ...prev, visibility: value as any }))
                    }
                    onUpload={handlePhotoUpload}
                    onCancel={() => setIsTopComposerActive(false)}
                    onSubmit={handleCreatePost}
                    isUploading={isUploading}
                    isPosting={isPosting}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}
        {/* Performance optimized: Only render visible items */}
        <div className="space-y-4">
          {filteredActivities.map((activity, index) => renderActivity(activity, index))}
        </div>
        {/* Compact cross-post/collaboration/AI summary */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-sm">
                <div className="text-xs text-blue-700">Cross-post Reach</div>
                <div className="text-lg font-semibold text-blue-800">—</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-sm">
                <div className="text-xs text-purple-700">Collaboration Activity</div>
                <div className="text-lg font-semibold text-purple-800">—</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-sm">
                <div className="text-xs text-amber-700">AI Enhancements</div>
                <div className="text-lg font-semibold text-amber-800">—</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance optimized: Loading indicator for infinite scroll */}
        {hasMore && (
          <div ref={loadingRef} className="text-center py-4">
            {isLoadingMore ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading more...</span>
              </div>
            ) : (
              <Button
                onClick={() => {
                  setIsLoadingMore(true)
                  fetchActivities(page + 1, true)
                  setPage((prev) => prev + 1)
                }}
                variant="outline"
              >
                Load More
              </Button>
            )}
          </div>
        )}

        {/* Performance optimized: No more content indicator */}
        {!hasMore && activities.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>You've reached the end of the timeline</p>
          </div>
        )}

        {/* Performance optimized: Empty state */}
        {!loading && activities.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Activities Yet</h3>
              <p className="text-muted-foreground mb-4">
                This timeline is empty. Start sharing to see activities here.
              </p>
              {isOwnEntity && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Post
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create Post Modal */}
        <CreatePostModal
          isOpen={isCreatePostModalOpen}
          onClose={() => setIsCreatePostModalOpen(false)}
          entityType={memoizedEntityType}
          entityId={memoizedUserId}
          defaultVisibility={defaultVisibility}
          onPostCreated={() => {
            setIsCreatePostModalOpen(false)
          }}
          onSubmit={handleModalPostSubmit}
        />
      </div>
    )
  }
)

// ============================================================================
// COMPOSER SUBCOMPONENT

interface EnterpriseTimelineComposerProps {
  placeholder: string
  visibility: 'friends' | 'followers' | 'private' | 'public'
  imageUrl?: string
  onVisibilityChange: (value: string) => void
  onUpload: () => void
  onCancel: () => void
  onSubmit: (content: string) => Promise<boolean>
  isUploading: boolean
  isPosting: boolean
}

const EnterpriseTimelineComposer = React.memo(function EnterpriseTimelineComposer({
  placeholder,
  visibility,
  imageUrl,
  onVisibilityChange,
  onUpload,
  onCancel,
  onSubmit,
  isUploading,
  isPosting,
}: EnterpriseTimelineComposerProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const imageCount = useMemo(() => {
    if (!imageUrl) return 0
    return imageUrl
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean).length
  }, [imageUrl])

  const resizeComposer = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight || '20') || 20
    const maxHeight = lineHeight * MAX_COMPOSER_LINES
    const newHeight = Math.min(el.scrollHeight, Math.ceil(maxHeight))
    el.style.height = `${newHeight}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [])

  useEffect(() => {
    resizeComposer()
    // Auto-focus the textarea when the composer is mounted/activated
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [text, resizeComposer])

  const trimmed = text.trim()

  const handleSubmit = useCallback(async () => {
    if (!trimmed || isPosting) return
    const success = await onSubmit(trimmed)
    if (success) {
      setText('')
    }
  }, [isPosting, onSubmit, trimmed])

  return (
    <div className="flex-1">
      <div className="bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_POST_CHARS))}
          placeholder={placeholder}
          className="border-0 resize-none focus:ring-0 focus:outline-none min-h-[48px] text-sm bg-transparent"
          rows={2}
          onInput={resizeComposer}
        />
        {imageCount > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">Images: {imageCount}</div>
        )}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-gray-500">
            <button
              className="p-2 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100"
              onClick={onUpload}
              disabled={isUploading}
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <button className="p-2 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100">
              <Smile className="h-4 w-4" />
            </button>
            <span className="text-[10px] font-semibold ml-1">GIF</span>
          </div>
          <div className="flex items-center gap-2">
            <Select value={visibility} onValueChange={onVisibilityChange}>
              <SelectTrigger className="w-[8rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="friends">Friends</SelectItem>
                <SelectItem value="followers">Followers</SelectItem>
                <SelectItem value="private">Only me</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={onCancel}
              disabled={isPosting}
            >
              Cancel
            </Button>
            <PostButton
              onClick={handleSubmit}
              disabled={!trimmed || isPosting}
              loading={isPosting}
              sizeClassName="h-8 px-4 text-xs"
              label="Post"
            />
          </div>
        </div>
      </div>
    </div>
  )
})

// PERFORMANCE UTILITY FUNCTIONS
// ============================================================================

// Debounce function for performance optimization
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// Display name for debugging
EnterpriseTimelineActivities.displayName = 'EnterpriseTimelineActivities'

export default EnterpriseTimelineActivities
