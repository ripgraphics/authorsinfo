'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/types/database';

// Import chart components (you'll need to install a charting library like recharts)
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface GroupAnalyticsProps {
  groupId: string;
}

export default function GroupAnalytics({ groupId }: GroupAnalyticsProps) {
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    to: new Date(),
  });
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('members');

  const supabase = createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('group_analytics')
          .select('*')
          .eq('group_id', groupId)
          .gte('date', dateRange.from.toISOString())
          .lte('date', dateRange.to.toISOString())
          .order('date', { ascending: true });

        if (error) throw error;
        setMetrics(data || []);
      } catch (err: any) {
        toast({
          title: 'Error',
          description: 'Failed to load analytics data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [groupId, dateRange, supabase, toast]);

  const getMetricData = () => {
    switch (selectedMetric) {
      case 'members':
        return metrics.map(m => ({
          date: format(new Date(m.date), 'MMM d'),
          total: m.total_members,
          active: m.active_members,
          new: m.new_members,
        }));
      case 'content':
        return metrics.map(m => ({
          date: format(new Date(m.date), 'MMM d'),
          total: m.total_content,
          new: m.new_content,
        }));
      case 'engagement':
        return metrics.map(m => ({
          date: format(new Date(m.date), 'MMM d'),
          rate: (m.active_members / m.total_members) * 100,
          interactions: m.engagement_metrics?.total_interactions || 0,
        }));
      default:
        return [];
    }
  };

  const renderChart = () => {
    const data = getMetricData();

    switch (selectedMetric) {
      case 'members':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total Members" />
              <Line type="monotone" dataKey="active" stroke="#82ca9d" name="Active Members" />
              <Line type="monotone" dataKey="new" stroke="#ffc658" name="New Members" />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'content':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="total" stackId="1" stroke="#8884d8" fill="#8884d8" name="Total Content" />
              <Area type="monotone" dataKey="new" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="New Content" />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'engagement':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="rate" fill="#8884d8" name="Engagement Rate (%)" />
              <Bar yAxisId="right" dataKey="interactions" fill="#82ca9d" name="Total Interactions" />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Group Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="members">Member Growth</SelectItem>
                <SelectItem value="content">Content Growth</SelectItem>
                <SelectItem value="engagement">Engagement Metrics</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to,
                    }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              Loading analytics...
            </div>
          ) : (
            <div className="w-full h-[400px]">
              {renderChart()}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics[metrics.length - 1]?.total_members || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  {metrics[metrics.length - 1]?.new_members || 0} new in selected period
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics[metrics.length - 1]?.active_members
                    ? Math.round(
                        (metrics[metrics.length - 1].active_members /
                          metrics[metrics.length - 1].total_members) *
                          100
                      )
                    : 0}
                  %
                </div>
                <div className="text-sm text-muted-foreground">
                  Based on active members
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics[metrics.length - 1]?.total_content || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  {metrics[metrics.length - 1]?.new_content || 0} new in selected period
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 