import React from 'react'
import { Metadata } from 'next'
import PostManagementDashboard from '@/components/enterprise/post-management-dashboard'
import ContentModerationSystem from '@/components/enterprise/content-moderation-system'
import PostAnalyticsInsights from '@/components/enterprise/post-analytics-insights'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Shield, TrendingUp, Settings, Users, Activity, Target, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Posts Dashboard | Post Management & Analytics',
  description:
    'Comprehensive dashboard for managing posts, content moderation, and analytics insights',
}

export default function PostsDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Posts Dashboard</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Comprehensive post management, content moderation, and analytics platform for
          enterprise-grade content operations
        </p>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold">156</p>
                <p className="text-xs text-green-600">+12% this month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Engagement Rate</p>
                <p className="text-2xl font-bold">8.7%</p>
                <p className="text-xs text-green-600">+2.1% this month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Reports</p>
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-orange-600">Requires attention</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trending Posts</p>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-purple-600">Currently viral</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="management" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="management" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Post Management</span>
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Content Moderation</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Analytics & Insights</span>
          </TabsTrigger>
        </TabsList>

        {/* Post Management Tab */}
        <TabsContent value="management" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Post Management Dashboard</h2>
                <p className="text-muted-foreground">
                  Create, edit, and manage all your posts with enterprise-grade tools
                </p>
              </div>
            </div>
            <PostManagementDashboard />
          </div>
        </TabsContent>

        {/* Content Moderation Tab */}
        <TabsContent value="moderation" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Content Moderation System</h2>
                <p className="text-muted-foreground">
                  Automated content detection, user reporting, and moderation workflows
                </p>
              </div>
            </div>
            <ContentModerationSystem />
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Post Analytics & Insights</h2>
                <p className="text-muted-foreground">
                  Track performance, identify trends, and optimize your content strategy
                </p>
              </div>
            </div>
            <PostAnalyticsInsights />
          </div>
        </TabsContent>
      </Tabs>

      {/* Enterprise Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Enterprise Features Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span>Post Management</span>
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Bulk operations & batch processing</li>
                <li>• Advanced filtering & search</li>
                <li>• Post scheduling & automation</li>
                <li>• Content versioning & history</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span>Content Moderation</span>
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automated content detection</li>
                <li>• User reporting system</li>
                <li>• Moderation workflows</li>
                <li>• Content warning system</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span>Analytics & Insights</span>
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Engagement metrics tracking</li>
                <li>• Trending post detection</li>
                <li>• Audience insights & demographics</li>
                <li>• Performance optimization</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-sm">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Create New Post</p>
                  <p className="text-sm text-muted-foreground">Start writing</p>
                </div>
              </div>
            </button>

            <button className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-sm">
                  <Shield className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Review Reports</p>
                  <p className="text-sm text-muted-foreground">3 pending</p>
                </div>
              </div>
            </button>

            <button className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-sm">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">View Analytics</p>
                  <p className="text-sm text-muted-foreground">Performance insights</p>
                </div>
              </div>
            </button>

            <button className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-sm">
                  <Settings className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Dashboard Settings</p>
                  <p className="text-sm text-muted-foreground">Configure preferences</p>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
