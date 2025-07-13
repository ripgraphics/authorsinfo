"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { LineChart, BarChart, PieChart } from '@/components/ui/charts'
import { supabaseClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface GroupAnalyticsProps {
  groupId: string
}

interface Metric {
  date: string
  value: number
  metadata: any
}

interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
  }[]
}

export function GroupAnalytics({ groupId }: GroupAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('7d')
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [metrics, setMetrics] = useState<Record<string, Metric[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [groupId, timeRange, startDate, endDate])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabaseClient
        .from('group_analytics')
        .select('*')
        .eq('group_id', groupId)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: true })

      if (error) throw error

      // Group metrics by type
      const groupedMetrics: Record<string, Metric[]> = {}
      data.forEach((row) => {
        if (!groupedMetrics[row.metric]) {
          groupedMetrics[row.metric] = []
        }
        groupedMetrics[row.metric].push({
          date: row.date,
          value: row.value,
          metadata: row.metadata
        })
      })

      setMetrics(groupedMetrics)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const prepareChartData = (metricName: string): ChartData => {
    const metricData = metrics[metricName] || []
    return {
      labels: metricData.map(m => format(new Date(m.date), 'MMM d')),
      datasets: [{
        label: metricName,
        data: metricData.map(m => m.value),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)'
      }]
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
          <Select value={timeRange} onValueChange={value => {
            setTimeRange(value)
            const now = new Date()
            switch (value) {
              case '7d':
                setStartDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
                break
              case '30d':
                setStartDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
                break
              case '90d':
                setStartDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000))
                break
            }
            setEndDate(now)
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <DateRangePicker
            from={startDate}
            to={endDate}
            onFromChange={setStartDate}
            onToChange={setEndDate}
          />
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
              {(metrics['active_members']?.[metrics['active_members'].length - 1]?.value || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Content Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics['content_items']?.[metrics['content_items'].length - 1]?.value || 0)}
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
            <LineChart data={prepareChartData('membership')} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Daily Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={prepareChartData('engagement')} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Content Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart data={{
              labels: ['Posts', 'Comments', 'Reactions', 'Shares'],
              datasets: [{
                data: [
                  metrics['posts']?.[metrics['posts'].length - 1]?.value || 0,
                  metrics['comments']?.[metrics['comments'].length - 1]?.value || 0,
                  metrics['reactions']?.[metrics['reactions'].length - 1]?.value || 0,
                  metrics['shares']?.[metrics['shares'].length - 1]?.value || 0
                ],
                backgroundColor: [
                  '#3b82f6',
                  '#10b981',
                  '#f59e0b',
                  '#ef4444'
                ]
              }]
            }} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Member Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={prepareChartData('active_members')} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 