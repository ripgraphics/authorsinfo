/**
 * @deprecated This component is deprecated and unused.
 * 
 * This component is a wrapper around EnterpriseTimelineActivities with additional filtering.
 * However, it's not imported anywhere in the codebase.
 * 
 * Use EnterpriseTimelineActivities directly instead, which provides all the same features
 * and more, with better performance.
 */

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Filter,
  Search,
  Calendar,
  BookOpen,
  Star,
  Users,
  TrendingUp,
  RefreshCw,
  Loader2,
  Eye,
  EyeOff,
  Settings,
  Shield,
} from 'lucide-react'
import EnterpriseTimelineActivities from '@/components/enterprise/enterprise-timeline-activities-optimized'

interface EnhancedUserTimelineProps {
  userId: string
  isOwnProfile: boolean
  privacySettings?: any
}

/**
 * @deprecated Use EnterpriseTimelineActivities directly instead
 */
export function EnhancedUserTimeline({
  userId,
  isOwnProfile,
  privacySettings,
}: EnhancedUserTimelineProps) {
  const { user: authUser } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [dateRange, setDateRange] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [timelineData, setTimelineData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Activities' },
    { value: 'reading', label: 'Reading Progress' },
    { value: 'reviews', label: 'Book Reviews' },
    { value: 'social', label: 'Social Interactions' },
    { value: 'achievements', label: 'Achievements' },
  ]

  const dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ]

  // Filter timeline data based on search and filters
  const filteredTimeline = useMemo(() => {
    let filtered = timelineData

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((item) => item.activity_type === filterType)
    }

    // Apply date filter
    if (dateRange !== 'all') {
      const now = new Date()
      const itemDate = new Date()

      switch (dateRange) {
        case 'today':
          filtered = filtered.filter((item) => {
            itemDate.setTime(new Date(item.created_at).getTime())
            return itemDate.toDateString() === now.toDateString()
          })
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter((item) => new Date(item.created_at) >= weekAgo)
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter((item) => new Date(item.created_at) >= monthAgo)
          break
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter((item) => new Date(item.created_at) >= yearAgo)
          break
      }
    }

    return filtered
  }, [timelineData, searchQuery, filterType, dateRange])

  // Privacy-aware timeline configuration
  const getTimelineConfig = () => {
    if (!privacySettings)
      return {
        entityId: userId,
        entityType: 'user' as const,
      }

    return {
      entityId: userId,
      entityType: 'user' as const,
      showAnalytics: privacySettings.show_reading_stats_publicly || isOwnProfile,
      enableModeration: isOwnProfile,
      enableAI: isOwnProfile,
      enableAudit: isOwnProfile,
      privacyLevel: privacySettings.default_privacy_level || 'private',
    }
  }

  // Handle timeline refresh
  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      // This would integrate with your existing EnterpriseTimelineActivities refresh logic
      // For now, we'll just simulate a refresh
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: 'Timeline refreshed',
        description: 'Latest activities have been loaded',
      })
    } catch (error) {
      toast({
        title: 'Refresh failed',
        description: 'Unable to refresh timeline',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle privacy settings update
  const handlePrivacyUpdate = async (setting: string, value: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/privacy-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [setting]: value }),
      })

      if (response.ok) {
        toast({
          title: 'Privacy updated',
          description: 'Your privacy settings have been updated',
        })
      } else {
        throw new Error('Failed to update privacy')
      }
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Unable to update privacy settings',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="enhanced-user-timeline space-y-6">
      {/* Timeline Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Timeline</h2>
          <p className="text-muted-foreground">
            {isOwnProfile
              ? 'Your reading journey and activities'
              : 'User activities and reading progress'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>

          {isOwnProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handlePrivacyUpdate(
                  'show_reading_stats_publicly',
                  !privacySettings?.show_reading_stats_publicly
                )
              }
            >
              {privacySettings?.show_reading_stats_publicly ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
              {privacySettings?.show_reading_stats_publicly ? 'Public' : 'Private'}
            </Button>
          )}
        </div>
      </div>

      {/* Privacy Notice */}
      {!isOwnProfile && privacySettings?.default_privacy_level === 'private' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <Shield className="h-4 w-4" />
              <span className="text-sm">
                This user's timeline is set to private. You can only see public activities.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="reading">Reading</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Search and Filter Controls */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search timeline activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              {dateOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Timeline Content */}
        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {/* Activity Count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredTimeline.length} of {timelineData.length} activities
              </p>

              {filteredTimeline.length !== timelineData.length && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setFilterType('all')
                    setDateRange('all')
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>

            {/* Enhanced Timeline Activities */}
            <EnterpriseTimelineActivities {...getTimelineConfig()} />

            {/* No Results */}
            {filteredTimeline.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="space-y-2">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="text-lg font-medium">No activities found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || filterType !== 'all' || dateRange !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'No activities have been recorded yet'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
