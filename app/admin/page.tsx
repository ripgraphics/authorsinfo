import { Suspense } from 'react'
import { Book, User, Building2, Star } from 'lucide-react'
import { StatCard } from '@/components/admin/stat-card'
import { BarChart as BarChartComponent } from '@/components/admin/bar-chart'
import { ProgressList } from '@/components/admin/progress-list'
import { RecentActivityList } from '@/components/admin/recent-activity-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getContentStats,
  getRecentContent,
  getContentGrowthTrends,
  getPopularContent,
  getUserEngagementMetrics,
  getSystemHealthMetrics,
} from '@/app/actions/admin-dashboard'

export const dynamic = 'force-dynamic'

async function ContentStatsSection() {
  const stats = await getContentStats()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <StatCard
        title="Books"
        value={stats.booksCount}
        description="Total books in database"
        icon={<Book className="h-5 w-5 text-muted-foreground" />}
        trend={{ value: 5.2, isPositive: true }}
      />
      <StatCard
        title="Authors"
        value={stats.authorsCount}
        description="Total authors in database"
        icon={<User className="h-5 w-5 text-muted-foreground" />}
        trend={{ value: 3.8, isPositive: true }}
      />
      <StatCard
        title="Publishers"
        value={stats.publishersCount}
        description="Total publishers in database"
        icon={<Building2 className="h-5 w-5 text-muted-foreground" />}
        trend={{ value: 2.4, isPositive: true }}
      />
      <StatCard
        title="Users"
        value={stats.usersCount}
        description="Registered users"
        icon={<User className="h-5 w-5 text-muted-foreground" />}
        trend={{ value: 7.1, isPositive: true }}
      />
      <StatCard
        title="Reviews"
        value={stats.reviewsCount}
        description="Total book reviews"
        icon={<Star className="h-5 w-5 text-muted-foreground" />}
        trend={{ value: 4.3, isPositive: true }}
      />
    </div>
  )
}

