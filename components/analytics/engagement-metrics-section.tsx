'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface EngagementMetrics {
  total_activities: number;
  unique_users: number;
  avg_daily_activities: number;
  daily_activity_breakdown: Record<string, number>;
  entity_breakdown: Record<string, number>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const ENTITY_COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

export default function EngagementMetricsSection() {
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/analytics/engagement');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch metrics');
        }
        const data = await response.json();
        setMetrics(data.metrics);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading engagement metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!metrics) {
    return (
      <Alert>
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>No engagement metrics available.</AlertDescription>
      </Alert>
    );
  }

  // Prepare chart data
  const activityChartData = Object.entries(metrics.daily_activity_breakdown).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const entityChartData = Object.entries(metrics.entity_breakdown).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
          <p className="text-3xl font-bold mt-2">{metrics.total_activities.toLocaleString()}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm font-medium text-muted-foreground">Active Users</p>
          <p className="text-3xl font-bold mt-2">{metrics.unique_users.toLocaleString()}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm font-medium text-muted-foreground">Daily Average</p>
          <p className="text-3xl font-bold mt-2">{metrics.avg_daily_activities.toLocaleString()}</p>
        </div>
      </div>

      {/* Activity Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Activity Type Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={activityChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Entity Breakdown */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Entity Engagement Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={entityChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {entityChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={ENTITY_COLORS[index % ENTITY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Breakdown Details Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Activity Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Activity Type</th>
                <th className="px-4 py-3 text-right font-medium">Count</th>
                <th className="px-4 py-3 text-right font-medium">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {activityChartData.map((item, index) => (
                <tr key={item.name} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-4 font-medium">{item.name}</td>
                  <td className="px-4 py-4 text-right">{item.value.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right">
                    {(
                      (item.value / metrics.total_activities) *
                      100
                    ).toFixed(1)}
                    %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
