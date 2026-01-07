'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContentSection } from '@/components/ui/content-section'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, TrendingUp, Clock, Award } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface ShelfStats {
  totalBooks: number
  totalShelves: number
  averageBooksPerShelf: number
  completionRate: number
  readingVelocity: {
    booksThisMonth: number
    booksLastMonth: number
    trend: 'up' | 'down' | 'stable'
  }
  genreDistribution: Array<{
    genre: string
    count: number
    percentage: number
  }>
  shelfBreakdown: Array<{
    name: string
    bookCount: number
    percentage: number
  }>
}

interface ShelfAnalyticsProps {
  userId?: string
  shelves?: Array<{
    id: string
    name: string
    bookCount?: number
    isDefault?: boolean
  }>
  className?: string
}

export function ShelfAnalytics({
  userId,
  shelves = [],
  className,
}: ShelfAnalyticsProps) {
  const { user } = useAuth()
  const [stats, setStats] = useState<ShelfStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const targetUserId = userId || user?.id

  useEffect(() => {
    if (!targetUserId) {
      setIsLoading(false)
      return
    }

    fetchStats()
  }, [targetUserId])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/shelves/stats?userId=${targetUserId}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching shelf stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <ContentSection title="Shelf Analytics" className={className}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </ContentSection>
    )
  }

  if (!stats) {
    return null
  }

  // Calculate stats from shelves if API doesn't provide them
  const totalBooks = stats.totalBooks || shelves.reduce((sum, shelf) => sum + (shelf.bookCount || 0), 0)
  const totalShelves = stats.totalShelves || shelves.length
  const averageBooksPerShelf = totalShelves > 0 ? Math.round(totalBooks / totalShelves) : 0

  // Calculate completion rate from default shelves
  const wantToReadShelf = shelves.find((s) => s.name === 'Want to Read')
  const currentlyReadingShelf = shelves.find((s) => s.name === 'Currently Reading')
  const readShelf = shelves.find((s) => s.name === 'Read')

  const wantToReadCount = wantToReadShelf?.bookCount || 0
  const currentlyReadingCount = currentlyReadingShelf?.bookCount || 0
  const readCount = readShelf?.bookCount || 0
  const totalInProgress = wantToReadCount + currentlyReadingCount + readCount
  const completionRate = totalInProgress > 0 ? Math.round((readCount / totalInProgress) * 100) : 0

  return (
    <ContentSection title="Shelf Analytics" className={className}>
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Books</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBooks}</div>
              <p className="text-xs text-muted-foreground">
                Across {totalShelves} shelves
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg per Shelf</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageBooksPerShelf}</div>
              <p className="text-xs text-muted-foreground">Books per shelf</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {readCount} of {totalInProgress} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reading Status</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Reading:</span>
                  <span className="font-medium">{currentlyReadingCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Want to Read:</span>
                  <span className="font-medium">{wantToReadCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shelf Breakdown */}
        {shelves.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shelf Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {shelves
                  .filter((shelf) => (shelf.bookCount || 0) > 0)
                  .sort((a, b) => (b.bookCount || 0) - (a.bookCount || 0))
                  .slice(0, 10)
                  .map((shelf) => {
                    const percentage = totalBooks > 0
                      ? Math.round(((shelf.bookCount || 0) / totalBooks) * 100)
                      : 0
                    return (
                      <div key={shelf.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{shelf.name}</span>
                          <span className="text-muted-foreground">
                            {shelf.bookCount || 0} ({percentage}%)
                          </span>
                        </div>
                        <div className="relative w-full h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reading Progress Funnel */}
        {(wantToReadCount > 0 || currentlyReadingCount > 0 || readCount > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reading Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Want to Read</span>
                    <span className="font-medium">{wantToReadCount}</span>
                  </div>
                  <div className="relative w-full h-3 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-blue-500 transition-all"
                      style={{
                        width: `${totalInProgress > 0 ? (wantToReadCount / totalInProgress) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Currently Reading</span>
                    <span className="font-medium">{currentlyReadingCount}</span>
                  </div>
                  <div className="relative w-full h-3 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-yellow-500 transition-all"
                      style={{
                        width: `${totalInProgress > 0 ? (currentlyReadingCount / totalInProgress) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Read</span>
                    <span className="font-medium">{readCount}</span>
                  </div>
                  <div className="relative w-full h-3 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-green-500 transition-all"
                      style={{
                        width: `${totalInProgress > 0 ? (readCount / totalInProgress) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ContentSection>
  )
}

