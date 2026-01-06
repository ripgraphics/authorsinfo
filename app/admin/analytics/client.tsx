'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/lib/stores/admin-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  BookOpen,
  TrendingUp,
  Activity,
  AlertCircle,
  Shield,
  BarChart3,
  FileText,
  RefreshCw,
} from 'lucide-react';
import {
  UserGrowthChart,
  EngagementChart,
  ActionBreakdownChart,
  EntityBreakdownChart,
} from '@/components/admin-charts';
import {
  AuditLogFilter,
  AuditLogFilters,
  ModerationQueueFilter,
  ModerationFilters,
} from '@/components/admin-filters';
import { ErrorBoundary } from '@/components/error-boundary';
import {
  DashboardSkeleton,
  AnalyticsSummarySkeleton,
  TabContentSkeleton,
} from '@/components/skeleton-loaders';

interface AdminAnalyticsDashboardProps {
  userId: string;
}

export function AdminAnalyticsDashboard({ userId }: AdminAnalyticsDashboardProps) {
  const {
    platformStats,
    userGrowth,
    engagement,
    moderationQueue,
    moderationStats,
    auditLogs,
    analyticsLoading,
    moderationLoading,
    auditLogsLoading,
    fetchPlatformStats,
    fetchUserGrowth,
    fetchEngagement,
    fetchModerationQueue,
    fetchAuditLogs,
    updateModerationItem,
  } = useAdminStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Fetch all data on mount
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      fetchPlatformStats(),
      fetchUserGrowth('daily', 30),
      fetchEngagement(30),
      fetchModerationQueue({ status: 'pending', limit: 10 }),
      fetchAuditLogs({ limit: 20 }),
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    description,
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: string;
    description?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            <span className={trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
              {trend}
            </span>{' '}
            from last period
          </p>
        )}
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );

  // Show skeleton while loading
  if (!platformStats && analyticsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <ErrorBoundary componentName="AdminAnalyticsDashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Analytics Dashboard</h1>
            <p className="text-muted-foreground">Platform management, analytics, and moderation</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || analyticsLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            <Button size="sm" asChild>
              <a href="/admin/analytics/segments">
                <Users className="mr-2 h-4 w-4" />
                Manage Segments
              </a>
            </Button>
          </div>
        </div>

        {/* Quick Stats Overview */}
        {platformStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={platformStats.overview.totalUsers}
            icon={Users}
            trend={`+${platformStats.activity.userGrowthRate}%`}
            description={`${platformStats.activity.newUsersThisMonth} new this month`}
          />
          <StatCard
            title="Active Users (DAU)"
            value={platformStats.activity.dailyActiveUsers}
            icon={Activity}
            description={`${platformStats.activity.dau_mau_ratio}% DAU/MAU ratio`}
          />
          <StatCard
            title="Total Books"
            value={platformStats.overview.totalBooks}
            icon={BookOpen}
            description={`${platformStats.overview.totalAuthors} authors`}
          />
          <StatCard
            title="Pending Moderation"
            value={platformStats.moderation.pendingItems}
            icon={AlertCircle}
            description={moderationStats ? `${moderationStats.byPriority.urgent} urgent` : ''}
          />
        </div>
        ) : (
          <AnalyticsSummarySkeleton />
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="moderation">
              <Shield className="h-4 w-4 mr-2" />
              Moderation
              {platformStats && platformStats.moderation.pendingItems > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {platformStats.moderation.pendingItems}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit">
              <FileText className="h-4 w-4 mr-2" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {platformStats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Statistics</CardTitle>
                    <CardDescription>Platform content overview</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Books</span>
                      <span className="text-lg font-semibold">
                        {platformStats.overview.totalBooks.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Authors</span>
                      <span className="text-lg font-semibold">
                        {platformStats.overview.totalAuthors.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Groups</span>
                      <span className="text-lg font-semibold">
                        {platformStats.overview.totalGroups.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Events</span>
                      <span className="text-lg font-semibold">
                        {platformStats.overview.totalEvents.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Reviews</span>
                      <span className="text-lg font-semibold">
                        {platformStats.overview.totalReviews.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Posts</span>
                      <span className="text-lg font-semibold">
                        {platformStats.overview.totalPosts.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Activity Metrics</CardTitle>
                    <CardDescription>30-day activity overview</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">New Users</span>
                      <span className="text-lg font-semibold">
                        {platformStats.activity.newUsersThisMonth.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Daily Active</span>
                      <span className="text-lg font-semibold">
                        {platformStats.activity.dailyActiveUsers.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Monthly Active</span>
                      <span className="text-lg font-semibold">
                        {platformStats.activity.monthlyActiveUsers.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">DAU/MAU Ratio</span>
                      <span className="text-lg font-semibold text-green-600">
                        {platformStats.activity.dau_mau_ratio}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Growth Rate</span>
                      <span className="text-lg font-semibold text-green-600">
                        +{platformStats.activity.userGrowthRate}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Reading Sessions</span>
                      <span className="text-lg font-semibold">
                        {platformStats.activity.activeReadingSessions.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System Health</CardTitle>
                    <CardDescription>Performance and moderation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Response Time</span>
                      <span className="text-lg font-semibold">
                        {platformStats.performance.avgResponseTime}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Performance Metrics</span>
                      <span className="text-lg font-semibold">
                        {platformStats.performance.totalMetrics.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Pending Moderation</span>
                      <span
                        className={`text-lg font-semibold ${
                          platformStats.moderation.pendingItems > 10
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {platformStats.moderation.pendingItems.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {/* User Growth Chart */}
          {userGrowth && (
            <UserGrowthChart
              data={userGrowth.chartData}
              title="User Growth Trends"
              description="Daily active users and new registrations over the last 30 days"
            />
          )}

          {/* Engagement Chart */}
          {engagement && (
            <EngagementChart
              data={engagement.chartData}
              title="Engagement Metrics"
              description="Platform engagement trends over the last 30 days"
            />
          )}

          {/* Action and Entity Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {engagement && (
              <>
                <ActionBreakdownChart data={engagement.actionBreakdown} />
                <EntityBreakdownChart data={engagement.entityBreakdown} />
              </>
            )}
          </div>

          {/* Summary Statistics */}
          {engagement && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Engagements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {engagement.totalEngagement.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Interactions tracked</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {engagement.uniqueEngagedUsers.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Users engaged</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg Daily Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {engagement.avgDailyEngagement.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Per day average</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Moderation Tab */}
        <TabsContent value="moderation" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Moderation Queue</CardTitle>
                  <CardDescription>Content flagged for review</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchModerationQueue({ status: 'pending' })}
                  disabled={moderationLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${moderationLoading ? 'animate-spin' : ''}`}
                  />
                  Refresh Queue
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Stats Grid */}
              {moderationStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Pending</p>
                    <p className="text-3xl font-bold">{moderationStats.byStatus.pending}</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">In Review</p>
                    <p className="text-3xl font-bold">{moderationStats.byStatus.in_review}</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg border-red-200">
                    <p className="text-sm text-muted-foreground mb-1">Urgent</p>
                    <p className="text-3xl font-bold text-red-600">
                      {moderationStats.byPriority.urgent}
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg border-orange-200">
                    <p className="text-sm text-muted-foreground mb-1">High</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {moderationStats.byPriority.high}
                    </p>
                  </div>
                </div>
              )}

              {/* Queue Items */}
              {moderationLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading moderation queue...</p>
                </div>
              ) : moderationQueue.length > 0 ? (
                <div className="space-y-3">
                  {moderationQueue.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={
                              item.priority === 'urgent'
                                ? 'destructive'
                                : item.priority === 'high'
                                  ? 'default'
                                  : 'secondary'
                            }
                          >
                            {item.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{item.content_type}</Badge>
                          <Badge variant="outline">
                            {item.flag_count} {item.flag_count === 1 ? 'flag' : 'flags'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Content ID: <span className="font-mono">{item.content_id.slice(0, 12)}...</span>
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => updateModerationItem(item.id, { status: 'in_review' })}
                          disabled={item.status === 'in_review'}
                        >
                          {item.status === 'in_review' ? 'In Review' : 'Review'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateModerationItem(item.id, {
                              status: 'dismissed',
                              resolution_action: 'no_action_needed',
                            })
                          }
                        >
                          Dismiss
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            updateModerationItem(item.id, {
                              status: 'resolved',
                              resolution_action: 'content_removed',
                            })
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                  <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-lg font-medium">No items in moderation queue</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    All flagged content has been reviewed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Audit Logs</CardTitle>
                  <CardDescription>Recent system and user activity</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchAuditLogs({ limit: 50 })}
                  disabled={auditLogsLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${auditLogsLoading ? 'animate-spin' : ''}`} />
                  Refresh Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {auditLogsLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading audit logs...</p>
                </div>
              ) : auditLogs.length > 0 ? (
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            {log.source}
                          </Badge>
                          <span className="text-sm font-medium">
                            {log.action || log.operation || 'Action'}
                          </span>
                          {log.table_name && (
                            <Badge variant="secondary" className="text-xs">
                              {log.table_name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{log.username || 'System'}</span>
                          <span>•</span>
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-lg font-medium">No audit logs found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    System activity will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </ErrorBoundary>
  );
}
