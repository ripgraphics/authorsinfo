"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, BarChart3, TrendingUp, Clock, Zap } from "lucide-react"

interface ActivityStats {
  total_activities: number
  activities_today: number
  activities_this_week: number
  activities_this_month: number
  by_type: Record<string, number>
  by_entity: Record<string, number>
}

export function ActivityAnalytics() {
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        const response = await fetch("/api/admin/enterprise-activities")
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch activity statistics")
        }

        setStats(data.stats)
      } catch (err: any) {
        console.error("Failed to load analytics:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Activity Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Activity Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            No analytics data available
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate trends and metrics
  const weeklyGrowth = stats.activities_this_week > 0 ? 
    ((stats.activities_today * 7) / stats.activities_this_week * 100 - 100).toFixed(1) : 0
  
  const monthlyGrowth = stats.activities_this_month > 0 ? 
    ((stats.activities_this_week * 4) / stats.activities_this_month * 100 - 100).toFixed(1) : 0

  const topActivityType = Object.entries(stats.by_type)
    .sort(([,a], [,b]) => b - a)[0]
  
  const topEntityType = Object.entries(stats.by_entity)
    .sort(([,a], [,b]) => b - a)[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Activity Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Weekly Growth</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {weeklyGrowth}%
            </div>
            <div className="text-xs text-blue-600">
              vs last week
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Activity Rate</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats.activities_today}
            </div>
            <div className="text-xs text-green-600">
              today
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Total Volume</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.total_activities.toLocaleString()}
            </div>
            <div className="text-xs text-purple-600">
              all time
            </div>
          </div>
        </div>

        {/* Activity Type Analysis */}
        {Object.keys(stats.by_type).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Activity Type Distribution</h4>
            <div className="space-y-2">
              {Object.entries(stats.by_type)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 6)
                .map(([type, count]) => {
                  const percentage = ((count / stats.total_activities) * 100).toFixed(1)
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                        <span className="font-medium">{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Entity Type Analysis */}
        {Object.keys(stats.by_entity).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Entity Type Distribution</h4>
            <div className="space-y-2">
              {Object.entries(stats.by_entity)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 6)
                .map(([entity, count]) => {
                  const percentage = ((count / stats.total_activities) * 100).toFixed(1)
                  return (
                    <div key={entity} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">{entity}</span>
                        <span className="font-medium">{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Key Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topActivityType && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-blue-600 mb-1">Most Common Activity</div>
                <div className="font-medium text-blue-800 capitalize">
                  {topActivityType[0].replace(/_/g, ' ')}
                </div>
                <div className="text-xs text-blue-600">
                  {topActivityType[1]} occurrences
                </div>
              </div>
            )}
            
            {topEntityType && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-xs text-green-600 mb-1">Most Active Entity</div>
                <div className="font-medium text-green-800 capitalize">
                  {topEntityType[0]}
                </div>
                <div className="text-xs text-green-600">
                  {topEntityType[1]} activities
                </div>
              </div>
            )}

            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="text-xs text-yellow-600 mb-1">Activity Velocity</div>
              <div className="font-medium text-yellow-800">
                {stats.activities_today > stats.activities_this_week / 7 ? 'Increasing' : 'Decreasing'}
              </div>
              <div className="text-xs text-yellow-600">
                vs 7-day average
              </div>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-xs text-purple-600 mb-1">Engagement Level</div>
              <div className="font-medium text-purple-800">
                {stats.activities_today > 10 ? 'High' : stats.activities_today > 5 ? 'Medium' : 'Low'}
              </div>
              <div className="text-xs text-purple-600">
                based on today's activity
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-100">
          <h4 className="text-sm font-medium text-indigo-800 mb-2">Recommendations</h4>
          <div className="space-y-2 text-xs text-indigo-700">
            {stats.activities_today === 0 && (
              <p>• Consider generating activities for existing entities to populate timelines</p>
            )}
            {stats.activities_today > 0 && stats.activities_today < 5 && (
              <p>• Activity levels are low - consider bulk generation for better user engagement</p>
            )}
            {topActivityType && topActivityType[1] > stats.total_activities * 0.5 && (
              <p>• Activity type "{topActivityType[0]}" dominates - consider diversifying activity types</p>
            )}
            {Object.keys(stats.by_entity).length < 3 && (
              <p>• Limited entity type diversity - expand activity generation to more entity types</p>
            )}
            <p>• Use enterprise features for optimal performance and data integrity</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 