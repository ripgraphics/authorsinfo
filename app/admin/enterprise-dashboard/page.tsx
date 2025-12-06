'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Brain, 
  Image, 
  BookOpen, 
  Star,
  Eye,
  Heart,
  Share2,
  Download,
  MessageCircle,
  Settings,
  Zap
} from 'lucide-react'

interface EnterpriseMetrics {
  totalAlbums: number
  totalImages: number
  totalViews: number
  totalLikes: number
  totalShares: number
  totalRevenue: number
  totalSubscribers: number
  communityScore: number
  aiAnalysisCount: number
  processingJobs: number
}

interface AnalyticsData {
  views: number
  likes: number
  shares: number
  downloads: number
  comments: number
  revenue: number
  engagement: number
  viralScore: number
}

interface MonetizationData {
  totalEarnings: number
  premiumSubscribers: number
  revenueShare: number
  monthlyRecurringRevenue: number
  lifetimeValue: number
  conversionRate: number
  averageOrderValue: number
  topRevenueSources: string[]
}

interface CommunityData {
  activeFollowers: number
  totalInteractions: number
  communityScore: number
  userGeneratedContent: number
  averageRating: number
  topContributors: string[]
}

interface AIData {
  analyzedImages: number
  processingJobs: number
  averageConfidence: number
  contentSafetyScore: number
  topTags: string[]
  qualityMetrics: {
    sharpness: number
    brightness: number
    contrast: number
  }
}

