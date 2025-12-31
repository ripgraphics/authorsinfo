import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Eye, Heart, Share2, Users, Activity, Target } from 'lucide-react'

interface PhotoGalleryAnalyticsProps {
  analytics: {
    total_views: number
    total_likes: number
    total_shares: number
    total_revenue: number
    engagement_rate: number
    viral_score: number
  }
  className?: string
}

export function PhotoGalleryAnalytics({ analytics, className = '' }: PhotoGalleryAnalyticsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatPercentage = (num: number) => `${(num * 100).toFixed(1)}%`

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Eye className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{formatNumber(analytics.total_views)}</div>
              <div className="text-sm text-muted-foreground">Views</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Heart className="h-4 w-4 text-red-500" />
              </div>
              <div className="text-2xl font-bold">{formatNumber(analytics.total_likes)}</div>
              <div className="text-sm text-muted-foreground">Likes</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Share2 className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold">{formatNumber(analytics.total_shares)}</div>
              <div className="text-sm text-muted-foreground">Shares</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold">${formatNumber(analytics.total_revenue)}</div>
              <div className="text-sm text-muted-foreground">Revenue</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Activity className="h-4 w-4 text-orange-500" />
              </div>
              <div className="text-2xl font-bold">
                {formatPercentage(analytics.engagement_rate)}
              </div>
              <div className="text-sm text-muted-foreground">Engagement</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold">{analytics.viral_score.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Viral Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Engagement Rate</span>
                <Badge variant="secondary">{formatPercentage(analytics.engagement_rate)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Viral Coefficient</span>
                <Badge variant="secondary">{analytics.viral_score.toFixed(2)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Revenue per View</span>
                <Badge variant="secondary">
                  ${(analytics.total_revenue / Math.max(analytics.total_views, 1)).toFixed(2)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Audience Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Viewers</span>
                <Badge variant="outline">{formatNumber(analytics.total_views * 0.3)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Engaged Users</span>
                <Badge variant="outline">
                  {formatNumber(analytics.total_likes + analytics.total_shares)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Conversion Rate</span>
                <Badge variant="outline">
                  {formatPercentage(analytics.engagement_rate * 0.15)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
