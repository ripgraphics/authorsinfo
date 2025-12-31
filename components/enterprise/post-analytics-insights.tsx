'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Post } from '@/types/post'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Target,
  Zap,
  Activity,
  Users,
  Clock,
  Award,
  AlertCircle,
} from 'lucide-react'

interface PostAnalyticsInsightsProps {
  className?: string
}

interface AnalyticsData {
  totalPosts: number
  totalViews: number
  totalLikes: number
  totalComments: number
  totalShares: number
  totalBookmarks: number
  averageEngagement: number
  trendingPosts: number
  viralPosts: number
  topPerformingPost: Post | null
  engagementTrend: {
    date: string
    views: number
    likes: number
    comments: number
    shares: number
  }[]
  topHashtags: {
    tag: string
    count: number
    engagement: number
  }[]
  audienceInsights: {
    peakHours: number[]
    peakDays: string[]
    demographics: {
      age: string
      percentage: number
    }[]
  }
}

interface PostPerformance {
  post: Post
  views: number
  likes: number
  comments: number
  shares: number
  bookmarks: number
  engagementScore: number
  reach: number
  viralCoefficient: number
  trendingScore: number
}

export default function PostAnalyticsInsights({ className }: PostAnalyticsInsightsProps) {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    totalBookmarks: 0,
    averageEngagement: 0,
    trendingPosts: 0,
    viralPosts: 0,
    topPerformingPost: null,
    engagementTrend: [],
    topHashtags: [],
    audienceInsights: {
      peakHours: [],
      peakDays: [],
      demographics: [],
    },
  })
  const [topPosts, setTopPosts] = useState<PostPerformance[]>([])
  const [currentTab, setCurrentTab] = useState('overview')
  const [dateRange, setDateRange] = useState('30')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mock data for demonstration - in production this would come from API
  useEffect(() => {
    const mockAnalytics: AnalyticsData = {
      totalPosts: 156,
      totalViews: 12450,
      totalLikes: 2340,
      totalComments: 890,
      totalShares: 456,
      totalBookmarks: 234,
      averageEngagement: 8.7,
      trendingPosts: 12,
      viralPosts: 3,
      topPerformingPost: null,
      engagementTrend: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        views: Math.floor(Math.random() * 100) + 50,
        likes: Math.floor(Math.random() * 20) + 5,
        comments: Math.floor(Math.random() * 10) + 2,
        shares: Math.floor(Math.random() * 8) + 1,
      })),
      topHashtags: [
        { tag: 'tech', count: 45, engagement: 12.3 },
        { tag: 'programming', count: 38, engagement: 15.7 },
        { tag: 'webdev', count: 32, engagement: 9.8 },
        { tag: 'javascript', count: 28, engagement: 18.2 },
        { tag: 'react', count: 25, engagement: 22.1 },
      ],
      audienceInsights: {
        peakHours: [9, 12, 18, 21],
        peakDays: ['Monday', 'Wednesday', 'Friday'],
        demographics: [
          { age: '18-24', percentage: 35 },
          { age: '25-34', percentage: 42 },
          { age: '35-44', percentage: 18 },
          { age: '45+', percentage: 5 },
        ],
      },
    }

    setAnalytics(mockAnalytics)
  }, [])

  // Calculate engagement rate
  const calculateEngagementRate = useCallback((post: Post) => {
    const totalInteractions =
      (post.like_count || 0) + (post.comment_count || 0) + (post.share_count || 0)
    const reach = post.view_count || 1
    return (totalInteractions / reach) * 100
  }, [])

  // Calculate viral coefficient
  const calculateViralCoefficient = useCallback((post: Post) => {
    const shares = post.share_count || 0
    const views = post.view_count || 1
    return shares / views
  }, [])

  // Calculate trending score
  const calculateTrendingScore = useCallback((post: Post) => {
    const now = new Date()
    const postDate = new Date(post.created_at)
    const hoursSincePost = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60)

    const engagement = (post.like_count || 0) + (post.comment_count || 0) + (post.share_count || 0)
    const views = post.view_count || 0

    // Trending score formula: (engagement * views) / (hours since post + 1)
    return (engagement * views) / (hoursSincePost + 1)
  }, [])

  // Get performance insights
  const getPerformanceInsights = useCallback(() => {
    const insights = []

    if (analytics.averageEngagement > 10) {
      insights.push({
        type: 'positive',
        message: 'Your engagement rate is above average! Keep creating quality content.',
        icon: '🎉',
      })
    } else if (analytics.averageEngagement < 5) {
      insights.push({
        type: 'warning',
        message: 'Consider optimizing your content for better engagement.',
        icon: '💡',
      })
    }

    if (analytics.trendingPosts > 0) {
      insights.push({
        type: 'positive',
        message: `${analytics.trendingPosts} posts are currently trending!`,
        icon: '🔥',
      })
    }

    if (analytics.viralPosts > 0) {
      insights.push({
        type: 'positive',
        message: `${analytics.viralPosts} posts went viral this period!`,
        icon: '🚀',
      })
    }

    return insights
  }, [analytics])

  // Get top performing posts
  const getTopPerformingPosts = useCallback(
    (posts: Post[]) => {
      return posts
        .map((post) => ({
          post,
          views: post.view_count || 0,
          likes: post.like_count || 0,
          comments: post.comment_count || 0,
          shares: post.share_count || 0,
          bookmarks: 0, // Mock data
          engagementScore: calculateEngagementRate(post),
          reach: post.view_count || 0,
          viralCoefficient: calculateViralCoefficient(post),
          trendingScore: calculateTrendingScore(post),
        }))
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, 10)
    },
    [calculateEngagementRate, calculateViralCoefficient, calculateTrendingScore]
  )

  // Mock posts for demonstration
  useEffect(() => {
    const mockPosts: Post[] = [
      {
        id: '1',
        user_id: 'user-1',
        content: { text: 'Amazing tech insights today!' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        visibility: 'public',
        content_type: 'text',
        publish_status: 'published',
        view_count: 1250,
        like_count: 89,
        comment_count: 23,
        share_count: 12,
        engagement_score: 15.2,
        is_deleted: false,
        is_hidden: false,
        last_activity_at: new Date().toISOString(),
        metadata: {},
        enterprise_features: {},
      } as Post,
      {
        id: '2',
        user_id: 'user-1',
        content: { text: 'Check out this new framework!' },
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        visibility: 'public',
        content_type: 'text',
        publish_status: 'published',
        view_count: 890,
        like_count: 67,
        comment_count: 18,
        share_count: 8,
        engagement_score: 12.8,
        is_deleted: false,
        is_hidden: false,
        last_activity_at: new Date(Date.now() - 86400000).toISOString(),
        metadata: {},
        enterprise_features: {},
      } as Post,
    ]

    setTopPosts(getTopPerformingPosts(mockPosts))
  }, [getTopPerformingPosts])

  const insights = getPerformanceInsights()

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Please log in to access post analytics and insights.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Post Analytics & Insights</h1>
          <p className="text-muted-foreground">
            Track performance, identify trends, and optimize your content strategy
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Views</p>
                <p className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</p>
                <p className="text-xs text-green-600">+12% from last period</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Likes</p>
                <p className="text-2xl font-bold">{analytics.totalLikes.toLocaleString()}</p>
                <p className="text-xs text-green-600">+8% from last period</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Avg Engagement</p>
                <p className="text-2xl font-bold">{analytics.averageEngagement.toFixed(1)}%</p>
                <p className="text-xs text-green-600">+2.1% from last period</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Trending Posts</p>
                <p className="text-2xl font-bold">{analytics.trendingPosts}</p>
                <p className="text-xs text-blue-600">Currently trending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Performance Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    insight.type === 'positive'
                      ? 'border-green-200 bg-green-50'
                      : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{insight.icon}</span>
                    <p className="text-sm font-medium">{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Engagement Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.engagementTrend.slice(-7).map((day) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                      <div className="flex items-center space-x-4 text-sm">
                        <span>👁️ {day.views}</span>
                        <span>❤️ {day.likes}</span>
                        <span>💬 {day.comments}</span>
                        <span>📤 {day.shares}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Hashtags */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Hashtags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topHashtags.map((hashtag, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded-sm"
                    >
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">#{hashtag.tag}</Badge>
                        <span className="text-sm text-muted-foreground">{hashtag.count} posts</span>
                      </div>
                      <div className="text-sm font-medium">
                        {hashtag.engagement.toFixed(1)}% engagement
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPosts.map((performance, index) => (
                  <div
                    key={performance.post.id}
                    className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">#{index + 1}</Badge>
                      {index < 3 && <Award className="h-4 w-4 text-yellow-500" />}
                    </div>

                    <div className="flex-1">
                      <h4 className="font-medium truncate">
                        {performance.post.content?.text ||
                          (performance.post as any).text ||
                          (performance.post as any).data?.text ||
                          'No content'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(performance.post.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="grid grid-cols-5 gap-4 text-sm text-center">
                      <div>
                        <p className="font-medium">{performance.views}</p>
                        <p className="text-muted-foreground">Views</p>
                      </div>
                      <div>
                        <p className="font-medium">{performance.likes}</p>
                        <p className="text-muted-foreground">Likes</p>
                      </div>
                      <div>
                        <p className="font-medium">{performance.comments}</p>
                        <p className="text-muted-foreground">Comments</p>
                      </div>
                      <div>
                        <p className="font-medium">{performance.shares}</p>
                        <p className="text-muted-foreground">Shares</p>
                      </div>
                      <div>
                        <p className="font-medium">{performance.engagementScore.toFixed(1)}%</p>
                        <p className="text-muted-foreground">Engagement</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge variant="secondary">
                        Score: {performance.trendingScore.toFixed(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trending Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Viral Coefficient */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Viral Coefficient</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {analytics.viralPosts > 0 ? 'High' : 'Low'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {analytics.viralPosts} posts went viral this period
                  </p>
                </div>

                {/* Trending Score */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Trending Score</h4>
                  <p className="text-2xl font-bold text-green-600">{analytics.trendingPosts}</p>
                  <p className="text-sm text-muted-foreground">Posts currently trending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak Activity Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Peak Activity Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.audienceInsights.peakHours.map((hour, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{hour}:00</span>
                      <div className="flex-1 mx-4">
                        <div className="bg-blue-200 h-2 rounded-full">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(hour / 24) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">Peak</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Demographics */}
            <Card>
              <CardHeader>
                <CardTitle>Audience Demographics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.audienceInsights.demographics.map((demo, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{demo.age}</span>
                      <div className="flex-1 mx-4">
                        <div className="bg-gray-200 h-2 rounded-full">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${demo.percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium">{demo.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
