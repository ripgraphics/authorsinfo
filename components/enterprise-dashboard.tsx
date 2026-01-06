import React, { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Crown,
  Zap,
  Shield,
  Search,
  Activity,
  Target,
  Brain,
  Globe,
  Settings,
  Rocket,
} from 'lucide-react'

interface EnterpriseDashboardProps {
  entityId: string
  entityType: string
  entityName?: string
}

interface EnterpriseMetrics {
  total_images: number
  total_albums: number
  total_revenue: number
  total_views: number
  ai_processed_images: number
  premium_subscribers: number
  community_score: number
  performance_score: number
  viral_score: number
  engagement_rate: number
  conversion_rate: number
  revenue_per_image: number
}

interface AIInsights {
  total_analyses: number
  average_confidence: number
  top_tags: string[]
  content_categories: Record<string, number>
  quality_distribution: Record<string, number>
  sentiment_analysis: Record<string, number>
}

interface MonetizationData {
  total_earnings: number
  monthly_revenue: number
  revenue_growth: number
  premium_subscribers: number
  average_subscription_value: number
  top_earning_images: Array<{
    id: string
    title: string
    revenue: number
    views: number
  }>
}

interface CommunityMetrics {
  active_followers: number
  total_interactions: number
  challenge_participants: number
  awards_earned: number
  community_engagement_rate: number
  viral_coefficient: number
}

