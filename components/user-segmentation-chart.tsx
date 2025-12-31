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
  behavioral: '#3b82f6', // Blue
  demographic: '#ef4444', // Red
  engagement: '#10b981', // Green
  activity: '#f59e0b', // Amber
};

/**
 * Color for pie chart segments (cycle through palette)
 */
const PIE_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#d946ef', // Magenta
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
      .filter((s) => s.segment_size && s.segment_size > 0)
      .map((segment) => ({
        name: segment.name || `Segment ${segment.id}`,
        value: segment.segment_size || 0,
        segmentId: segment.id,
        segmentType: segment.segment_type,
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
      breakdown[d.segmentType] += d.value;
    });

    return breakdown;
  }, [chartData]);

  const totalMembers = useMemo(
    () => Object.values(typeBreakdown).reduce((sum, val) => sum + val, 0),
    [typeBreakdown]
  );

  if (isLoading) {
    return (
      <div className={`w-full bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="h-96 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div
        className={`w-full bg-white rounded-lg border border-gray-200 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <p className="text-gray-500 text-sm">No segment data available</p>
      </div>
    );
  }

  return (
    <div className={`w-full bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">User Segmentation</h3>
        <p className="text-sm text-slate-600 mt-1">
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
                fill="#8884d8"
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
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
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
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                label={{ value: 'Members', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value) => `${Number(value).toLocaleString()} members`}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar
                dataKey="value"
                fill="#3b82f6"
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
        <h4 className="text-sm font-semibold text-slate-900">Breakdown by Type</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(typeBreakdown).map(([type, count]) => (
            <div
              key={type}
              className="p-3 rounded-lg border border-gray-200 bg-gray-50"
            >
              <p className="text-xs font-semibold text-gray-600 uppercase">
                {getSegmentTypeLabel(type as SegmentType)}
              </p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {count.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {totalMembers > 0 ? `${((count / totalMembers) * 100).toFixed(1)}%` : '0%'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Segment List */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">All Segments</h4>
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
                    ? 'hover:bg-gray-50 cursor-pointer border-gray-200'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{entry.name}</p>
                    <p className="text-xs text-gray-500">
                      {getSegmentTypeLabel(entry.segmentType)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {entry.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{percentage}%</p>
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
