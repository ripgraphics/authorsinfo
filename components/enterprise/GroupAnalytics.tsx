'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateRangePicker } from '@/components/admin/date-range-picker'
import { LineChart } from '@/components/admin/line-chart'
import { BarChart } from '@/components/admin/bar-chart'
import { PieChart } from '@/components/admin/pie-chart'
import { supabaseClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'

interface GroupAnalyticsProps {
  groupId: string
}

interface Metric {
  date: string
  value: number
  metadata: any
}

export function GroupAnalytics({ groupId }: GroupAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('7d')
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  })
  const [metrics, setMetrics] = useState<Record<string, Metric[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [groupId, timeRange, dateRange])

  const fetchAnalytics = async () => {
    if (!dateRange?.from || !dateRange?.to) return

    try {
      setLoading(true)
      const { data, error } = await supabaseClient
        .from('group_analytics')
        .select('*')
        .eq('group_id', groupId)
        .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('date', { ascending: true })

      if (error) throw error

      // Group metrics by type
      const groupedMetrics: Record<string, Metric[]> = {}
      data.forEach((row: any) => {
        if (!groupedMetrics[row.metric]) {
          groupedMetrics[row.metric] = []
        }
        groupedMetrics[row.metric].push({
          date: row.date,
          value: row.value,
          metadata: row.metadata,
        })
      })

      setMetrics(groupedMetrics)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const prepareChartData = (metricName: string) => {
    const metricData = metrics[metricName] || []
    return {
      labels: metricData.map((m) => format(new Date(m.date), 'MMM d')),
      data: metricData.map((m) => m.value),
    }
  }

  const calculateTotalEngagement = () => {
    const engagementMetrics = metrics['engagement'] || []
    return engagementMetrics.reduce((sum, m) => sum + m.value, 0)
  }

  const calculateGrowthRate = () => {
    const membershipMetrics = metrics['membership'] || []
    if (membershipMetrics.length < 2) return 0
    const oldest = membershipMetrics[0].value
    const newest = membershipMetrics[membershipMetrics.length - 1].value
    return oldest === 0 ? 0 : ((newest - oldest) / oldest) * 100
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Group Analytics</h2>
        <div className="flex gap-4">
          <Select
            value={timeRange}
            onValueChange={(value) => {
              setTimeRange(value)
              const now = new Date()
              let fromDate: Date
              switch (value) {
                case '7d':
                  fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                  break
                case '30d':
                  fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                  break
                case '90d':
                  fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
                  break
                default:
                  fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
              }
              setDateRange({ from: fromDate, to: now })
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateTotalEngagement()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Growth Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateGrowthRate().toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics['active_members']?.[metrics['active_members'].length - 1]?.value || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Content Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics['content_items']?.[metrics['content_items'].length - 1]?.value || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Member Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              title=""
              labels={prepareChartData('membership').labels}
              data={prepareChartData('membership').data}
              loading={loading}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Daily Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              title=""
              data={prepareChartData('engagement').labels.map((label, i) => ({
                label,
                value: prepareChartData('engagement').data[i] || 0,
              }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Content Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart
              title=""
              labels={['Posts', 'Comments', 'Reactions', 'Shares']}
              data={[
                metrics['posts']?.[metrics['posts'].length - 1]?.value || 0,
                metrics['comments']?.[metrics['comments'].length - 1]?.value || 0,
                metrics['reactions']?.[metrics['reactions'].length - 1]?.value || 0,
                metrics['shares']?.[metrics['shares'].length - 1]?.value || 0,
              ]}
              colors={['#3b82f6', '#10b981', '#f59e0b', '#ef4444']}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Member Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              title=""
              labels={prepareChartData('active_members').labels}
              data={prepareChartData('active_members').data}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
