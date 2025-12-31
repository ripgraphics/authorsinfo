'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Post } from '@/types/post'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Shield,
  AlertTriangle,
  Flag,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Filter,
  Search,
  Settings,
  Ban,
  AlertCircle,
  TrendingUp,
  BarChart3,
} from 'lucide-react'

interface ContentModerationSystemProps {
  className?: string
}

interface ModerationReport {
  id: string
  post_id: string
  reporter_id: string
  reporter_name: string
  reason: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
  action_taken?: string
}

interface ModerationRule {
  id: string
  name: string
  description: string
  pattern: string
  action: 'flag' | 'auto-hide' | 'auto-delete' | 'require-review'
  severity: 'low' | 'medium' | 'high' | 'critical'
  is_active: boolean
  created_at: string
}

interface ContentAnalysis {
  post_id: string
  content: string
  moderation_score: number
  flagged_keywords: string[]
  toxicity_score: number
  spam_probability: number
  inappropriate_content: boolean
  requires_review: boolean
  auto_action: string
}

export default function ContentModerationSystem({ className }: ContentModerationSystemProps) {
  const { user } = useAuth()
  const [reports, setReports] = useState<ModerationReport[]>([])
  const [rules, setRules] = useState<ModerationRule[]>([])
  const [analyzedContent, setAnalyzedContent] = useState<ContentAnalysis[]>([])
  const [currentTab, setCurrentTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
    dateRange: 'all',
  })

  // Mock data for demonstration - in production this would come from API
  useEffect(() => {
    // Simulate loading moderation data
    const mockReports: ModerationReport[] = [
      {
        id: '1',
        post_id: 'post-1',
        reporter_id: 'user-1',
        reporter_name: 'John Doe',
        reason: 'Inappropriate content',
        description: 'This post contains offensive language',
        severity: 'medium',
        status: 'pending',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        post_id: 'post-2',
        reporter_id: 'user-2',
        reporter_name: 'Jane Smith',
        reason: 'Spam',
        description: 'Repeated promotional content',
        severity: 'high',
        status: 'reviewing',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ]

    const mockRules: ModerationRule[] = [
      {
        id: '1',
        name: 'Profanity Filter',
        description: 'Detect and flag posts with profane language',
        pattern: '\\b(bad|word|list)\\b',
        action: 'flag',
        severity: 'medium',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Spam Detection',
        description: 'Identify potential spam content',
        pattern: '\\b(buy|now|limited|offer)\\b',
        action: 'auto-hide',
        severity: 'high',
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ]

    const mockAnalysis: ContentAnalysis[] = [
      {
        post_id: 'post-1',
        content: 'Sample post content for analysis',
        moderation_score: 0.3,
        flagged_keywords: ['sample'],
        toxicity_score: 0.1,
        spam_probability: 0.05,
        inappropriate_content: false,
        requires_review: false,
        auto_action: 'none',
      },
    ]

    setReports(mockReports)
    setRules(mockRules)
    setAnalyzedContent(mockAnalysis)
  }, [])

  // Handle report selection
  const handleReportSelection = (reportId: string, selected: boolean) => {
    const newSelection = new Set(selectedReports)
    if (selected) {
      newSelection.add(reportId)
    } else {
      newSelection.delete(reportId)
    }
    setSelectedReports(newSelection)
  }

  // Handle bulk report actions
  const handleBulkAction = async (action: 'approve' | 'reject' | 'escalate') => {
    if (selectedReports.size === 0) return

    const confirmed = confirm(
      `Are you sure you want to ${action} ${selectedReports.size} selected reports?`
    )
    if (!confirmed) return

    try {
      // In production, this would call the API
      console.log(`Bulk ${action} for reports:`, Array.from(selectedReports))

      // Update local state
      setReports((prev) =>
        prev.map((report) => {
          if (selectedReports.has(report.id)) {
            return {
              ...report,
              status: action === 'approve' ? 'resolved' : 'dismissed',
              reviewed_at: new Date().toISOString(),
              reviewed_by: user?.id || 'unknown',
              action_taken: action,
            }
          }
          return report
        })
      )

      setSelectedReports(new Set())
    } catch (error) {
      console.error(`Bulk ${action} failed:`, error)
      setError(`Failed to ${action} reports`)
    }
  }

  // Handle individual report action
  const handleReportAction = async (reportId: string, action: string) => {
    try {
      setReports((prev) =>
        prev.map((report) => {
          if (report.id === reportId) {
            return {
              ...report,
              status: action === 'approve' ? 'resolved' : 'dismissed',
              reviewed_at: new Date().toISOString(),
              reviewed_by: user?.id || 'unknown',
              action_taken: action,
            }
          }
          return report
        })
      )
    } catch (error) {
      console.error(`Report action failed:`, error)
      setError(`Failed to ${action} report`)
    }
  }

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800'
      case 'reviewing':
        return 'bg-yellow-100 text-yellow-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'dismissed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Please log in to access the content moderation system.
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
          <h1 className="text-3xl font-bold">Content Moderation System</h1>
          <p className="text-muted-foreground">
            Automated content detection, user reporting, and moderation workflows
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Shield className="h-4 w-4 mr-2" />
            New Rule
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Flag className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Pending Reports</p>
                <p className="text-2xl font-bold">
                  {reports.filter((r) => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">High Priority</p>
                <p className="text-2xl font-bold">
                  {reports.filter((r) => r.severity === 'high' || r.severity === 'critical').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Auto-Flagged</p>
                <p className="text-2xl font-bold">
                  {analyzedContent.filter((c) => c.requires_review).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Resolved Today</p>
                <p className="text-2xl font-bold">
                  {
                    reports.filter(
                      (r) =>
                        r.status === 'resolved' &&
                        new Date(r.reviewed_at || '').toDateString() === new Date().toDateString()
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Flag className="h-4 w-4" />
                  <span>Recent Reports</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports.slice(0, 5).map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={getSeverityColor(report.severity)}>
                            {report.severity}
                          </Badge>
                          <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                        </div>
                        <p className="text-sm font-medium">{report.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          by {report.reporter_name} •{' '}
                          {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReportAction(report.id, 'approve')}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Moderation Rules Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Active Rules</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rules
                    .filter((r) => r.is_active)
                    .map((rule) => (
                      <div key={rule.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{rule.name}</h4>
                          <Badge className={getSeverityColor(rule.severity)}>{rule.severity}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span>Action: {rule.action}</span>
                          <span>Pattern: {rule.pattern}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>Report Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters((prev) => ({ ...prev, severity: e.target.value }))}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Severity</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters((prev) => ({ ...prev, dateRange: e.target.value }))}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                <Input placeholder="Search reports..." className="w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedReports.size > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedReports.size} report(s) selected
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleBulkAction('approve')}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleBulkAction('reject')}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('escalate')}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Escalate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reports List */}
          <Card>
            <CardHeader>
              <CardTitle>Content Reports ({reports.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedReports.has(report.id)}
                      onChange={(e) => handleReportSelection(report.id, e.target.checked)}
                      className="h-4 w-4"
                    />

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getSeverityColor(report.severity)}>
                          {report.severity}
                        </Badge>
                        <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                      </div>

                      <h4 className="font-medium">{report.reason}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{report.description}</p>

                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                        <span>Reporter: {report.reporter_name}</span>
                        <span>Created: {new Date(report.created_at).toLocaleDateString()}</span>
                        {report.reviewed_at && (
                          <span>Reviewed: {new Date(report.reviewed_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {report.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReportAction(report.id, 'approve')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReportAction(report.id, 'reject')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/posts/${report.post_id}`, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Moderation Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{rule.name}</h4>
                        <Badge className={getSeverityColor(rule.severity)}>{rule.severity}</Badge>
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Pattern:</span> {rule.pattern}
                      </div>
                      <div>
                        <span className="font-medium">Action:</span> {rule.action}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span>{' '}
                        {new Date(rule.created_at).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>{' '}
                        {rule.is_active ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Moderation Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Detailed moderation analytics and insights coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