async function ContentGrowthSection() {
  const { bookGrowth, authorGrowth } = await getContentGrowthTrends()

  const bookData = bookGrowth.map((item) => ({
    label: item.month,
    value: item.count,
  }))

  const authorData = authorGrowth.map((item) => ({
    label: item.month,
    value: item.count,
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BarChartComponent
        title="Book Growth"
        description="New books added per month"
        data={bookData}
        color="bg-blue-500"
      />
      <BarChartComponent
        title="Author Growth"
        description="New authors added per month"
        data={authorData}
        color="bg-green-500"
      />
    </div>
  )
}

async function PopularContentSection() {
  const { topRatedBooks, mostReviewedBooks, prolificAuthors } = await getPopularContent()

  const topRatedData = topRatedBooks.map((book) => ({
    label: book.title.length > 20 ? book.title.substring(0, 20) + '...' : book.title,
    value: Number(book.average_rating) || 0,
    max: 5, // Max rating is 5
  }))

  const mostReviewedData = mostReviewedBooks.map((book) => ({
    label: book.title.length > 20 ? book.title.substring(0, 20) + '...' : book.title,
    value: Number(book.review_count) || 0,
  }))

  const prolificAuthorsData = prolificAuthors.map((author) => ({
    label: author.name,
    value: Number(author.bookCount) || 0,
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ProgressList
        title="Top Rated Books"
        description="Books with highest ratings"
        data={topRatedData}
        color="bg-yellow-500"
      />
      <ProgressList
        title="Most Reviewed Books"
        description="Books with most reviews"
        data={mostReviewedData}
        color="bg-purple-500"
      />
      <ProgressList
        title="Prolific Authors"
        description="Authors with most books"
        data={prolificAuthorsData}
        color="bg-pink-500"
      />
    </div>
  )
}

async function UserEngagementSection() {
  const { readingChallenges, readingStatusCounts, reviewStats } = await getUserEngagementMetrics()

  const readingStatusData = readingStatusCounts.map((item) => ({
    label:
      item.status === 'want_to_read'
        ? 'Want to Read'
        : item.status === 'currently_reading'
          ? 'Reading'
          : item.status === 'read'
            ? 'Read'
            : item.status,
    value: Number(item.count) || 0,
  }))

  const reviewRatingData = reviewStats.map((item) => ({
    label: `${item.rating} ★`,
    value: Number(item.count) || 0,
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Reading Challenges</CardTitle>
          <CardDescription>Progress on reading goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Total Challenges</div>
                <div className="text-sm">{readingChallenges.totalChallenges}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Books Goal</div>
                <div className="text-sm">{readingChallenges.totalGoals}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Books Read</div>
                <div className="text-sm">{readingChallenges.totalBooksRead}</div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{
                    width: `${Math.min(100, readingChallenges.completionRate)}%`,
                  }}
                ></div>
              </div>
              <div className="text-xs text-right text-muted-foreground">
                {readingChallenges.completionRate.toFixed(1)}% Complete
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <BarChartComponent
        title="Reading Status"
        description="Books by reading status"
        data={readingStatusData}
        color="bg-cyan-500"
      />
      <BarChartComponent
        title="Review Ratings"
        description="Reviews by rating"
        data={reviewRatingData}
        color="bg-amber-500"
      />
    </div>
  )
}

async function RecentActivitySection() {
  const { recentBooks, recentAuthors, recentPublishers } = await getRecentContent()

  const bookItems = recentBooks.map((book) => ({
    id: book.id,
    title: book.title,
    subtitle: 'New book added',
    timestamp: book.created_at,
    icon: <Book className="h-4 w-4" />,
  }))

  const authorItems = recentAuthors.map((author) => ({
    id: author.id,
    title: author.name,
    subtitle: 'New author added',
    timestamp: author.created_at,
    icon: <User className="h-4 w-4" />,
  }))

  const publisherItems = recentPublishers.map((publisher) => ({
    id: publisher.id,
    title: publisher.name,
    subtitle: 'New publisher added',
    timestamp: publisher.created_at,
    icon: <Building2 className="h-4 w-4" />,
  }))

  // Combine and sort by timestamp (newest first)
  const allItems = [...bookItems, ...authorItems, ...publisherItems]
    .sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
    .slice(0, 10)

  return (
    <RecentActivityList
      title="Recent Activity"
      description="Latest content additions"
      items={allItems}
      emptyMessage="No recent activity"
    />
  )
}

async function SystemHealthSection() {
  const result = await getSystemHealthMetrics()
  const storage = result.storage
  const typedErrorLogs: Array<{ id: string; error_message: string; created_at: string }> =
    (result.errorLogs || []) as Array<{ id: string; error_message: string; created_at: string }>

  const errorItems = typedErrorLogs.map((log) => ({
    id: log.id,
    title: log.error_message,
    subtitle: 'Error occurred',
    timestamp: log.created_at,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 text-red-500"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    ),
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Storage Usage</CardTitle>
          <CardDescription>Media storage statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Total Images</div>
                <div className="text-sm">{storage.imageCount}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Estimated Size</div>
                <div className="text-sm">{storage.estimatedSize} MB</div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{
                    width: `${Math.min(100, (storage.estimatedSize / 1000) * 100)}%`,
                  }}
                ></div>
              </div>
              <div className="text-xs text-right text-muted-foreground">
                {((storage.estimatedSize / 1000) * 100).toFixed(1)}% of 1GB
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <RecentActivityList
        title="Error Logs"
        description="Recent system errors"
        items={errorItems}
        emptyMessage="No errors recorded"
      />
    </div>
  )
}

function ContentStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-1" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="h-[200px] flex items-end justify-between gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="w-12 h-32 rounded-t-sm" />
              <Skeleton className="h-3 w-12 mt-2" />
              <Skeleton className="h-3 w-8 mt-1" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminPage() {
  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground">Welcome to the Author's Info admin dashboard</p>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center">
            <Button variant="ghost">Author&apos;s Info</Button>
            <span className="text-muted-foreground mx-2">/</span>
            <Button variant="ghost">Admin</Button>
            <span className="text-muted-foreground mx-2">/</span>
            <Button variant="ghost">Dashboard</Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="users">User Engagement</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Suspense fallback={<ContentStatsSkeleton />}>
            <ContentStatsSection />
          </Suspense>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Suspense fallback={<ChartSkeleton />}>
                <ContentGrowthSection />
              </Suspense>
            </div>
            <div>
              <Suspense
                fallback={
                  <Card className="h-full">
                    <CardContent className="p-4">
                      <Skeleton className="h-full w-full" />
                    </CardContent>
                  </Card>
                }
              >
                <RecentActivitySection />
              </Suspense>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <ChartSkeleton key={i} />
                ))}
              </div>
            }
          >
            <PopularContentSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Suspense fallback={<ContentStatsSkeleton />}>
            <ContentStatsSection />
          </Suspense>

          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <ChartSkeleton key={i} />
                ))}
              </div>
            }
          >
            <ContentGrowthSection />
          </Suspense>

          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <ChartSkeleton key={i} />
                ))}
              </div>
            }
          >
            <PopularContentSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <ChartSkeleton key={i} />
                ))}
              </div>
            }
          >
            <UserEngagementSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <ChartSkeleton key={i} />
                ))}
              </div>
            }
          >
            <SystemHealthSection />
          </Suspense>
        </TabsContent>
      </Tabs>

      <div className="text-center text-sm text-muted-foreground mt-8">
        Author&apos;s Info Admin Dashboard
      </div>
    </div>
  )
}
