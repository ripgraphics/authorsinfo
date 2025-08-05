"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, TrendingUp, TrendingDown, Activity, Users, BookOpen, Calendar } from "lucide-react"

interface ActivityStats {
  total_activities: number
  activities_today: number
  activities_this_week: number
  activities_this_month: number
  by_type: Record<string, number>
  by_entity: Record<string, number>
}

export function ActivityStats() {
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        setError(err.message || "Failed to load statistics")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Statistics
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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-600">
            <p>Failed to load statistics</p>
            <p className="text-sm text-muted-foreground">{error}</p>
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
            <Activity className="h-5 w-5" />
            Activity Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            No statistics available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total_activities.toLocaleString()}</div>
            <div className="text-xs text-blue-600">Total Activities</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.activities_today.toLocaleString()}</div>
            <div className="text-xs text-green-600">Today</div>
          </div>
        </div>

        {/* Time Periods */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              This Week
            </span>
            <span className="font-medium">{stats.activities_this_week.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              This Month
            </span>
            <span className="font-medium">{stats.activities_this_month.toLocaleString()}</span>
          </div>
        </div>

        {/* Activity Type Breakdown */}
        {Object.keys(stats.by_type).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">By Activity Type</h4>
            <div className="space-y-1">
              {Object.entries(stats.by_type)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-xs">
                    <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Entity Type Breakdown */}
        {Object.keys(stats.by_entity).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">By Entity Type</h4>
            <div className="space-y-1">
              {Object.entries(stats.by_entity)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([entity, count]) => (
                  <div key={entity} className="flex items-center justify-between text-xs">
                    <span className="capitalize">{entity}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-2 border-t">
          <button
            onClick={() => window.location.reload()}
            className="w-full text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            Refresh Statistics
          </button>
        </div>
      </CardContent>
    </Card>
  )
} 