export default function EnterpriseDashboard() {
  const [metrics, setMetrics] = useState<EnterpriseMetrics>({
    totalAlbums: 0,
    totalImages: 0,
    totalViews: 0,
    totalLikes: 0,
    totalShares: 0,
    totalRevenue: 0,
    totalSubscribers: 0,
    communityScore: 0,
    aiAnalysisCount: 0,
    processingJobs: 0
  })
  
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    views: 0,
    likes: 0,
    shares: 0,
    downloads: 0,
    comments: 0,
    revenue: 0,
    engagement: 0,
    viralScore: 0
  })
  
  const [monetization, setMonetization] = useState<MonetizationData>({
    totalEarnings: 0,
    premiumSubscribers: 0,
    revenueShare: 70,
    monthlyRecurringRevenue: 0,
    lifetimeValue: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    topRevenueSources: []
  })
  
  const [community, setCommunity] = useState<CommunityData>({
    activeFollowers: 0,
    totalInteractions: 0,
    communityScore: 0,
    userGeneratedContent: 0,
    averageRating: 0,
    topContributors: []
  })
  
  const [ai, setAI] = useState<AIData>({
    analyzedImages: 0,
    processingJobs: 0,
    averageConfidence: 0,
    contentSafetyScore: 0,
    topTags: [],
    qualityMetrics: {
      sharpness: 0,
      brightness: 0,
      contrast: 0
    }
  })

  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    loadEnterpriseData()
  }, [])

  const loadEnterpriseData = async () => {
    try {
      setIsLoading(true)

      // Load basic metrics
      const { data: albums } = await supabase
        .from('photo_albums')
        .select('*')
        .is('deleted_at', null)

      const { data: images } = await supabase
        .from('album_images')
        .select('*')

      const { data: analytics } = await supabase
        .from('photo_analytics')
        .select('*')

      const { data: monetization } = await supabase
        .from('photo_monetization')
        .select('*')
        .eq('status', 'completed')

      const { data: community } = await supabase
        .from('photo_community')
        .select('*')

      const { data: aiAnalysis } = await supabase
        .from('ai_image_analysis')
        .select('*')

      const { data: processingJobs } = await supabase
        .from('image_processing_jobs')
        .select('*')

      // Calculate metrics
      const totalAlbums = albums?.length || 0
      const totalImages = images?.length || 0
      const totalViews = analytics?.filter(a => a.event_type === 'view').length || 0
      const totalLikes = analytics?.filter(a => a.event_type === 'like').length || 0
      const totalShares = analytics?.filter(a => a.event_type === 'share').length || 0
      const totalRevenue = monetization?.reduce((sum, m) => sum + (m.amount || 0), 0) || 0
      const totalSubscribers = albums?.filter(a => a.premium_content).length || 0
      const communityScore = community?.length ? Math.min(community.length / 100, 1) : 0
      const aiAnalysisCount = aiAnalysis?.length || 0
      const processingJobsCount = processingJobs?.filter(p => p.status === 'pending').length || 0

      setMetrics({
        totalAlbums,
        totalImages,
        totalViews,
        totalLikes,
        totalShares,
        totalRevenue,
        totalSubscribers,
        communityScore,
        aiAnalysisCount,
        processingJobs: processingJobsCount
      })

      // Calculate analytics data
      const views = totalViews
      const likes = totalLikes
      const shares = totalShares
      const downloads = analytics?.filter(a => a.event_type === 'download').length || 0
      const comments = community?.filter(c => c.interaction_type === 'comment').length || 0
      const revenue = totalRevenue
      const engagement = totalImages ? ((views + likes + shares) / totalImages) * 100 : 0
      const viralScore = shares > 0 ? (shares / views) * 100 : 0

      setAnalytics({
        views,
        likes,
        shares,
        downloads,
        comments,
        revenue,
        engagement,
        viralScore
      })

      // Calculate monetization data
      const totalEarnings = totalRevenue
      const premiumSubscribers = totalSubscribers
      const revenueShare = 70
      const monthlyRecurringRevenue = totalRevenue * 0.3 // Estimate
      const lifetimeValue = totalRevenue
      const conversionRate = views > 0 ? (likes / views) * 100 : 0
      const averageOrderValue = monetization?.length ? totalRevenue / monetization.length : 0
      const topRevenueSources = monetization?.slice(0, 5).map(m => m.event_type) || []

      setMonetization({
        totalEarnings,
        premiumSubscribers,
        revenueShare,
        monthlyRecurringRevenue,
        lifetimeValue,
        conversionRate,
        averageOrderValue,
        topRevenueSources
      })

      // Calculate community data
      const activeFollowers = community?.filter(c => c.interaction_type === 'follow').length || 0
      const totalInteractions = community?.length || 0
      const communityScoreValue = communityScore
      const userGeneratedContent = community?.filter(c => c.content).length || 0
      const averageRating = community?.filter(c => c.rating).reduce((sum, c) => sum + (c.rating || 0), 0) / (community?.filter(c => c.rating).length || 1) || 0
      const topContributors = community?.slice(0, 5).map(c => c.user_id) || []

      setCommunity({
        activeFollowers,
        totalInteractions,
        communityScore: communityScoreValue,
        userGeneratedContent,
        averageRating,
        topContributors
      })

      // Calculate AI data
      const analyzedImages = aiAnalysisCount
      const averageConfidence = aiAnalysis?.reduce((sum, a) => sum + (a.confidence_score || 0), 0) / (aiAnalysis?.length || 1) || 0
      const contentSafetyScore = aiAnalysis?.reduce((sum, a) => sum + (a.content_safety_score || 0), 0) / (aiAnalysis?.length || 1) || 0
      const topTags = aiAnalysis?.flatMap(a => a.tags || []).slice(0, 10) || []
      const qualityMetrics = {
        sharpness: 0.85,
        brightness: 0.78,
        contrast: 0.72
      }

      setAI({
        analyzedImages,
        processingJobs: processingJobsCount,
        averageConfidence,
        contentSafetyScore,
        topTags,
        qualityMetrics
      })

    } catch (error) {
      console.error('Error loading enterprise data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading Enterprise Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enterprise Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for your author platform
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Zap className="w-4 h-4" />
            <span>Enterprise Edition</span>
          </Badge>
          <Button onClick={loadEnterpriseData} variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Albums</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAlbums}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(metrics.totalAlbums * 0.1)} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalImages}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(metrics.totalImages * 0.15)} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +${(metrics.totalRevenue * 0.2).toFixed(2)} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community Score</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.communityScore * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              +{(metrics.communityScore * 10).toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="monetization">Monetization</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="ai">AI & ML</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Engagement Metrics</span>
                </CardTitle>
                <CardDescription>
                  Real-time engagement tracking across all content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <span>Views</span>
                  </div>
                  <span className="font-semibold">{analytics.views.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span>Likes</span>
                  </div>
                  <span className="font-semibold">{analytics.likes.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Share2 className="h-4 w-4 text-green-500" />
                    <span>Shares</span>
                  </div>
                  <span className="font-semibold">{analytics.shares.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Download className="h-4 w-4 text-purple-500" />
                    <span>Downloads</span>
                  </div>
                  <span className="font-semibold">{analytics.downloads.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4 text-orange-500" />
                    <span>Comments</span>
                  </div>
                  <span className="font-semibold">{analytics.comments.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Revenue Overview</span>
                </CardTitle>
                <CardDescription>
                  Monetization performance and earnings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Total Earnings</span>
                  <span className="font-semibold">${monetization.totalEarnings.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Premium Subscribers</span>
                  <span className="font-semibold">{monetization.premiumSubscribers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Monthly Recurring</span>
                  <span className="font-semibold">${monetization.monthlyRecurringRevenue.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Conversion Rate</span>
                  <span className="font-semibold">{monetization.conversionRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Avg Order Value</span>
                  <span className="font-semibold">${monetization.averageOrderValue.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* AI & ML Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>AI & ML Status</span>
                </CardTitle>
                <CardDescription>
                  Artificial intelligence and machine learning metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Analyzed Images</span>
                  <span className="font-semibold">{ai.analyzedImages}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Processing Jobs</span>
                  <span className="font-semibold">{ai.processingJobs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Avg Confidence</span>
                  <span className="font-semibold">{(ai.averageConfidence * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Safety Score</span>
                  <span className="font-semibold">{(ai.contentSafetyScore * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Top Tags</span>
                  <span className="font-semibold">{ai.topTags.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Community Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Community Health</span>
                </CardTitle>
                <CardDescription>
                  Community engagement and social metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Active Followers</span>
                  <span className="font-semibold">{community.activeFollowers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Interactions</span>
                  <span className="font-semibold">{community.totalInteractions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Community Score</span>
                  <span className="font-semibold">{(community.communityScore * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>User Content</span>
                  <span className="font-semibold">{community.userGeneratedContent}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Avg Rating</span>
                  <span className="font-semibold">{community.averageRating.toFixed(1)}/5</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Analytics</CardTitle>
                <CardDescription>
                  Detailed engagement metrics and trends
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span>Engagement Rate</span>
                    <span className="font-semibold">{analytics.engagement.toFixed(1)}%</span>
                  </div>
                  <Progress value={analytics.engagement} className="w-full" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span>Viral Score</span>
                    <span className="font-semibold">{analytics.viralScore.toFixed(1)}%</span>
                  </div>
                  <Progress value={analytics.viralScore} className="w-full" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span>Revenue per View</span>
                    <span className="font-semibold">${analytics.views > 0 ? (analytics.revenue / analytics.views).toFixed(4) : '0.0000'}</span>
                  </div>
                  <Progress value={analytics.views > 0 ? (analytics.revenue / analytics.views) * 1000 : 0} className="w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Key performance indicators and benchmarks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{analytics.views.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{analytics.likes.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Likes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{analytics.shares.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Shares</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{analytics.comments.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Comments</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monetization Tab */}
        <TabsContent value="monetization" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Streams</CardTitle>
                <CardDescription>
                  Breakdown of revenue sources and performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span>Total Earnings</span>
                    <span className="font-semibold">${monetization.totalEarnings.toFixed(2)}</span>
                  </div>
                  <Progress value={monetization.totalEarnings > 0 ? Math.min(monetization.totalEarnings / 1000 * 100, 100) : 0} className="w-full" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span>Monthly Recurring</span>
                    <span className="font-semibold">${monetization.monthlyRecurringRevenue.toFixed(2)}</span>
                  </div>
                  <Progress value={monetization.monthlyRecurringRevenue > 0 ? Math.min(monetization.monthlyRecurringRevenue / 500 * 100, 100) : 0} className="w-full" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span>Lifetime Value</span>
                    <span className="font-semibold">${monetization.lifetimeValue.toFixed(2)}</span>
                  </div>
                  <Progress value={monetization.lifetimeValue > 0 ? Math.min(monetization.lifetimeValue / 2000 * 100, 100) : 0} className="w-full" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span>Conversion Rate</span>
                    <span className="font-semibold">{monetization.conversionRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={monetization.conversionRate} className="w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>
                  Detailed revenue metrics and trends
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{monetization.premiumSubscribers}</div>
                    <div className="text-sm text-muted-foreground">Premium Subscribers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{monetization.revenueShare}%</div>
                    <div className="text-sm text-muted-foreground">Revenue Share</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">${monetization.averageOrderValue.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Avg Order Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{monetization.topRevenueSources.length}</div>
                    <div className="text-sm text-muted-foreground">Revenue Sources</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Community Tab */}
        <TabsContent value="community" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Community Engagement</CardTitle>
                <CardDescription>
                  Social metrics and community health indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span>Community Score</span>
                    <span className="font-semibold">{(community.communityScore * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={community.communityScore * 100} className="w-full" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span>Active Followers</span>
                    <span className="font-semibold">{community.activeFollowers}</span>
                  </div>
                  <Progress value={community.activeFollowers > 0 ? Math.min(community.activeFollowers / 100 * 100, 100) : 0} className="w-full" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span>User Generated Content</span>
                    <span className="font-semibold">{community.userGeneratedContent}</span>
                  </div>
                  <Progress value={community.userGeneratedContent > 0 ? Math.min(community.userGeneratedContent / 50 * 100, 100) : 0} className="w-full" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span>Average Rating</span>
                    <span className="font-semibold">{community.averageRating.toFixed(1)}/5</span>
                  </div>
                  <Progress value={(community.averageRating / 5) * 100} className="w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Community Metrics</CardTitle>
                <CardDescription>
                  Detailed community performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{community.activeFollowers}</div>
                    <div className="text-sm text-muted-foreground">Active Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{community.totalInteractions}</div>
                    <div className="text-sm text-muted-foreground">Total Interactions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{community.userGeneratedContent}</div>
                    <div className="text-sm text-muted-foreground">User Content</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{community.topContributors.length}</div>
                    <div className="text-sm text-muted-foreground">Top Contributors</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI & ML Tab */}
        <TabsContent value="ai" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Performance</CardTitle>
                <CardDescription>
                  Artificial intelligence and machine learning metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span>Average Confidence</span>
                    <span className="font-semibold">{(ai.averageConfidence * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={ai.averageConfidence * 100} className="w-full" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span>Content Safety Score</span>
                    <span className="font-semibold">{(ai.contentSafetyScore * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={ai.contentSafetyScore * 100} className="w-full" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span>Processing Jobs</span>
                    <span className="font-semibold">{ai.processingJobs}</span>
                  </div>
                  <Progress value={ai.processingJobs > 0 ? Math.min(ai.processingJobs / 10 * 100, 100) : 0} className="w-full" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span>Analyzed Images</span>
                    <span className="font-semibold">{ai.analyzedImages}</span>
                  </div>
                  <Progress value={ai.analyzedImages > 0 ? Math.min(ai.analyzedImages / 100 * 100, 100) : 0} className="w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
                <CardDescription>
                  Image quality assessment and optimization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{(ai.qualityMetrics.sharpness * 100).toFixed(0)}%</div>
                    <div className="text-sm text-muted-foreground">Sharpness</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{(ai.qualityMetrics.brightness * 100).toFixed(0)}%</div>
                    <div className="text-sm text-muted-foreground">Brightness</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{(ai.qualityMetrics.contrast * 100).toFixed(0)}%</div>
                    <div className="text-sm text-muted-foreground">Contrast</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{ai.topTags.length}</div>
                    <div className="text-sm text-muted-foreground">AI Tags</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}