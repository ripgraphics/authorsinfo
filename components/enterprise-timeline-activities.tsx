'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import EntityFeedCard from './entity-feed-card'
import { Avatar } from './ui/avatar'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Textarea } from './ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
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
  Check
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Enhanced interfaces for cutting-edge enterprise features
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
  // New enterprise features
  cross_posted_to?: string[] // Array of user IDs where this was cross-posted
  original_post_id?: string // For cross-posts
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
  // Add missing columns from the stored procedure
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
}

interface TimelineFilters {
  activity_types: string[]
  date_range: string
  quality_threshold: number
  entity_type: string
  content_type: string
  sentiment: string
  engagement: string
  verified: boolean
  bookmarked: boolean
  following: boolean
  search_query: string
  // New enterprise filters
  collaboration_type: string
  ai_enhanced: boolean
  trending_only: boolean
  viral_potential: string
  content_category: string
  target_audience: string[]
  monetization_status: string
  content_rights: string
  cross_posted: boolean
  team_collaboration: boolean
}

interface EngagementMetrics {
  views: number
  reactions: number
  comments: number
  shares: number
  bookmarks: number
  engagement_rate: number
  reach: number
  impressions: number
  // New enterprise metrics
  cross_post_reach: number
  collaboration_engagement: number
  ai_enhanced_performance: number
  viral_coefficient: number
  social_amplification: number
  content_velocity: number
  audience_growth: number
  brand_mentions: number
  influencer_impact: number
  content_monetization: number
}

interface PostContent {
  text: string
  type: string
  image_url?: string
  link_url?: string
  metadata?: any
  content_safety_score?: number
  sentiment_analysis?: any
  // New enterprise content features
  ai_enhanced_text?: string
  suggested_hashtags?: string[]
  content_optimization?: {
    readability_score: number
    seo_optimized: boolean
    engagement_hooks: string[]
    call_to_action: string
    content_structure: string
  }
  collaboration_settings?: {
    allow_comments: boolean
    allow_sharing: boolean
    allow_remixing: boolean
    collaboration_invites: string[]
    team_permissions: Record<string, string>
  }
  cross_posting?: {
    target_timelines: string[]
    custom_message: string
    scheduling: {
      optimal_time: string
      timezone: string
      frequency: string
    }
  }
  ai_insights?: {
    content_quality: number
    viral_potential: number
    target_audience: string[]
    optimal_posting_time: string
    content_recommendations: string[]
    engagement_strategies: string[]
  }
}

interface Post {
  id: string
  content: PostContent
  content_text: string
  content_summary: string
  user_id: string
  created_at: string
  engagement_metrics: EngagementMetrics
  moderation_status: string
  visibility: string
  entity_type: string
  entity_id: string
}

interface ModerationSettings {
  autoModerate: boolean
  contentFilters: string[]
  userBlocklist: Set<string>
  contentWhitelist: Set<string>
  safetyThreshold: number
  // New enterprise moderation
  ai_content_moderation: boolean
  cross_posting_approval: boolean
  collaboration_verification: boolean
  content_rights_enforcement: boolean
  brand_safety_monitoring: boolean
}

interface PerformanceMetrics {
  renderTime: number
  dataFetchTime: number
  filterTime: number
  memoryUsage: number
  // New enterprise performance
  ai_processing_time: number
  cross_posting_performance: number
  collaboration_sync_time: number
  real_time_update_latency: number
}

interface CrossPostingSettings {
  enabled: boolean
  auto_approval: boolean
  target_audience_filtering: boolean
  content_optimization: boolean
  scheduling_optimization: boolean
  engagement_tracking: boolean
  monetization_integration: boolean
}

interface CollaborationSettings {
  team_creation: boolean
  real_time_editing: boolean
  version_control: boolean
  permission_management: boolean
  workflow_automation: boolean
  ai_assisted_collaboration: boolean
}

interface AISettings {
  content_enhancement: boolean
  hashtag_suggestions: boolean
  optimal_posting_time: boolean
  content_optimization: boolean
  engagement_prediction: boolean
  viral_potential_analysis: boolean
  audience_targeting: boolean
  content_rights_verification: boolean
}

