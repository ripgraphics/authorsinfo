'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface Segment {
  id: number;
  name: string;
  description: string;
  segment_type: 'behavioral' | 'demographic' | 'engagement' | 'activity';
  criteria: Record<string, any>;
  status: 'active' | 'inactive' | 'archived';
  member_count: number;
  created_at: string;
  updated_at: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const SEGMENT_TYPE_LABELS: Record<string, string> = {
  behavioral: 'Behavioral',
  demographic: 'Demographic',
  engagement: 'Engagement',
  activity: 'Activity',
};

export default function UserSegmentationDashboard() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSegmentationData() {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics/segmentation');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch data');
        }
        const data: Segment[] = await response.json();
        setSegments(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSegmentationData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading segmentation data...</p>
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

  if (segments.length === 0) {
    return (
      <Alert>
        <AlertTitle>No Segmentation Data</AlertTitle>
        <AlertDescription>
          No user segments have been created yet. Create segments to start analyzing user groups.
        </AlertDescription>
      </Alert>
    );
  }

  // Prepare data for pie chart
  const chartData = segments.map((seg) => ({
    name: seg.name,
    value: seg.member_count,
    type: seg.segment_type,
  }));

  // Count segments by type
  const segmentsByType = segments.reduce(
    (acc, seg) => {
      acc[seg.segment_type] = (acc[seg.segment_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const typeChartData = Object.entries(segmentsByType).map(([type, count]) => ({
    type: SEGMENT_TYPE_LABELS[type],
    count,
  }));

  // Calculate total members
  const totalMembers = segments.reduce((sum, seg) => sum + seg.member_count, 0);

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm font-medium text-muted-foreground">Total Segments</p>
          <p className="text-3xl font-bold mt-2">{segments.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm font-medium text-muted-foreground">Total Members</p>
          <p className="text-3xl font-bold mt-2">{totalMembers.toLocaleString()}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm font-medium text-muted-foreground">Average Segment Size</p>
          <p className="text-3xl font-bold mt-2">
            {Math.round(totalMembers / segments.length).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Segment Distribution Pie Chart */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Member Distribution by Segment</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => (value || 0).toLocaleString()} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Segment Type Distribution */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Segments by Type</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={typeChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Segments Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">User Segments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Segment Name</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-right font-medium">Members</th>
                <th className="px-4 py-3 text-left font-medium">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((segment) => (
                <tr key={segment.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-4 font-medium">{segment.name}</td>
                  <td className="px-4 py-4">
                    <Badge variant="outline">{SEGMENT_TYPE_LABELS[segment.segment_type]}</Badge>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {segment.description || 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-right">{segment.member_count.toLocaleString()}</td>
                  <td className="px-4 py-4">
                    {totalMembers > 0
                      ? `${((segment.member_count / totalMembers) * 100).toFixed(1)}%`
                      : 'N/A'}
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