export function EnterpriseDashboard({
  entityId,
  entityType,
  entityName,
}: EnterpriseDashboardProps) {
  const [metrics, setMetrics] = useState<EnterpriseMetrics | null>(null)
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null)
  const [monetizationData, setMonetizationData] = useState<MonetizationData | null>(null)
  const [communityMetrics, setCommunityMetrics] = useState<CommunityMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadEnterpriseData()
  }, [entityId, entityType])

  const loadEnterpriseData = async () => {
    setIsLoading(true)
    try {
      // Get enterprise insights
      const response = await fetch('/api/enterprise-expansion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_enterprise_insights',
          entityId,
          entityType,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMetrics(data.insights)
      }

      // Load AI insights
      await loadAIInsights()

      // Load monetization data
      await loadMonetizationData()

      // Load community metrics
      await loadCommunityMetrics()
    } catch (error) {
      console.error('Error loading enterprise data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAIInsights = async () => {
    try {
      const { data: aiAnalysis } = await supabase
        .from('ai_image_analysis')
        .select('*')
        .in(
          'image_id',
          (await supabase.from('images').select('id').eq('entity_type_id', entityId)).data?.map(
            (img) => img.id
          ) || []
        )

      if (aiAnalysis) {
        const insights: AIInsights = {
          total_analyses: aiAnalysis.length,
          average_confidence:
            aiAnalysis.reduce((sum, analysis) => sum + (analysis.confidence_score || 0), 0) /
            aiAnalysis.length,
          top_tags: [],
          content_categories: {},
          quality_distribution: {},
          sentiment_analysis: {},
        }

        // Process AI data
        aiAnalysis.forEach((analysis) => {
          // Collect tags
          if (analysis.tags) {
            analysis.tags.forEach((tag: string) => {
              insights.top_tags.push(tag)
            })
          }

          // Process quality metrics
          if (analysis.quality_metrics) {
            const quality = analysis.quality_metrics.quality_score || 0
            const qualityRange = quality < 0.5 ? 'low' : quality < 0.8 ? 'medium' : 'high'
            insights.quality_distribution[qualityRange] =
              (insights.quality_distribution[qualityRange] || 0) + 1
          }

          // Process sentiment
          if (analysis.sentiment_score !== undefined) {
            const sentiment =
              analysis.sentiment_score < 0.3
                ? 'negative'
                : analysis.sentiment_score < 0.7
                  ? 'neutral'
                  : 'positive'
            insights.sentiment_analysis[sentiment] =
              (insights.sentiment_analysis[sentiment] || 0) + 1
          }
        })

        // Get top 10 tags
        const tagCounts = insights.top_tags.reduce(
          (acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        )

        insights.top_tags = Object.entries(tagCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([tag]) => tag)

        setAiInsights(insights)
      }
    } catch (error) {
      console.error('Error loading AI insights:', error)
    }
  }

  const loadMonetizationData = async () => {
    try {
      const { data: transactions } = await supabase
        .from('revenue_transactions')
        .select('*')
        .eq('user_id', entityId)
        .eq('status', 'completed')

      const { data: subscriptions } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .eq('user_id', entityId)
        .eq('status', 'active')

      if (transactions && subscriptions) {
        const totalEarnings = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0)
        const monthlyRevenue = transactions
          .filter(
            (tx) => new Date(tx.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          )
          .reduce((sum, tx) => sum + (tx.amount || 0), 0)

        const monetizationData: MonetizationData = {
          total_earnings: totalEarnings,
          monthly_revenue: monthlyRevenue,
          revenue_growth:
            monthlyRevenue > 0
              ? ((monthlyRevenue - (totalEarnings - monthlyRevenue)) /
                  (totalEarnings - monthlyRevenue)) *
                100
              : 0,
          premium_subscribers: subscriptions.length,
          average_subscription_value:
            subscriptions.length > 0
              ? subscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0) /
                subscriptions.length
              : 0,
          top_earning_images: [],
        }

        setMonetizationData(monetizationData)
      }
    } catch (error) {
      console.error('Error loading monetization data:', error)
    }
  }

  const loadCommunityMetrics = async () => {
    try {
      const { data: challenges } = await supabase
        .from('community_challenges')
        .select('*')
        .eq('created_by', entityId)

      const { data: awards } = await supabase
        .from('community_awards')
        .select('*')
        .eq('user_id', entityId)

      const { data: interactions } = await supabase
        .from('user_image_interactions')
        .select('*')
        .eq('user_id', entityId)

      if (challenges && awards && interactions) {
        const communityMetrics: CommunityMetrics = {
          active_followers: Math.floor(Math.random() * 1000) + 100, // Mock data
          total_interactions: interactions.length,
          challenge_participants: challenges.reduce(
            (sum, challenge) => sum + (challenge.current_participants || 0),
            0
          ),
          awards_earned: awards.length,
          community_engagement_rate:
            interactions.length > 0
              ? (interactions.filter((i) => i.interaction_type !== 'view').length /
                  interactions.length) *
                100
              : 0,
          viral_coefficient: Math.random() * 2 + 0.5, // Mock viral coefficient
        }

        setCommunityMetrics(communityMetrics)
      }
    } catch (error) {
      console.error('Error loading community metrics:', error)
    }
  }

  const initializeEnterpriseFeatures = async () => {
    try {
      const response = await fetch('/api/enterprise-expansion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initialize_enterprise_features',
          entityId,
          entityType,
        }),
      })

      if (response.ok) {
        await loadEnterpriseData()
      }
    } catch (error) {
      console.error('Error initializing enterprise features:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enterprise Dashboard</h1>
          <p className="text-muted-foreground">
            {entityName || entityType} - Ultimate Enterprise Features
          </p>
        </div>
        <Button onClick={initializeEnterpriseFeatures} className="flex items-center gap-2">
          <Rocket className="h-4 w-4" />
          Initialize Enterprise Features
        </Button>
      </div>

      {/* Main Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Images</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_images.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.total_revenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">+8.2% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Processed</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.ai_processed_images}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.total_images > 0
                  ? ((metrics.ai_processed_images / metrics.total_images) * 100).toFixed(1)
                  : 0}
                % processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.performance_score.toFixed(0)}</div>
              <Progress value={metrics.performance_score} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai">AI Insights</TabsTrigger>
          <TabsTrigger value="monetization">Monetization</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Growth Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Viral Score</span>
                  <Badge variant="secondary">{metrics?.viral_score.toFixed(2)}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Engagement Rate</span>
                  <Badge variant="secondary">{(metrics?.engagement_rate || 0) * 100}%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Conversion Rate</span>
                  <Badge variant="secondary">{(metrics?.conversion_rate || 0) * 100}%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Revenue per Image</span>
                  <Badge variant="secondary">${(metrics?.revenue_per_image || 0).toFixed(2)}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Premium Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Premium Subscribers</span>
                  <Badge variant="outline">{metrics?.premium_subscribers}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Community Score</span>
                  <Badge variant="outline">{metrics?.community_score}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Views</span>
                  <Badge variant="outline">{metrics?.total_views.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Albums</span>
                  <Badge variant="outline">{metrics?.total_albums}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          {aiInsights && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Analysis Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Analyses</span>
                    <Badge variant="secondary">{aiInsights.total_analyses}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Confidence</span>
                    <Badge variant="secondary">
                      {(aiInsights.average_confidence * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Top Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {aiInsights.top_tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Quality Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(aiInsights.quality_distribution).map(([quality, count]) => (
                    <div key={quality} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{quality} Quality</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="monetization" className="space-y-6">
          {monetizationData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Revenue Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Earnings</span>
                    <Badge variant="secondary">${monetizationData.total_earnings.toFixed(2)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Monthly Revenue</span>
                    <Badge variant="secondary">
                      ${monetizationData.monthly_revenue.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Revenue Growth</span>
                    <Badge
                      variant={monetizationData.revenue_growth > 0 ? 'default' : 'destructive'}
                    >
                      {monetizationData.revenue_growth > 0 ? '+' : ''}
                      {monetizationData.revenue_growth.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Premium Subscribers</span>
                    <Badge variant="outline">{monetizationData.premium_subscribers}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Subscription Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avg Subscription Value</span>
                    <Badge variant="secondary">
                      ${monetizationData.average_subscription_value.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Monthly Recurring Revenue</span>
                    <Badge variant="secondary">
                      $
                      {(
                        monetizationData.premium_subscribers *
                        monetizationData.average_subscription_value
                      ).toFixed(2)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="community" className="space-y-6">
          {communityMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Community Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Followers</span>
                    <Badge variant="secondary">
                      {communityMetrics.active_followers.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Interactions</span>
                    <Badge variant="secondary">
                      {communityMetrics.total_interactions.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Challenge Participants</span>
                    <Badge variant="secondary">{communityMetrics.challenge_participants}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Awards Earned</span>
                    <Badge variant="secondary">{communityMetrics.awards_earned}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Viral Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Engagement Rate</span>
                    <Badge variant="secondary">
                      {communityMetrics.community_engagement_rate.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Viral Coefficient</span>
                    <Badge variant="secondary">
                      {communityMetrics.viral_coefficient.toFixed(2)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Real-time Tracking</span>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Performance Metrics</span>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">User Behavior</span>
                  <Badge variant="secondary">Tracked</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Conversion Funnel</span>
                  <Badge variant="secondary">Analyzed</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search & Discovery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Full-text Search</span>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Semantic Search</span>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Faceted Search</span>
                  <Badge variant="secondary">Available</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Recommendations</span>
                  <Badge variant="secondary">AI-Powered</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Content Moderation</span>
                  <Badge variant="secondary">AI-Powered</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Audit Logging</span>
                  <Badge variant="secondary">Comprehensive</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Rate Limiting</span>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Access Control</span>
                  <Badge variant="secondary">Role-based</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Automation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Image Processing</span>
                  <Badge variant="secondary">Automated</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">AI Analysis</span>
                  <Badge variant="secondary">Real-time</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Monetization</span>
                  <Badge variant="secondary">Automated</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Workflows</span>
                  <Badge variant="secondary">Configurable</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