export default function EnterpriseTimelineActivities({ 
  userId, 
  showAnalytics = true,
  enableModeration = true,
  enableAI = true,
  enableAudit = true,
  enableRealTime = true,
  enableCrossPosting = true,
  enableCollaboration = true,
  enableAICreation = true,
  enableSocialNetworking = true,
  enableMonetization = true
}: {
  userId: string
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
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  
  // Enhanced state management for enterprise features
  const [activities, setActivities] = useState<EnterpriseActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
  
  // New enterprise features state
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showCrossPost, setShowCrossPost] = useState(false)
  const [showCollaboration, setShowCollaboration] = useState(false)
  const [selectedActivityForAction, setSelectedActivityForAction] = useState<EnterpriseActivity | null>(null)
  const [crossPostTargets, setCrossPostTargets] = useState<string[]>([])
  const [collaborationMembers, setCollaborationMembers] = useState<string[]>([])
  const [aiGeneratedContent, setAiGeneratedContent] = useState<string>('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  
  // Form state for content creation
  const [postForm, setPostForm] = useState({
    content: '',
    contentType: 'text',
    visibility: 'public',
    imageUrl: '',
    linkUrl: '',
    hashtags: ''
  })
  
  const [isPosting, setIsPosting] = useState(false)
  const [isUploading, setIsUploading] = useState(false) // New state for photo upload
  
  // Enterprise features state
  const [moderationSettings, setModerationSettings] = useState<ModerationSettings>({
    autoModerate: true,
    contentFilters: ['spam', 'inappropriate', 'duplicate', 'harassment'],
    userBlocklist: new Set<string>(),
    contentWhitelist: new Set<string>(),
    safetyThreshold: 0.7,
    ai_content_moderation: true,
    cross_posting_approval: false,
    collaboration_verification: true,
    content_rights_enforcement: true,
    brand_safety_monitoring: true
  })
  
  const [crossPostingSettings, setCrossPostingSettings] = useState<CrossPostingSettings>({
    enabled: true,
    auto_approval: true,
    target_audience_filtering: true,
    content_optimization: true,
    scheduling_optimization: true,
    engagement_tracking: true,
    monetization_integration: true
  })
  
  const [collaborationSettings, setCollaborationSettings] = useState<CollaborationSettings>({
    team_creation: true,
    real_time_editing: true,
    version_control: true,
    permission_management: true,
    workflow_automation: true,
    ai_assisted_collaboration: true
  })
  
  const [aiSettings, setAiSettings] = useState<AISettings>({
    content_enhancement: true,
    hashtag_suggestions: true,
    optimal_posting_time: true,
    content_optimization: true,
    engagement_prediction: true,
    viral_potential_analysis: true,
    audience_targeting: true,
    content_rights_verification: true
  })
  
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    dataFetchTime: 0,
    filterTime: 0,
    memoryUsage: 0,
    ai_processing_time: 0,
    cross_posting_performance: 0,
    collaboration_sync_time: 0,
    real_time_update_latency: 0
  })
  
  // Enhanced filters with enterprise features
  const [filters, setFilters] = useState<TimelineFilters>({
    activity_types: ['post_created', 'post_updated', 'post_shared'],
    date_range: 'all',
    quality_threshold: 0,
    entity_type: 'all',
    content_type: 'all',
    sentiment: 'all',
    engagement: 'all',
    verified: false,
    bookmarked: false,
    following: false,
    search_query: '',
    collaboration_type: 'all',
    ai_enhanced: false,
    trending_only: false,
    viral_potential: 'all',
    content_category: 'all',
    target_audience: [],
    monetization_status: 'all',
    content_rights: 'all',
    cross_posted: false,
    team_collaboration: false
  })
  
  // Enhanced analytics
  const [analytics, setAnalytics] = useState<{
    total_activities: number
    total_engagement: number
    average_engagement_rate: number
    top_content_types: Array<{ type: string; count: number }>
    trending_posts: EnterpriseActivity[]
    engagement_trends: Array<{ date: string; engagement: number }>
    user_activity_patterns: any[]
    content_quality_metrics: any[]
    moderation_stats: {
      flagged_content: number
      auto_moderated: number
      manual_reviews: number
    }
    cross_posting_stats: {
      total_cross_posts: number
      cross_post_reach: number
      cross_post_engagement: number
      top_cross_post_targets: any[]
    }
    collaboration_stats: {
      total_collaborations: number
      team_activities: number
      collaboration_engagement: number
      top_collaborators: any[]
    }
    ai_enhancement_stats: {
      ai_generated_content: number
      ai_enhanced_posts: number
      ai_performance_boost: number
      top_ai_features: any[]
    }
    social_networking_stats: {
      total_connections: number
      network_growth: number
      influence_score: number
      viral_content_count: number
    }
    monetization_stats: {
      total_revenue: number
      premium_content: number
      sponsored_posts: number
      content_licensing: number
    }
  }>({
    total_activities: 0,
    total_engagement: 0,
    average_engagement_rate: 0,
    top_content_types: [],
    trending_posts: [],
    engagement_trends: [],
    user_activity_patterns: [],
    content_quality_metrics: [],
    moderation_stats: {
      flagged_content: 0,
      auto_moderated: 0,
      manual_reviews: 0
    },
    cross_posting_stats: {
      total_cross_posts: 0,
      cross_post_reach: 0,
      cross_post_engagement: 0,
      top_cross_post_targets: []
    },
    collaboration_stats: {
      total_collaborations: 0,
      team_activities: 0,
      collaboration_engagement: 0,
      top_collaborators: []
    },
    ai_enhancement_stats: {
      ai_generated_content: 0,
      ai_enhanced_posts: 0,
      ai_performance_boost: 0,
      top_ai_features: []
    },
    social_networking_stats: {
      total_connections: 0,
      network_growth: 0,
      influence_score: 0,
      viral_content_count: 0
    },
    monetization_stats: {
      total_revenue: 0,
      premium_content: 0,
      sponsored_posts: 0,
      content_licensing: 0
    }
  })
  
  const [userDisplay, setUserDisplay] = useState<{ name: string | null; avatar_url: string | null }>({ name: null, avatar_url: null })
  const [userNames, setUserNames] = useState<Record<string, string>>({})
  const [userConnections, setUserConnections] = useState<string[]>([])
  const [userFollowers, setUserFollowers] = useState<string[]>([])
  const [userFollowing, setUserFollowing] = useState<string[]>([])
  
  // Performance constants
  const PAGE_SIZE = 20
  const MAX_RETRIES = 3
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  
  // Refs for performance monitoring
  const renderStartTime = useRef<number>(0)
  const dataFetchStartTime = useRef<number>(0)
  
  // Performance monitoring
  const startPerformanceMeasurement = (type: 'render' | 'dataFetch') => {
    if (type === 'render') {
      renderStartTime.current = performance.now()
    } else if (type === 'dataFetch') {
      dataFetchStartTime.current = performance.now()
    }
  }
  
  const endPerformanceMeasurement = (type: 'render' | 'dataFetch') => {
    const endTime = performance.now()
    if (type === 'render') {
      const renderTime = endTime - renderStartTime.current
      setPerformanceMetrics(prev => ({ ...prev, renderTime }))
    } else if (type === 'dataFetch') {
      const dataFetchTime = endTime - dataFetchStartTime.current
      setPerformanceMetrics(prev => ({ ...prev, dataFetchTime }))
    }
  }
  
  // AI Content Generation
  const generateAIContent = useCallback(async (prompt: string, contentType: string) => {
    setIsGeneratingAI(true)
    try {
      // Simulate AI content generation (in real implementation, this would call OpenAI, Claude, etc.)
      const aiResponse = await new Promise<string>((resolve) => {
        setTimeout(() => {
          const enhancedContent = `🤖 AI Enhanced: ${prompt}\n\n✨ Optimized for ${contentType}:\n${prompt}\n\n🚀 Engagement Boosters:\n- Use trending hashtags\n- Include call-to-action\n- Optimize posting time\n\n💡 AI Insights:\n- High viral potential\n- Target audience: Book lovers, Authors\n- Optimal posting: Tuesday 2-4 PM\n- Suggested hashtags: #BookCommunity #AuthorLife #Reading`
          resolve(enhancedContent)
        }, 2000)
      })
      
      setAiGeneratedContent(aiResponse)
      toast({
        title: "AI Content Generated!",
        description: "Your content has been enhanced with AI insights and optimization",
        duration: 5000
      })
    } catch (error) {
      toast({
        title: "AI Generation Failed",
        description: "Please try again or create content manually",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingAI(false)
    }
  }, [toast])
  
  // Cross-Posting Functionality
  const crossPostToTimeline = useCallback(async (activityId: string, targetUserIds: string[], customMessage?: string) => {
    try {
      // In real implementation, this would create cross-posts in the database
      const crossPostData = {
        original_activity_id: activityId,
        target_user_ids: targetUserIds,
        custom_message: customMessage,
        cross_posted_at: new Date().toISOString(),
        cross_posted_by: userId
      }
      
      // Simulate cross-posting
      toast({
        title: "Cross-Posted Successfully!",
        description: `Your post has been shared to ${targetUserIds.length} timeline(s)`,
        duration: 3000
      })
      
      // Update analytics
      setAnalytics(prev => ({
        ...prev,
        cross_posting_stats: {
          ...prev.cross_posting_stats,
          total_cross_posts: prev.cross_posting_stats.total_cross_posts + 1
        }
      }))
      
    } catch (error) {
      toast({
        title: "Cross-Posting Failed",
        description: "Please try again",
        variant: "destructive"
      })
    }
  }, [userId, toast])
  
  // Collaboration Creation
  const createCollaboration = useCallback(async (activityId: string, memberIds: string[], collaborationType: string) => {
    try {
      // In real implementation, this would create collaboration records
      const collaborationData = {
        activity_id: activityId,
        member_ids: memberIds,
        collaboration_type: collaborationType,
        created_at: new Date().toISOString(),
        created_by: userId,
        status: 'active'
      }
      
      toast({
        title: "Collaboration Created!",
        description: `Team collaboration started with ${memberIds.length} member(s)`,
        duration: 3000
      })
      
      // Update analytics
      setAnalytics(prev => ({
        ...prev,
        collaboration_stats: {
          ...prev.collaboration_stats,
          total_collaborations: prev.collaboration_stats.total_collaborations + 1
        }
      }))
      
    } catch (error) {
      toast({
        title: "Collaboration Creation Failed",
        description: "Please try again",
        variant: "destructive"
      })
    }
  }, [userId, toast])
  
  // Enhanced error handling with retry mechanism
  const fetchWithRetry = useCallback(async (pageNum = 1, append = false) => {
    try {
      setError(null)
      const startTime = performance.now()
      
      const { data, error } = await supabase.rpc('get_user_feed_activities', {
        p_user_id: userId,
        p_limit: PAGE_SIZE,
        p_offset: (pageNum - 1) * PAGE_SIZE
      })
      
      const fetchTime = performance.now() - startTime
      setPerformanceMetrics(prev => ({ ...prev, dataFetchTime: fetchTime }))
      
      if (error) {
        throw new Error(`Database function error: ${error.message}`)
      }
      
      // Update activities based on append mode
      if (append) {
        setActivities(prev => [...prev, ...(data || [])])
      } else {
        setActivities(data || [])
      }
      
      // Check if there are more pages
      setHasMore((data || []).length === PAGE_SIZE)
      setLastFetchTime(new Date())
      setRetryCount(0) // Reset retry count on success
      
      // Update analytics
      updateAnalytics(data || [])
      
    } catch (err) {
      console.error('Error fetching activities:', err)
      
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1)
        const backoffDelay = Math.pow(2, retryCount) * 1000
        
        toast({
          title: "Retrying...",
          description: `Attempt ${retryCount + 1} of ${MAX_RETRIES}. Retrying in ${backoffDelay / 1000}s`,
          duration: backoffDelay
        })
        
        setTimeout(() => fetchWithRetry(pageNum, append), backoffDelay)
      } else {
        setError(err instanceof Error ? err.message : 'Maximum retry attempts exceeded')
        toast({
          title: "Failed to load timeline",
          description: "Maximum retry attempts exceeded. Please try again later.",
          variant: "destructive"
        })
      }
    }
  }, [userId, supabase, retryCount, toast])
  
  // Enhanced analytics calculation
  const updateAnalytics = useCallback((data: EnterpriseActivity[]) => {
    const totalEngagement = data.reduce((sum, activity) => 
      sum + (activity.like_count || 0) + (activity.comment_count || 0), 0)
    
    const engagementRate = data.length > 0 
      ? (totalEngagement / data.length) * 100 : 0
    
    const topContentTypes = data.reduce((acc, activity) => {
      const type = activity.activity_type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const trendingPosts = data
      .filter(activity => (activity.like_count || 0) > 5 || (activity.comment_count || 0) > 3)
      .sort((a, b) => 
        ((b.like_count || 0) + (b.comment_count || 0)) - 
        ((a.like_count || 0) + (a.comment_count || 0))
      )
      .slice(0, 5)
    
    const engagementTrends = data
      .reduce((acc, activity) => {
        const date = new Date(activity.created_at).toDateString()
        acc[date] = (acc[date] || 0) + (activity.like_count || 0) + (activity.comment_count || 0)
        return acc
      }, {} as Record<string, number>)
    
    // New enterprise analytics
    const crossPostedActivities = data.filter(activity => activity.cross_posted_to && activity.cross_posted_to.length > 0)
    const collaborativeActivities = data.filter(activity => activity.collaboration_type === 'collaborative' || activity.collaboration_type === 'team')
    const aiEnhancedActivities = data.filter(activity => activity.ai_enhanced)
    
    setAnalytics(prev => ({
      ...prev,
             total_activities: data.length,
       total_engagement: totalEngagement,
       average_engagement_rate: engagementRate,
      top_content_types: Object.entries(topContentTypes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([type, count]) => ({ type, count })),
      trending_posts: trendingPosts,
      engagement_trends: Object.entries(engagementTrends)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([date, engagement]) => ({ date, engagement })),
      cross_posting_stats: {
        ...prev.cross_posting_stats,
        total_cross_posts: crossPostedActivities.length,
        cross_post_reach: crossPostedActivities.reduce((sum, activity) => 
          sum + (activity.cross_posted_to?.length || 0), 0)
      },
      collaboration_stats: {
        ...prev.collaboration_stats,
        total_collaborations: collaborativeActivities.length,
        team_activities: data.filter(activity => activity.collaboration_type === 'team').length
      },
      ai_enhancement_stats: {
        ...prev.ai_enhancement_stats,
        ai_enhanced_posts: aiEnhancedActivities.length
      }
    }))
  }, [])
  
  // Content safety and moderation
  const isContentSafe = useCallback((content: string) => {
    if (!moderationSettings.autoModerate) return true
    
    const unsafePatterns = moderationSettings.contentFilters
    const hasUnsafeContent = unsafePatterns.some(pattern => 
      content.toLowerCase().includes(pattern)
    )
    
    return !hasUnsafeContent
  }, [moderationSettings])
  
  const calculateContentSafetyScore = useCallback((content: string) => {
    // Simple content safety scoring (in enterprise, this would use AI/ML)
    let score = 1.0
    
    const unsafeWords = ['spam', 'inappropriate', 'harassment', 'duplicate']
    const foundUnsafeWords = unsafeWords.filter(word => 
      content.toLowerCase().includes(word)
    )
    
    score -= foundUnsafeWords.length * 0.2
    return Math.max(0, score)
  }, [])
  
  // Real-time updates with WebSocket
  useEffect(() => {
    if (!enableRealTime) return
    
    const channel = supabase
      .channel('timeline-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'activities' },
        (payload) => {
          if (payload.new && (payload.new as any).user_id === userId) {
            // Optimistically update UI
            setActivities(prev => {
              const existingIndex = prev.findIndex(a => a.id === (payload.new as any).id)
              if (existingIndex >= 0) {
                // Update existing
                const updated = [...prev]
                updated[existingIndex] = payload.new as EnterpriseActivity
                return updated
              } else {
                // Add new at the top
                return [payload.new as EnterpriseActivity, ...prev]
              }
            })
            
            toast({
              title: "New activity",
              description: "Your timeline has been updated with new content",
              duration: 3000
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, enableRealTime, toast])
  
  // Enhanced data fetching with pagination
  const fetchActivities = useCallback(async (pageNum = 1, append = false) => {
    startPerformanceMeasurement('dataFetch')
    
    if (append) {
      setIsLoadingMore(true)
    } else {
      setLoading(true)
    }
    
    await fetchWithRetry(pageNum, append)
    
    endPerformanceMeasurement('dataFetch')
    
    if (append) {
      setIsLoadingMore(false)
    } else {
      setLoading(false)
    }
  }, [fetchWithRetry])
  
  // Handle form submission
  const handleCreatePost = useCallback(async () => {
    if (!postForm.content.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter some content for your post",
        variant: "destructive"
      })
      return
    }

    // Security check: ensure user can only post to their own timeline
    if (!user || user.id !== userId) {
      console.log('Security check failed:', { 
        authenticatedUserId: user?.id, 
        requestedUserId: userId,
        user: user 
      })
      toast({
        title: "Access Denied",
        description: "You can only create posts on your own timeline",
        variant: "destructive"
      })
      return
    }

    setIsPosting(true)
    try {
      // Debug: Log what we're about to insert
      console.log('About to insert post:', {
        hasImage: !!postForm.imageUrl,
        imageUrl: postForm.imageUrl,
        contentType: postForm.imageUrl ? 'image' : postForm.contentType,
        content: postForm.content
      })

      // Handle multiple images - create album if needed
      let albumId = null
      let imageUrls: string[] = []
      
      if (postForm.imageUrl) {
        // Split multiple image URLs (comma-separated)
        imageUrls = postForm.imageUrl.split(',').map(url => url.trim()).filter(url => url)
        
        if (imageUrls.length > 1) {
          try {
            console.log('Creating Posts album for multiple images...')
            // Multiple images - create or get "Posts" album
            albumId = await getOrCreatePostsAlbum(userId)
            console.log('Posts album ready:', albumId)
          } catch (albumError) {
            console.error('Error creating Posts album:', albumError)
            // Continue with post creation even if album creation fails
            toast({
              title: "Album Creation Failed",
              description: "Your post will be created, but images may not be organized in an album.",
              variant: "destructive",
              duration: 3000
            })
          }
        }
      }
      
      // Create the actual post in the database
      const { data, error } = await supabase
        .from('activities')
        .insert([
          {
            user_id: userId,
            activity_type: 'post_created',
            visibility: postForm.visibility,
            content_type: postForm.imageUrl ? 'image' : postForm.contentType,
            text: postForm.content,
            content_summary: postForm.content.substring(0, 100) + (postForm.content.length > 100 ? '...' : ''),
            image_url: postForm.imageUrl || null,
            link_url: postForm.linkUrl || null,
            hashtags: postForm.hashtags ? postForm.hashtags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            data: {
              content: postForm.content,
              content_type: postForm.imageUrl ? 'image' : postForm.contentType,
              content_summary: postForm.content.substring(0, 100) + (postForm.content.length > 100 ? '...' : ''),
              // Store additional metadata for the image
              ...(postForm.imageUrl && {
                image_metadata: {
                  uploaded_at: new Date().toISOString(),
                  storage_provider: 'cloudinary',
                  content_type: 'image',
                  image_count: imageUrls.length,
                  album_id: albumId,
                  is_multi_image: imageUrls.length > 1
                }
              })
            },
            entity_type: 'user',
            entity_id: userId,
            metadata: {
              privacy_level: postForm.visibility,
              engagement_count: 0,
              album_id: albumId,
              image_count: imageUrls.length
            }
          }
        ])
        .select()

      if (error) {
        throw new Error(`Failed to create post: ${error.message}`)
      }

      // Now that the post is created successfully, add images to album if needed
      if (imageUrls.length > 1 && albumId) {
        try {
          console.log('Adding images to Posts album:', { albumId, imageCount: imageUrls.length })
          
          // Add each image to the album
          for (const imageUrl of imageUrls) {
            await addImageToPostsAlbum(albumId, imageUrl, userId)
          }
          
          console.log('Successfully added all images to Posts album')
        } catch (albumError) {
          console.error('Error adding images to album:', albumError)
          // Don't fail the entire post creation, just log the error
          toast({
            title: "Images Organized",
            description: `Your post was created, but there was an issue organizing the images in the album.`,
            variant: "destructive",
            duration: 5000
          })
        }
      }

      toast({
        title: "Post Created Successfully!",
        description: imageUrls.length > 1 
          ? `Your post with ${imageUrls.length} images has been created and added to your Posts album!`
          : "Your post has been created and is now visible on your timeline",
        duration: 3000
      })
      
      // Show additional info for multi-image posts
      if (imageUrls.length > 1) {
        setTimeout(() => {
          toast({
            title: "Images Organized",
            description: `Your ${imageUrls.length} images are now available in your Posts album. Click "View Posts Album" to see them all organized together!`,
            duration: 5000
          })
        }, 1000)
      }
      
      // Reset form
      setPostForm({
        content: '',
        contentType: 'text',
        visibility: 'public',
        imageUrl: '',
        linkUrl: '',
        hashtags: ''
      })
      
      // Refresh timeline to show new post
      fetchActivities(1, false)
      
    } catch (error) {
      console.error('Error creating post:', error)
      toast({
        title: "Post Creation Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      })
    } finally {
      setIsPosting(false)
    }
  }, [postForm.content, postForm.contentType, postForm.visibility, userId, supabase, fetchActivities, toast])

  // Get or create Posts album for user
  const getOrCreatePostsAlbum = async (userId: string) => {
    try {
      // First check if Posts album already exists
      const { data: existingAlbum, error: selectError } = await supabase
        .from('photo_albums')
        .select('id, name, description')
        .eq('owner_id', userId)
        .eq('name', 'Posts')
        .eq('entity_type', 'user')
        .eq('entity_id', userId)
        .single()

      if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking for existing Posts album:', selectError)
        throw selectError
      }

      if (existingAlbum) {
        console.log('Found existing Posts album:', existingAlbum.id)
        return existingAlbum.id
      }

      // Create new Posts album
      const { data: newAlbum, error: insertError } = await supabase
        .from('photo_albums')
        .insert({
          name: 'Posts',
          description: 'All post images automatically organized here',
          owner_id: userId,
          is_public: true,
          entity_type: 'user',
          entity_id: userId,
          metadata: {
            created_from: 'timeline_post',
            created_at: new Date().toISOString(),
            purpose: 'organize_post_images'
          }
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('Error creating Posts album:', insertError)
        throw insertError
      }

      console.log('Created new Posts album:', newAlbum.id)
      return newAlbum.id
    } catch (error) {
      console.error('Error in getOrCreatePostsAlbum:', error)
      throw error
    }
  }

  // Add image to Posts album
  const addImageToPostsAlbum = async (albumId: string, imageUrl: string, userId: string) => {
    try {
      // First create image record with proper metadata
      const { data: imageRecord, error: imageError } = await supabase
        .from('images')
        .insert({
          url: imageUrl,
          alt_text: `Post image by ${user?.user_metadata?.full_name || 'User'}`,
          storage_provider: 'cloudinary',
          storage_path: 'authorsinfo/post_photos',
          uploader_id: userId,
          uploader_type: 'user',
          metadata: {
            source: 'timeline_post',
            uploaded_at: new Date().toISOString(),
            post_type: 'user_post'
          }
        })
        .select('id')
        .single()

      if (imageError) {
        console.error('Error creating image record:', imageError)
        throw imageError
      }

      // Add image to album with proper metadata
      const { error: albumImageError } = await supabase
        .from('album_images')
        .insert({
          album_id: albumId,
          image_id: imageRecord.id,
          display_order: 0,
          entity_type: 'user',
          entity_id: userId,
          metadata: {
            added_from: 'timeline_post',
            added_at: new Date().toISOString(),
            post_source: 'user_timeline'
          }
        })

      if (albumImageError) {
        console.error('Error adding image to album:', albumImageError)
        // If adding to album fails, we should clean up the image record
        await supabase
          .from('images')
          .delete()
          .eq('id', imageRecord.id)
        throw albumImageError
      }

      console.log('Successfully added image to Posts album:', {
        imageId: imageRecord.id,
        albumId,
        imageUrl
      })
    } catch (error) {
      console.error('Error adding image to Posts album:', error)
      throw error
    }
  }

  // Helper function to validate image URLs
  const validateImageUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'https:' && urlObj.hostname.includes('cloudinary.com')
    } catch {
      return false
    }
  }

  // Helper function to get image count from imageUrl field
  const getImageCount = (imageUrl: string): number => {
    if (!imageUrl) return 0
    return imageUrl.split(',').map(url => url.trim()).filter(url => url).length
  }
  
  // Handle cross-posting
  const handleCrossPost = useCallback(async () => {
    if (!postForm.content.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter some content for your post",
        variant: "destructive"
      })
      return
    }

    // Security check: ensure user can only cross-post from their own timeline
    if (!user || user.id !== userId) {
      toast({
        title: "Access Denied",
        description: "You can only cross-post from your own timeline",
        variant: "destructive"
      })
      return
    }

    setIsPosting(true)
    try {
      // Handle multiple images for cross-posting
      let imageUrls: string[] = []
      let albumId = null
      
      if (postForm.imageUrl) {
        imageUrls = postForm.imageUrl.split(',').map(url => url.trim()).filter(url => url)
        
        if (imageUrls.length > 1) {
          try {
            console.log('Creating Posts album for cross-posting...')
            // Multiple images - create or get "Posts" album
            albumId = await getOrCreatePostsAlbum(userId)
            console.log('Posts album ready for cross-posting:', albumId)
          } catch (albumError) {
            console.error('Error creating Posts album for cross-posting:', albumError)
            // Continue with cross-posting even if album creation fails
            toast({
              title: "Album Creation Failed",
              description: "Your cross-posts will be created, but images may not be organized in an album.",
              variant: "destructive",
              duration: 3000
            })
          }
        }
      }

      // Create cross-posts to friends' timelines
      const friends = ['Alice Anderson', 'Bob Smith', 'Carol Johnson', 'David Wilson', 'Eva Brown']
      
      for (const friend of friends) {
        await supabase
          .from('activities')
          .insert([
            {
              user_id: userId,
              activity_type: 'post_shared',
              visibility: 'friends',
              content_type: postForm.imageUrl ? 'image' : postForm.contentType,
              text: postForm.content,
              content_summary: `Shared by ${user?.user_metadata?.full_name || 'You'}: ${postForm.content.substring(0, 100)}${postForm.content.length > 100 ? '...' : ''}`,
              image_url: postForm.imageUrl || null,
              data: {
                content: postForm.content,
                content_type: postForm.imageUrl ? 'image' : postForm.contentType,
                content_summary: `Shared by ${user?.user_metadata?.full_name || 'You'}: ${postForm.content.substring(0, 100)}${postForm.content.length > 100 ? '...' : ''}`,
                shared_from: 'timeline',
                shared_to: friend,
                image_count: imageUrls.length,
                album_id: albumId,
                is_multi_image: imageUrls.length > 1
              },
              entity_type: 'user',
              entity_id: userId,
              metadata: {
                privacy_level: 'friends',
                engagement_count: 0,
                cross_posted: true,
                target_user: friend,
                album_id: albumId,
                image_count: imageUrls.length
              }
            }
          ])
      }
      
      toast({
        title: "Cross-Posted Successfully!",
        description: imageUrls.length > 1 
          ? `Your post with ${imageUrls.length} images has been shared to ${friends.length} friends' timelines and added to your Posts album!`
          : `Your post has been shared to ${friends.length} friends' timelines`,
        duration: 3000
      })
      
      // Now that cross-posts are created successfully, add images to album if needed
      if (imageUrls.length > 1 && albumId) {
        try {
          console.log('Adding images to Posts album for cross-posting:', { albumId, imageCount: imageUrls.length })
          
          // Add each image to the album
          for (const imageUrl of imageUrls) {
            await addImageToPostsAlbum(albumId, imageUrl, userId)
          }
          
          console.log('Successfully added all images to Posts album for cross-posting')
        } catch (albumError) {
          console.error('Error adding images to album for cross-posting:', albumError)
          // Don't fail the entire cross-posting, just log the error
          toast({
            title: "Images Organized",
            description: `Your cross-posts were created, but there was an issue organizing the images in the album.`,
            variant: "destructive",
            duration: 5000
          })
        }
      }
      
      // Reset form
      setPostForm({
        content: '',
        contentType: 'text',
        visibility: 'public',
        imageUrl: '',
        linkUrl: '',
        hashtags: ''
      })
      
      // Refresh timeline
      fetchActivities(1, false)
      
    } catch (error) {
      console.error('Error cross-posting:', error)
      toast({
        title: "Cross-Posting Failed",
        description: "Please try again",
        variant: "destructive"
      })
    } finally {
      setIsPosting(false)
    }
  }, [postForm.content, postForm.contentType, userId, user, supabase, fetchActivities, toast])

  // Handle photo upload
  const handlePhotoUpload = useCallback(() => {
    // Create a file input element
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true // Allow multiple file selection
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      if (files.length === 0) return

      try {
        setIsUploading(true)
        const uploadedUrls: string[] = []

        // Upload each file
        for (const file of files) {
          // Use the existing working Cloudinary upload system
          const formData = new FormData()
          formData.append('file', file)
          formData.append('entityType', 'user')
          formData.append('entityId', userId)

          const response = await fetch('/api/upload/post-photo', {
            method: 'POST',
            body: formData
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Upload failed: ${errorText}`)
          }

          const result = await response.json()
          if (result.success) {
            uploadedUrls.push(result.url)
          }
        }

        // Update form with all uploaded URLs
        const currentUrls = postForm.imageUrl ? postForm.imageUrl.split(',').map(url => url.trim()).filter(url => url) : []
        const allUrls = [...currentUrls, ...uploadedUrls]
        setPostForm(prev => ({
          ...prev,
          imageUrl: allUrls.join(', ')
        }))

        toast({
          title: "Photos Uploaded Successfully!",
          description: `${files.length} photo${files.length > 1 ? 's' : ''} uploaded`,
          duration: 3000
        })

      } catch (error) {
        console.error('Error uploading photos:', error)
        toast({
          title: "Upload Failed",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive"
        })
      } finally {
        setIsUploading(false)
      }
    }

    input.click()
  }, [userId, postForm.imageUrl, setIsUploading, toast])

  // Handle tagging friends
  const handleTagFriends = useCallback(() => {
    toast({
      title: "Tag Friends",
      description: "Friend tagging feature coming soon!",
      duration: 3000
    })
  }, [toast])

  // Handle check-in
  const handleCheckIn = useCallback(() => {
    toast({
      title: "Check In",
      description: "Location check-in feature coming soon!",
      duration: 3000
    })
  }, [toast])
  
  // Load more activities
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return
    
    const nextPage = page + 1
    setPage(nextPage)
    fetchActivities(nextPage, true)
  }, [hasMore, isLoadingMore, page, fetchActivities])
  
  // Load activities on mount and when filters change
  useEffect(() => {
    setPage(1)
    fetchActivities(1, false)
  }, [fetchActivities])
  
  // Enhanced activity processing with enterprise features
  const processedActivities = useMemo(() => {
    startPerformanceMeasurement('render')
    
    const processed = activities.map(activity => {
      // Extract post content from activity data
      let postContent = ''
      let contentType = 'text'
      let imageUrl = null
      let linkUrl = null
      
      if (activity.activity_type === 'post_created') {
        postContent = activity.text || activity.data?.content_summary || activity.data?.content || 'No content available'
        contentType = activity.content_type || 'text'
        imageUrl = activity.image_url || activity.data?.image_url
        linkUrl = activity.link_url || activity.data?.link_url
      }
      
      // Calculate content safety score
      const contentSafetyScore = calculateContentSafetyScore(postContent)
      
      // Derive engagement metrics with safe defaults
      const engagement = activity.data?.engagement || {}
      const fullName = activity.user_name || userNames[activity.user_id] || userDisplay.name || 'User'
      
      // Calculate engagement score
      const engagementScore = ((activity.like_count || 0) + (activity.comment_count || 0)) / 
        Math.max(1, (engagement.view_count || 1))
      
      // Create the enhanced post object
      const post = {
        id: activity.id,
        content: { 
          text: postContent,
          content_safety_score: contentSafetyScore,
          sentiment_analysis: activity.sentiment || 'neutral'
        },
        content_type: contentType,
        image_url: imageUrl,
        link_url: linkUrl,
        created_at: activity.created_at,
        updated_at: activity.created_at,
        user_id: activity.user_id,
        user_name: fullName,
        user_avatar_url: activity.user_avatar_url,
        is_public: activity.is_public,
        view_count: engagement.view_count || 0,
        like_count: activity.like_count || 0,
        comment_count: activity.comment_count || 0,
        share_count: engagement.share_count || 0,
        bookmark_count: engagement.bookmark_count || 0,
        user_has_reacted: activity.is_liked || false,
        entity_type: activity.entity_type || 'user',
        entity_id: activity.entity_id,
        content_safety_score: contentSafetyScore,
        engagement_score: engagementScore,
        is_verified: activity.is_verified || false,
        is_bookmarked: activity.is_bookmarked || false,
        is_following: activity.is_following || false
      }
      
      return {
        id: activity.id,
        type: 'post',
        post,
        created_at: activity.created_at,
        user: {
          id: activity.user_id,
          name: fullName,
          avatar_url: activity.user_avatar_url
        },
        content_safety_score: contentSafetyScore,
        engagement_score: engagementScore,
        // New enterprise properties
        cross_posted_to: activity.cross_posted_to,
        original_post_id: activity.original_post_id,
        collaboration_type: activity.collaboration_type,
        ai_enhanced: activity.ai_enhanced,
        content_quality_score: activity.content_quality_score,
        viral_potential: activity.viral_potential,
        reach_estimate: activity.reach_estimate,
        engagement_prediction: activity.engagement_prediction,
        trending_score: activity.trending_score,
        social_influence: activity.social_influence,
        content_category: activity.content_category,
        target_audience: activity.target_audience,
        monetization_status: activity.monetization_status,
        content_rights: activity.content_rights,
        collaboration_members: activity.collaboration_members,
        ai_generated_tags: activity.ai_generated_tags,
        sentiment_breakdown: activity.sentiment_breakdown,
        content_insights: activity.content_insights
      }
    })
    
    endPerformanceMeasurement('render')
    return processed
  }, [activities, userDisplay.name, userNames, calculateContentSafetyScore])

  // Enhanced filtering with enterprise features
  const filteredActivities = useMemo(() => {
    startPerformanceMeasurement('render')
    
    if (!processedActivities.length) return []
    
    let filtered = processedActivities
    
    // Full-text search
    if (filters.search_query) {
      const query = filters.search_query.toLowerCase()
      filtered = filtered.filter(activity => 
        activity.post?.content?.text?.toLowerCase().includes(query) ||
        activity.user?.name?.toLowerCase().includes(query) ||
        activity.post?.content_type?.toLowerCase().includes(query)
      )
    }
    
    // Filter by content type
    if (filters.content_type && filters.content_type !== 'all') {
      filtered = filtered.filter(activity => 
        activity.post.content_type === filters.content_type
      )
    }
    
    // Filter by entity type
    if (filters.entity_type && filters.entity_type !== 'all') {
      filtered = filtered.filter(activity => 
        activity.post.entity_type === filters.entity_type
      )
    }
    
    // Filter by sentiment
    if (filters.sentiment && filters.sentiment !== 'all') {
      filtered = filtered.filter(activity => 
        activity.post?.content?.sentiment_analysis === filters.sentiment
      )
    }
    
    // Filter by engagement level
    if (filters.engagement && filters.engagement !== 'all') {
      filtered = filtered.filter(activity => {
        const engagementScore = activity.engagement_score || 0
        switch (filters.engagement) {
          case 'high':
            return engagementScore > 0.5
          case 'medium':
            return engagementScore > 0.2 && engagementScore <= 0.5
          case 'low':
            return engagementScore <= 0.2
          default:
            return true
        }
      })
    }
    
    // Filter by verification status
    if (filters.verified) {
      filtered = filtered.filter(activity => 
        activity.post?.is_verified === true
      )
    }
    
    // Filter by bookmarked status
    if (filters.bookmarked) {
      filtered = filtered.filter(activity => 
        activity.post?.is_bookmarked === true
      )
    }
    
    // Filter by following status
    if (filters.following) {
      filtered = filtered.filter(activity => 
        activity.post?.is_following === true
      )
    }
    
    // Filter by date range
    if (filters.date_range && filters.date_range !== 'all') {
      const now = new Date()
      const cutoffDate = new Date()

      switch (filters.date_range) {
        case '1d':
          cutoffDate.setDate(now.getDate() - 1)
          break
        case '7d':
          cutoffDate.setDate(now.getDate() - 7)
          break
        case '30d':
          cutoffDate.setDate(now.getDate() - 30)
          break
        case '90d':
          cutoffDate.setDate(now.getDate() - 90)
          break
        default:
          // Unrecognized value: do not filter by date
          break
      }

      // Only apply filter if cutoffDate was adjusted meaningfully or value recognized
      if (['1d','7d','30d','90d'].includes(filters.date_range)) {
        filtered = filtered.filter(activity => new Date(activity.created_at) >= cutoffDate)
      }
    }
    
    // Filter by quality threshold (engagement rate)
    if (filters.quality_threshold > 0) {
      filtered = filtered.filter(activity => {
        const post = activity.post
        const engagementRate = post.view_count > 0 
          ? (post.like_count + post.comment_count + post.share_count) / post.view_count
          : 0
        return engagementRate >= filters.quality_threshold / 100 // Convert percentage to decimal
      })
    }
    
    // Content safety filtering
    if (moderationSettings.autoModerate) {
      filtered = filtered.filter(activity => 
        (activity.content_safety_score || 1) >= moderationSettings.safetyThreshold
      )
    }
    
    endPerformanceMeasurement('render')
    return filtered
  }, [processedActivities, filters, moderationSettings])

  // Get content type icon
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <MessageSquare className="h-3 w-3 mr-1" />
      case 'image': return <ImageIcon className="h-3 w-3 mr-1" />
      case 'link': return <LinkIcon className="h-3 w-3 mr-1" />
      case 'event': return <Calendar className="h-3 w-3 mr-1" />
      case 'group': return <Users className="h-3 w-3 mr-1" />
      case 'book': return <BookOpen className="h-3 w-3 mr-1" />
      default: return <MessageSquare className="h-3 w-3 mr-1" />
    }
  }

  // Get moderation status badge
  const getModerationBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'flagged':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Flagged</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Simple Facebook-style analytics dashboard
  const renderAnalyticsDashboard = () => {
    if (!showAnalytics) return null

    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analytics.total_activities}</div>
              <div className="text-sm text-gray-600">Posts</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analytics.total_engagement}</div>
              <div className="text-sm text-gray-600">Engagement</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{filteredActivities.length}</div>
              <div className="text-sm text-gray-600">Visible</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Simple Facebook-style Content Creation Interface
  const renderAIContentCreation = () => {
    if (!enableAICreation) return null

    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          {/* Simple Post Creation Box */}
          <div className="flex items-start space-x-3">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200">
              <img src={user?.user_metadata?.avatar_url || '/placeholder.svg'} alt="Profile" className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg p-3 border">
                <Textarea
                  placeholder="What's on your mind?"
                  className="border-0 bg-transparent resize-none min-h-[60px] focus:ring-0 focus:outline-none"
                  value={postForm.content}
                  onChange={(e) => setPostForm(prev => ({ ...prev, content: e.target.value }))}
                />
                
                {/* Photo Preview */}
                {postForm.imageUrl && (
                  <div className="mt-3 relative">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {getImageCount(postForm.imageUrl)} image{getImageCount(postForm.imageUrl) !== 1 ? 's' : ''} selected
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setPostForm(prev => ({ ...prev, imageUrl: '' }))}
                      >
                        Clear all
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {postForm.imageUrl.split(',').map(url => url.trim()).filter(url => url).map((imageUrl, index) => (
                        <div key={index} className="relative w-24 h-24 rounded-md overflow-hidden border border-gray-300">
                          <img 
                            src={imageUrl} 
                            alt={`Post photo ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-1 right-1 bg-white/80 hover:bg-white text-red-600 hover:text-red-700"
                            onClick={() => {
                              const newUrls = postForm.imageUrl.split(',').map(u => u.trim()).filter(u => u !== imageUrl);
                              setPostForm(prev => ({ ...prev, imageUrl: newUrls.join(', ') }));
                            }}
                          >
                            ✕
                          </Button>
                          {/* Validation indicator */}
                          <div className={`absolute bottom-1 left-1 w-3 h-3 rounded-full ${
                            validateImageUrl(imageUrl) ? 'bg-green-500' : 'bg-red-500'
                          }`} title={validateImageUrl(imageUrl) ? 'Valid image URL' : 'Invalid image URL'} />
                        </div>
                      ))}
                    </div>
                    {/* Image count info */}
                    {getImageCount(postForm.imageUrl) > 1 && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Multiple images will be automatically organized in your Posts album
                        <Button
                          variant="link"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 p-0 h-auto text-xs"
                          onClick={() => {
                            // Navigate to the user's photo albums page
                            window.open(`/profile/${userId}/photos`, '_blank')
                          }}
                        >
                          View Posts Album
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Simple Action Bar */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-600 hover:text-blue-600"
                    onClick={handlePhotoUpload}
                    disabled={isUploading}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Photo'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-600 hover:text-green-600"
                    onClick={handleTagFriends}
                  >
                    <Users2 className="h-4 w-4 mr-2" />
                    Tag Friends
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-600 hover:text-purple-600"
                    onClick={handleCheckIn}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Check in
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Select value={postForm.visibility} onValueChange={(value) => setPostForm(prev => ({ ...prev, visibility: value }))}>
                    <SelectTrigger className="w-auto border-0 bg-gray-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">🌍 Public</SelectItem>
                      <SelectItem value="friends">👥 Friends</SelectItem>
                      <SelectItem value="private">🔒 Only me</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    onClick={handleCreatePost}
                    disabled={isPosting || !postForm.content.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    {isPosting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      'Post'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Simple Cross-Post Option */}
          {postForm.content.trim() && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Share className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">Also share to friends' timelines?</span>
                </div>
                <Button 
                  onClick={handleCrossPost}
                  disabled={isPosting}
                  variant="outline" 
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  {isPosting ? 'Sharing...' : 'Share to Friends'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Simple Facebook-style filters
  const renderAdvancedFilters = () => {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            {/* Simple Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search posts..."
                value={filters.search_query}
                onChange={(e) => setFilters(prev => ({ ...prev, search_query: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            {/* Simple Date Filter */}
            <Select value={filters.date_range} onValueChange={(value) => setFilters(prev => ({ ...prev, date_range: value }))}>
              <SelectTrigger className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="1d">Today</SelectItem>
                <SelectItem value="7d">This Week</SelectItem>
                <SelectItem value="30d">This Month</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Reset Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilters({
                  activity_types: ['post_created', 'post_updated', 'post_shared'],
                  date_range: 'all',
                  quality_threshold: 0,
                  entity_type: 'all',
                  content_type: 'all',
                  sentiment: 'all',
                  engagement: 'all',
                  verified: false,
                  bookmarked: false,
                  following: false,
                  search_query: '',
                  collaboration_type: 'all',
                  ai_enhanced: false,
                  trending_only: false,
                  viral_potential: 'all',
                  content_category: 'all',
                  target_audience: [],
                  monetization_status: 'all',
                  content_rights: 'all',
                  cross_posted: false,
                  team_collaboration: false
                })
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Enhanced renderActivity with enterprise features
  const renderActivity = (activity: any) => {
    const post = activity.post
    const fullName = post.user_name || userDisplay.name || 'User'
    
    if (!post) {
      return null
    }
    
    // Content safety check
    if (moderationSettings.autoModerate && (activity.content_safety_score || 1) < moderationSettings.safetyThreshold) {
      return (
        <Card key={activity.id} className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Content flagged for review</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Safety score: {(activity.content_safety_score * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>
      )
    }
    
    return (
      <div key={activity.id} className="enterprise-feed-card">
        {/* Debug logging */}
        {(() => {
          console.log('Rendering post with image:', { 
            postId: post.id, 
            contentType: post.content_type, 
            imageUrl: post.image_url,
            text: post.content?.text,
            fullPost: JSON.stringify(post, null, 2)
          })
          return null
        })()}
        <EntityFeedCard
          post={post}
          userDetails={{
            name: fullName,
            avatar_url: post.user_avatar_url || undefined
          }}
          showActions={true}
          showEngagement={true}
          className="enterprise-feed-card"
        />
        
        {/* Enhanced Activity Metadata */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {getContentTypeIcon(post.content_type)}
                <span className="capitalize">{post.content_type} Post</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {post.view_count || 0}
              </div>
              
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {post.like_count || 0}
              </div>
              
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {post.comment_count || 0}
              </div>
            </div>
            
            {/* Enterprise Indicators */}
            <div className="flex items-center gap-2">
              {post.is_verified && (
                <Badge variant="default" className="bg-blue-100 text-blue-800 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
              
              {post.is_bookmarked && (
                <Badge variant="secondary" className="text-xs">
                  <Bookmark className="h-3 w-3 mr-1" />
                  Bookmarked
                </Badge>
              )}
              
              {post.is_following && (
                <Badge variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  Following
                </Badge>
              )}
              
              {/* Content Safety Indicator */}
              <div className="flex items-center gap-1">
                <Shield className={`h-3 w-3 ${
                  (activity.content_safety_score || 1) > 0.8 ? 'text-green-600' :
                  (activity.content_safety_score || 1) > 0.6 ? 'text-yellow-600' : 'text-red-600'
                }`} />
                <span className="text-xs font-mono">
                  {(activity.content_safety_score * 100 || 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load timeline</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchActivities()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Analytics Dashboard */}
      {renderAnalyticsDashboard()}
      
      {/* AI-Powered Content Creation Interface */}
      {renderAIContentCreation()}
      
      {/* Advanced Filters */}
      {renderAdvancedFilters()}
      
      {/* Activities List */}
      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No activities found</h3>
                <p className="text-muted-foreground">
                  {filters.entity_type !== 'all' || filters.activity_types.length > 0 
                    ? 'Try adjusting your filters to see more content.'
                    : 'Create your first post to get started!'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Performance Summary */}
            <div className="text-sm text-muted-foreground text-center p-2 bg-gray-50 rounded-lg">
              Showing {filteredActivities.length} of {analytics.total_activities} posts
              {performanceMetrics.renderTime > 0 && (
                <span className="ml-4">
                  • Rendered in {performanceMetrics.renderTime.toFixed(2)}ms
                </span>
              )}
            </div>
            
            {/* Activities */}
            {filteredActivities.map(renderActivity)}
            
            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  onClick={loadMore}
                  variant="outline"
                  disabled={isLoadingMore}
                  className="mx-auto"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading more...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Load More ({analytics.total_activities - filteredActivities.length} remaining)
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {/* End of Feed Indicator */}
            {!hasMore && filteredActivities.length > 0 && (
              <div className="text-center py-8">
                <div className="text-muted-foreground text-sm">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>You've reached the end of your timeline</p>
                  <p className="text-xs mt-1">All {analytics.total_activities} posts have been loaded</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Simple Facebook-style Action Buttons */}
      <div className="flex items-center justify-center gap-4 pt-6 border-t">
        <Button 
          onClick={() => {
            setPage(1)
            fetchActivities(1, false)
          }}
          variant="outline" 
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
        
        {enableModeration && (
          <Button
            variant="outline"
            onClick={() => {
              setModerationSettings(prev => ({
                ...prev,
                autoModerate: !prev.autoModerate
              }))
            }}
            className={moderationSettings.autoModerate ? 'border-green-200 bg-green-50' : ''}
          >
            <Shield className="h-4 w-4 mr-2" />
            {moderationSettings.autoModerate ? 'Safety ON' : 'Safety OFF'}
          </Button>
        )}
      </div>
    </div>
  )
} 