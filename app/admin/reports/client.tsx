"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { DateRange } from "react-day-picker"
import { format, parse, subMonths } from "date-fns"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DateRangePicker } from "@/components/admin/date-range-picker"
import { LineChart } from "@/components/admin/line-chart"
import { BarChartHorizontal } from "@/components/admin/bar-chart-horizontal"
import { PieChart } from "@/components/admin/pie-chart"
import { DataTable } from "@/components/admin/data-table"
import { toast } from "@/hooks/use-toast"
import {
  getUserActivityData,
  getContentPopularityData,
  getReadingTrendsData,
  getAuthorPerformanceData,
  exportReportToCSV,
  type ReportType,
} from "@/app/actions/admin-reports"

export function ReportsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get initial tab and date range from URL
  const initialTab = searchParams.get("tab") || "user_activity"
  const initialStartDate = searchParams.get("startDate") || format(subMonths(new Date(), 1), "yyyy-MM-dd")
  const initialEndDate = searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd")

  const [activeTab, setActiveTab] = useState<ReportType>(initialTab as ReportType)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: parse(initialStartDate, "yyyy-MM-dd", new Date()),
    to: parse(initialEndDate, "yyyy-MM-dd", new Date()),
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Data states
  const [userActivityData, setUserActivityData] = useState<any>(null)
  const [contentPopularityData, setContentPopularityData] = useState<any>(null)
  const [readingTrendsData, setReadingTrendsData] = useState<any>(null)
  const [authorPerformanceData, setAuthorPerformanceData] = useState<any>(null)

  // Update URL when tab or date range changes
  useEffect(() => {
    const params = new URLSearchParams()
    params.set("tab", activeTab)

    if (dateRange?.from) {
      params.set("startDate", format(dateRange.from, "yyyy-MM-dd"))
    }

    if (dateRange?.to) {
      params.set("endDate", format(dateRange.to, "yyyy-MM-dd"))
    }

    router.push(`/admin/reports?${params.toString()}`)
  }, [activeTab, dateRange, router])

  // Load data when tab or date range changes
  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return

    const loadData = async () => {
      setIsLoading(true)

      const dateRangeParam = {
        startDate: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
        endDate: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      }

      try {
        switch (activeTab) {
          case "user_activity":
            const userData = await getUserActivityData(dateRangeParam)
            setUserActivityData(userData)
            break

          case "content_popularity":
            const contentData = await getContentPopularityData(dateRangeParam)
            setContentPopularityData(contentData)
            break

          case "reading_trends":
            const trendsData = await getReadingTrendsData(dateRangeParam)
            setReadingTrendsData(trendsData)
            break

          case "author_performance":
            const authorData = await getAuthorPerformanceData(dateRangeParam)
            setAuthorPerformanceData(authorData)
            break
        }
      } catch (error) {
        console.error(`Error loading ${activeTab} data:`, error)
        toast({
          title: "Error loading data",
          description: "Failed to load report data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [activeTab, dateRange])

  const handleExport = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: "Date range required",
        description: "Please select a date range before exporting.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)

    try {
      const dateRangeParam = {
        startDate: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
        endDate: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      }

      const result = await exportReportToCSV(activeTab, dateRangeParam)

      if (result.success && result.csv) {
        // Create a blob and download it
        const blob = new Blob([result.csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${activeTab}-report-${format(new Date(), "yyyy-MM-dd")}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast({
          title: "Export successful",
          description: "Report has been exported to CSV",
        })
      } else {
        toast({
          title: "Export failed",
          description: result.error || "Failed to export report",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error exporting report:", error)
      toast({
        title: "Export error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
  }

  const setQuickDateRange = (months: number) => {
    const to = new Date()
    const from = subMonths(to, months)
    setDateRange({ from, to })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground">View and export detailed reports about your platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setQuickDateRange(1)}>
            Last Month
          </Button>
          <Button variant="outline" onClick={() => setQuickDateRange(3)}>
            Last 3 Months
          </Button>
          <Button variant="outline" onClick={() => setQuickDateRange(12)}>
            Last Year
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <DateRangePicker dateRange={dateRange} onDateRangeChange={handleDateRangeChange} className="w-full" />
        </div>
        <div>
          <Button className="w-full" onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export Report"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as ReportType)}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="user_activity">User Activity</TabsTrigger>
          <TabsTrigger value="content_popularity">Content Popularity</TabsTrigger>
          <TabsTrigger value="reading_trends">Reading Trends</TabsTrigger>
          <TabsTrigger value="author_performance">Author Performance</TabsTrigger>
        </TabsList>

        {/* User Activity Tab */}
        <TabsContent value="user_activity" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium">New Users</h3>
              <p className="text-3xl font-bold mt-2">{userActivityData?.totalNewUsers || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium">Total Logins</h3>
              <p className="text-3xl font-bold mt-2">{userActivityData?.totalLogins || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium">Reading Activities</h3>
              <p className="text-3xl font-bold mt-2">{userActivityData?.totalReadingActivities || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LineChart
              title="User Registrations"
              description="New user sign-ups over time"
              labels={userActivityData?.userRegistrations.labels || []}
              data={userActivityData?.userRegistrations.data || []}
              color="#3b82f6"
              loading={isLoading}
            />
            <LineChart
              title="User Logins"
              description="User login activity over time"
              labels={userActivityData?.userLogins.labels || []}
              data={userActivityData?.userLogins.data || []}
              color="#10b981"
              loading={isLoading}
            />
          </div>

          <LineChart
            title="Reading Activity"
            description="User reading activity over time"
            labels={userActivityData?.readingActivity.labels || []}
            data={userActivityData?.readingActivity.data || []}
            color="#f59e0b"
            loading={isLoading}
          />
        </TabsContent>

        {/* Content Popularity Tab */}
        <TabsContent value="content_popularity" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DataTable
              title="Most Viewed Books"
              description="Books with the highest number of views"
              columns={[
                { key: "title", label: "Title" },
                { key: "views", label: "Views" },
              ]}
              data={contentPopularityData?.mostViewedBooks || []}
              loading={isLoading}
              imageField="cover_image"
              linkField="title"
              linkPrefix="/books"
            />
            <DataTable
              title="Most Rated Books"
              description="Books with the most ratings"
              columns={[
                { key: "title", label: "Title" },
                { key: "averageRating", label: "Avg. Rating" },
                { key: "ratingCount", label: "# Ratings" },
              ]}
              data={contentPopularityData?.mostRatedBooks || []}
              loading={isLoading}
              imageField="cover_image"
              linkField="title"
              linkPrefix="/books"
            />
          </div>

          <BarChartHorizontal
            title="Genre Popularity"
            description="Number of books per genre"
            labels={(contentPopularityData?.genrePopularity || []).map((item: any) => item.name)}
            data={(contentPopularityData?.genrePopularity || []).map((item: any) => item.bookCount)}
            color="#8b5cf6"
            loading={isLoading}
            height={400}
          />
        </TabsContent>

        {/* Reading Trends Tab */}
        <TabsContent value="reading_trends" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PieChart
              title="Reading Status Distribution"
              description="Distribution of reading statuses"
              labels={(readingTrendsData?.statusDistribution || []).map((item: any) => item.status)}
              data={(readingTrendsData?.statusDistribution || []).map((item: any) => item.count)}
              loading={isLoading}
            />
            <PieChart
              title="Completion Rates"
              description="Book completion statistics"
              labels={["Completed", "Abandoned", "In Progress"]}
              data={[
                readingTrendsData?.completionRates.completed || 0,
                readingTrendsData?.completionRates.abandoned || 0,
                readingTrendsData?.completionRates.inProgress || 0,
              ]}
              colors={["#10b981", "#ef4444", "#f59e0b"]}
              loading={isLoading}
            />
          </div>

          <LineChart
            title="Reading Time by Day"
            description="Total reading time per day"
            labels={readingTrendsData?.readingTimeByDay.labels || []}
            data={readingTrendsData?.readingTimeByDay.data || []}
            color="#ec4899"
            loading={isLoading}
          />
        </TabsContent>

        {/* Author Performance Tab */}
        <TabsContent value="author_performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DataTable
              title="Top Authors by Book Count"
              description="Authors with the most books"
              columns={[
                { key: "name", label: "Author" },
                { key: "bookCount", label: "Books" },
              ]}
              data={authorPerformanceData?.topAuthors || []}
              loading={isLoading}
              linkField="name"
              linkPrefix="/authors"
            />
            <DataTable
              title="Top Rated Authors"
              description="Authors with the highest average ratings"
              columns={[
                { key: "name", label: "Author" },
                { key: "averageRating", label: "Avg. Rating" },
                { key: "ratingCount", label: "# Ratings" },
              ]}
              data={authorPerformanceData?.authorRatings || []}
              loading={isLoading}
              linkField="name"
              linkPrefix="/authors"
            />
          </div>

          <BarChartHorizontal
            title="Author Book Count"
            description="Number of books per author"
            labels={(authorPerformanceData?.topAuthors || []).map((author: any) => author.name)}
            data={(authorPerformanceData?.topAuthors || []).map((author: any) => author.bookCount)}
            color="#6366f1"
            loading={isLoading}
            height={400}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
