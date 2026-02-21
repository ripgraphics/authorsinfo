'use client';

import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { UserSegment, SegmentType } from '@/types/analytics';

/**
 * Props for UserSegmentationChart component
 */
export interface UserSegmentationChartProps {
  /** Array of user segments with member counts */
  segments: UserSegment[];
  /** Callback when segment is selected */
  onSelectSegment?: (segment: UserSegment) => void;
  /** Additional CSS classes for container */
  className?: string;
  /** Show loading state */
  isLoading?: boolean;
  /** Chart type: 'pie' or 'bar' */
  chartType?: 'pie' | 'bar';
  /** Chart height in pixels */
  height?: number;
}

/**
 * Chart data point
 */
interface ChartDataPoint {
  name: string;
  value: number;
  segmentId: string;
  segmentType: SegmentType;
}

/**
 * Color palette for segments
 * Different color for each segment type
 */
const SEGMENT_COLORS: Record<SegmentType, string> = {
  behavioral: 'hsl(var(--chart-1))',
  demographic: 'hsl(var(--chart-2))',
  engagement: 'hsl(var(--chart-3))',
  activity: 'hsl(var(--chart-4))',
};

/**
 * Color for pie chart segments (cycle through palette)
 */
const PIE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--muted-foreground))',
  'hsl(var(--ring))',
];

/**
 * Get segment type label
 */
const getSegmentTypeLabel = (type: SegmentType): string => {
  const labels: Record<SegmentType, string> = {
    behavioral: 'Behavioral',
    demographic: 'Demographic',
    engagement: 'Engagement',
    activity: 'Activity',
  };
  return labels[type] || type;
};

/**
 * UserSegmentationChart
 * 
 * Displays user segment distribution with:
 * - Pie chart or bar chart visualization
 * - Segment member counts
 * - Segment type breakdown
 * - Interactive legend
 * - Color-coded by segment type
 * 
 * Features:
 * - Switchable chart types (pie/bar)
 * - Segment selection callback
 * - Responsive sizing
 * - Loading states
 * - Member count tooltips
 */
export const UserSegmentationChart: React.FC<UserSegmentationChartProps> = ({
  segments,
  onSelectSegment,
  className = '',
  isLoading = false,
  chartType = 'pie',
  height = 400,
}) => {
  // Transform segment data
  const chartData = useMemo(() => {
    if (!segments || segments.length === 0) return [];

    return segments
      .filter((s) => (s as any).segment_size && (s as any).segment_size > 0)
      .map((segment) => ({
        name: segment.name || `Segment ${segment.id}`,
        value: (segment as any).segment_size || 0,
        segmentId: segment.id,
        segmentType: (segment as any).segment_type,
      }))
      .sort((a, b) => b.value - a.value);
  }, [segments]);

  // Calculate totals by type
  const typeBreakdown = useMemo(() => {
    const breakdown: Record<SegmentType, number> = {
      behavioral: 0,
      demographic: 0,
      engagement: 0,
      activity: 0,
    };

    chartData.forEach((d) => {
      const segmentType = (d.segmentType as SegmentType) || 'behavioral';
      breakdown[segmentType] = (breakdown[segmentType] || 0) + d.value;
    });

    return breakdown;
  }, [chartData]);

  const totalMembers = useMemo(
    () => Object.values(typeBreakdown).reduce((sum, val) => sum + val, 0),
    [typeBreakdown]
  );

  if (isLoading) {
    return (
      <div className={`w-full bg-card rounded-lg border p-4 ${className}`}>
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div
        className={`w-full bg-card rounded-lg border flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <p className="text-muted-foreground text-sm">No segment data available</p>
      </div>
    );
  }

  return (
    <div className={`w-full bg-card rounded-lg border p-4 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">User Segmentation</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Distribution of {chartData.length} segments with {totalMembers.toLocaleString()} total members
        </p>
      </div>

      {/* Chart Container */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={height}>
          {chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent = 0 }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="hsl(var(--chart-1))"
                dataKey="value"
                onClick={(entry) => {
                  const selected = chartData.find((d) => d.segmentId === entry.payload.segmentId);
                  if (selected && onSelectSegment) {
                    const segment = segments.find((s) => s.id === selected.segmentId);
                    if (segment) {
                      onSelectSegment(segment);
                    }
                  }
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `${Number(value).toLocaleString()} members`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
              />
            </PieChart>
          ) : (
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                label={{ value: 'Members', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value) => `${Number(value).toLocaleString()} members`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar
                dataKey="value"
                fill="hsl(var(--chart-1))"
                onClick={(entry) => {
                  const selected = chartData.find((d) => d.segmentId === entry.payload.segmentId);
                  if (selected && onSelectSegment) {
                    const segment = segments.find((s) => s.id === selected.segmentId);
                    if (segment) {
                      onSelectSegment(segment);
                    }
                  }
                }}
                radius={[8, 8, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Type Breakdown */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-semibold text-foreground">Breakdown by Type</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(typeBreakdown).map(([type, count]) => (
            <div
              key={type}
              className="p-3 rounded-lg border bg-muted/50"
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                {getSegmentTypeLabel(type as SegmentType)}
              </p>
              <p className="text-lg font-bold text-foreground mt-1">
                {count.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalMembers > 0 ? `${((count / totalMembers) * 100).toFixed(1)}%` : '0%'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Segment List */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">All Segments</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {chartData.map((entry, idx) => {
            const segment = segments.find((s) => s.id === entry.segmentId);
            const percentage = totalMembers > 0 ? ((entry.value / totalMembers) * 100).toFixed(1) : '0';

            return (
              <div
                key={entry.segmentId}
                onClick={() => segment && onSelectSegment?.(segment)}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  onSelectSegment
                    ? 'hover:bg-muted/50 cursor-pointer'
                    : 'border-border/60 bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getSegmentTypeLabel(entry.segmentType)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {entry.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">{percentage}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

UserSegmentationChart.displayName = 'UserSegmentationChart';

export default UserSegmentationChart;
