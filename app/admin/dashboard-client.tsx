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
} from 'lucide-react';

interface AdminDashboardClientProps {
  userId: string;
}

export function AdminDashboardClient({ userId }: AdminDashboardClientProps) {
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

  useEffect(() => {
    // Fetch all data on mount
    fetchPlatformStats();
    fetchUserGrowth('daily', 30);
    fetchEngagement(30);
    fetchModerationQueue({ status: 'pending', limit: 10 });
    fetchAuditLogs({ limit: 20 });
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform management and analytics</p>
        </div>
        <Button onClick={() => fetchPlatformStats()}>
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      {platformStats && (
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
          />
          <StatCard
            title="Pending Moderation"
            value={platformStats.moderation.pendingItems}
            icon={AlertCircle}
          />
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
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
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Authors</span>
                      <span className="font-semibold">
                        {platformStats.overview.totalAuthors.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Groups</span>
                      <span className="font-semibold">
                        {platformStats.overview.totalGroups.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Events</span>
                      <span className="font-semibold">
                        {platformStats.overview.totalEvents.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reviews</span>
                      <span className="font-semibold">
                        {platformStats.overview.totalReviews.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">New Users (30d)</span>
                      <span className="font-semibold">
                        {platformStats.activity.newUsersThisMonth.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Active Users</span>
                      <span className="font-semibold">
                        {platformStats.activity.monthlyActiveUsers.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reading Sessions</span>
                      <span className="font-semibold">
                        {platformStats.activity.activeReadingSessions.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Growth Rate</span>
                      <span className="font-semibold text-green-600">
                        +{platformStats.activity.userGrowthRate}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Response Time</span>
                      <span className="font-semibold">{platformStats.performance.avgResponseTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Metrics Collected</span>
                      <span className="font-semibold">
                        {platformStats.performance.totalMetrics.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pending Moderation</span>
                      <span className="font-semibold">
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
          {userGrowth && (
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New user registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{userGrowth.totalUsers.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold">{userGrowth.activeUsers.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active %</p>
                    <p className="text-2xl font-bold">{userGrowth.activeUsersPercentage}%</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Chart visualization would go here (integrate with Recharts or similar)
                </div>
              </CardContent>
            </Card>
          )}

          {engagement && (
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>Platform engagement over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Engagements</p>
                    <p className="text-2xl font-bold">{engagement.totalEngagement.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unique Users</p>
                    <p className="text-2xl font-bold">
                      {engagement.uniqueEngagedUsers.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Daily</p>
                    <p className="text-2xl font-bold">
                      {engagement.avgDailyEngagement.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <h4 className="font-semibold mb-2">Top Actions</h4>
                    <div className="space-y-2">
                      {engagement.actionBreakdown.slice(0, 5).map((item) => (
                        <div key={item.action} className="flex justify-between text-sm">
                          <span>{item.action}</span>
                          <Badge variant="secondary">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Top Entities</h4>
                    <div className="space-y-2">
                      {engagement.entityBreakdown.slice(0, 5).map((item) => (
                        <div key={item.entity} className="flex justify-between text-sm">
                          <span>{item.entity}</span>
                          <Badge variant="secondary">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                <Button size="sm" onClick={() => fetchModerationQueue({ status: 'pending' })}>
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {moderationStats && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold">{moderationStats.byStatus.pending}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">In Review</p>
                    <p className="text-2xl font-bold">{moderationStats.byStatus.in_review}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Urgent</p>
                    <p className="text-2xl font-bold text-red-600">
                      {moderationStats.byPriority.urgent}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">High Priority</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {moderationStats.byPriority.high}
                    </p>
                  </div>
                </div>
              )}

              {moderationLoading ? (
                <p>Loading moderation queue...</p>
              ) : moderationQueue.length > 0 ? (
                <div className="space-y-3">
                  {moderationQueue.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              item.priority === 'urgent'
                                ? 'destructive'
                                : item.priority === 'high'
                                  ? 'default'
                                  : 'secondary'
                            }
                          >
                            {item.priority}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{item.content_type}</span>
                        </div>
                        <p className="text-sm">
                          Flagged {item.flag_count} times • ID: {item.content_id.slice(0, 8)}...
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            updateModerationItem(item.id, { status: 'in_review' })
                          }
                        >
                          Review
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
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No items in moderation queue
                </p>
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
                <Button size="sm" onClick={() => fetchAuditLogs({ limit: 50 })}>
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {auditLogsLoading ? (
                <p>Loading audit logs...</p>
              ) : auditLogs.length > 0 ? (
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{log.source}</Badge>
                          <span className="text-sm font-medium">{log.action || log.operation}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {log.username || 'System'} • {new Date(log.timestamp).toLocaleString()}
                          {log.table_name && ` • Table: ${log.table_name}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No audit logs found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
