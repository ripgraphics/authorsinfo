'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';

// Define the structure of the cohort data we expect from the API
interface CohortSummary {
  cohort_id: number;
  cohort_name: string;
  cohort_type: 'signup_date' | 'feature_adoption' | 'acquisition_channel' | 'custom';
  cohort_period: 'daily' | 'weekly' | 'monthly';
  total_members: number;
  last_snapshot_date: string;
  avg_d30_retention: number | null;
}

// Heatmap data structure
interface HeatmapCell {
  cohort: string;
  day: string;
  retention: number;
}

export default function CohortAnalysisDashboard() {
  const [cohorts, setCohorts] = useState<CohortSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);

  useEffect(() => {
    async function fetchCohortData() {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics/cohorts');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch data');
        }
        const data: CohortSummary[] = await response.json();
        setCohorts(data);

        // Generate sample heatmap data for visualization
        // In production, this would come from the detailed retention_snapshots table
        const mockHeatmapData: HeatmapCell[] = [];
        data.slice(0, 5).forEach((cohort, idx) => {
          const retentionDays = [1, 7, 14, 30, 60, 90];
          retentionDays.forEach((day) => {
            // Mock retention decreasing over time
            const baseRetention = (cohort.avg_d30_retention || 100) - day * 0.8;
            mockHeatmapData.push({
              cohort: cohort.cohort_name.substring(0, 15),
              day: `D${day}`,
              retention: Math.max(0, baseRetention + Math.random() * 10),
            });
          });
        });
        setHeatmapData(mockHeatmapData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCohortData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading cohort data...</p>
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

  if (cohorts.length === 0) {
    return (
      <Alert>
        <AlertTitle>No Cohort Data</AlertTitle>
        <AlertDescription>
          No cohort analysis data is available yet. Cohorts may still be processing or none have been created.
        </AlertDescription>
      </Alert>
    );
  }

  // Prepare data for retention chart
  const retentionChartData = cohorts.slice(0, 8).map((cohort) => ({
    name: cohort.cohort_name.substring(0, 12),
    'D30 Retention': cohort.avg_d30_retention || 0,
    Members: Math.min(cohort.total_members / 100, 100), // Scale for visibility
  }));

  return (
    <div className="space-y-8">
      {/* Retention Comparison Chart */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">30-Day Retention by Cohort</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={retentionChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis yAxisId="left" label={{ value: 'Retention %', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Members (scaled)', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="D30 Retention" fill="#8884d8" />
            <Bar yAxisId="right" dataKey="Members" fill="#82ca9d" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Retention Heatmap Scatter Chart */}
      {heatmapData.length > 0 && (
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Retention Progression by Day</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" name="Days" />
              <YAxis dataKey="retention" name="Retention %" />
              <ZAxis range={[60, 400]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter
                name="Cohort Retention"
                data={heatmapData}
                fill="#8884d8"
                fillOpacity={0.7}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cohort Summary Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Cohort Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cohort Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Total Members</TableHead>
                <TableHead className="text-right">Avg. 30-Day Retention</TableHead>
                <TableHead>Last Snapshot</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cohorts.map((cohort) => (
                <TableRow key={cohort.cohort_id}>
                  <TableCell className="font-medium">{cohort.cohort_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{cohort.cohort_type.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{cohort.cohort_period}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{cohort.total_members.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {cohort.avg_d30_retention !== null
                      ? `${cohort.avg_d30_retention.toFixed(2)}%`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {new Date(cohort.last_snapshot_date).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

