'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getReadingStats } from '@/app/actions/reading-progress'
import {
  BookOpen,
  BookMarked,
  Clock,
  CheckCircle,
  PauseCircle,
  XCircle,
  Trophy,
} from 'lucide-react'

interface ReadingStatsProps {
  className?: string
  entityType?: 'user' | 'author' | 'publisher' | 'group' | 'event'
  entityId?: string
  showDetailedStats?: boolean
  onStatsChange?: (stats: any) => void
}

export function ReadingStats({
  className,
  entityType = 'user',
  entityId,
  showDetailedStats = false,
  onStatsChange,
}: ReadingStatsProps) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      if (!entityId || !entityType) return

      setLoading(true)
      setError(null)

      try {
        // Use the new entity-agnostic API
        const response = await fetch(`/api/entities/${entityType}/${entityId}/reading-progress`)

        if (response.ok) {
          const data = await response.json()
          setStats(data)

          // Notify parent component of stats
          if (onStatsChange) {
            onStatsChange(data)
          }
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to load reading statistics')
        }
      } catch (err) {
        console.error('Error fetching reading stats:', err)
        setError('Failed to load reading statistics')
      } finally {
        setLoading(false)
      }
    }

    if (entityId && entityType) {
      fetchStats()
    }
  }, [entityId, entityType, onStatsChange])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Reading Statistics</CardTitle>
          <CardDescription>Track your reading journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="animate-pulse bg-muted h-4 w-1/3 rounded-sm" />
                <div className="animate-pulse bg-muted h-2 w-full rounded-sm" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Reading Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            {error === 'User not authenticated'
              ? 'Please sign in to view your reading statistics'
              : 'Failed to load reading statistics. Please try again.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!stats || stats.total === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Reading Statistics</CardTitle>
          <CardDescription>Track your reading journey</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            You haven't tracked any books yet. Start tracking your reading progress!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Reading Statistics</CardTitle>
        <CardDescription>Track your reading journey</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Books completed this year */}
          <div className="flex items-center space-x-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.completed_this_year}</div>
              <div className="text-sm text-muted-foreground">Books completed this year</div>
            </div>
          </div>

          {/* Reading status breakdown */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Your Library</h4>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center">
                  <BookMarked className="h-4 w-4 mr-2 text-blue-500" />
                  Want to Read
                </div>
                <span>{stats.not_started}</span>
              </div>
              <Progress value={(stats.not_started / stats.total) * 100} className="h-2 bg-muted" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                  Currently Reading
                </div>
                <span>{stats.in_progress}</span>
              </div>
              <Progress value={(stats.in_progress / stats.total) * 100} className="h-2 bg-muted" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Completed
                </div>
                <span>{stats.completed}</span>
              </div>
              <Progress value={(stats.completed / stats.total) * 100} className="h-2 bg-muted" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center">
                  <PauseCircle className="h-4 w-4 mr-2 text-orange-500" />
                  On Hold
                </div>
                <span>{stats.on_hold}</span>
              </div>
              <Progress value={(stats.on_hold / stats.total) * 100} className="h-2 bg-muted" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center">
                  <XCircle className="h-4 w-4 mr-2 text-red-500" />
                  Abandoned
                </div>
                <span>{stats.abandoned}</span>
              </div>
              <Progress value={(stats.abandoned / stats.total) * 100} className="h-2 bg-muted" />
            </div>
          </div>

          {/* Total books */}
          <div className="flex justify-between items-center pt-2 border-t">
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 mr-2" />
              Total Books
            </div>
            <span className="font-medium">{stats.total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
