'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart,
} from 'recharts';
import { CohortRetentionView } from '@/types/analytics';

/**
 * Props for RetentionCurveChart component
 */
export interface RetentionCurveChartProps {
  /** Array of cohort retention data */
  cohorts: CohortRetentionView[];
  /** Callback when cohort legend is clicked */
  onSelectCohort?: (cohort: CohortRetentionView) => void;
  /** Additional CSS classes for container */
  className?: string;
  /** Show loading state */
  isLoading?: boolean;
  /** Chart height in pixels */
  height?: number;
  /** Custom colors for cohort lines (cycle through if more cohorts than colors) */
  colors?: string[];
  /** Show area under curve */
  showArea?: boolean;
  /** Max cohorts to display (for readability) */
  maxCohorts?: number;
}

/**
 * Data point for retention curve
 * Represents retention % at each milestone (day 1, 7, 30, 90, year 1)
 */
interface RetentionDataPoint {
  name: string;
  days: number;
  [key: string]: string | number;
}

/**
 * Default colors for cohort lines
 * Pastel palette for good visual separation
 */
const DEFAULT_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

/**
 * RetentionCurveChart
 * 
 * Displays retention curves for multiple cohorts on a line chart.
 * X-axis shows days since signup (1, 7, 30, 90, 365).
 * Y-axis shows retention percentage (0-100%).
 * 
 * Features:
 * - Multi-cohort comparison
 * - Color-coded cohort lines
 * - Interactive legend
 * - Customizable styling
 * - Responsive sizing
 * - Optional area under curve
 * - Loading state
 */
export const RetentionCurveChart: React.FC<RetentionCurveChartProps> = ({
  cohorts,
  onSelectCohort,
  className = '',
  isLoading = false,
  height = 400,
  colors = DEFAULT_COLORS,
  showArea = false,
  maxCohorts = 6,
}) => {
  // Transform cohort data into chart format
  const chartData = useMemo(() => {
    const milestones = [
      { key: 'retention_day1', label: 'Day 1', days: 1 },
      { key: 'retention_day7', label: 'Day 7', days: 7 },
      { key: 'retention_day30', label: 'Day 30', days: 30 },
      { key: 'retention_day90', label: 'Day 90', days: 90 },
      { key: 'retention_year1', label: 'Year 1', days: 365 },
    ];

    // Create data points
    const data: RetentionDataPoint[] = milestones.map((m) => ({
      name: m.label,
      days: m.days,
    }));

    // Add cohort data (limit to maxCohorts for readability)
    const selectedCohorts = cohorts.slice(0, maxCohorts);
    selectedCohorts.forEach((cohort) => {
      const cohortLabel = cohort.cohort_name || `Cohort ${cohort.cohort_id}`;
      milestones.forEach((m, idx) => {
        data[idx][cohortLabel] = cohort[m.key as keyof CohortRetentionView] || 0;
      });
    });

    return data;
  }, [cohorts, maxCohorts]);

  if (isLoading) {
    return (
      <div className={`w-full bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="h-96 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!cohorts || cohorts.length === 0) {
    return (
      <div
        className={`w-full bg-white rounded-lg border border-gray-200 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <p className="text-gray-500 text-sm">No cohort data available</p>
      </div>
    );
  }

  // Get selected cohort labels
  const selectedCohorts = cohorts.slice(0, maxCohorts);
  const cohortLabels = selectedCohorts.map((c) => c.cohort_name || `Cohort ${c.cohort_id}`);

  return (
    <div className={`w-full bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Retention Curves</h3>
        <p className="text-sm text-slate-600 mt-1">
          Retention percentage over time for {cohortLabels.length} cohorts
        </p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        {showArea ? (
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <defs>
              {cohortLabels.map((label, idx) => (
                <linearGradient key={`gradient-${idx}`} id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[idx % colors.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors[idx % colors.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
              label={{ value: 'Retention %', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value) => `${Number(value).toFixed(1)}%`}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              onClick={(e) => {
                const clickedLabel = e.dataKey;
                const cohort = selectedCohorts.find(
                  (c) => (c.cohort_name || `Cohort ${c.cohort_id}`) === clickedLabel
                );
                if (cohort && onSelectCohort) {
                  onSelectCohort(cohort);
                }
              }}
            />
            {cohortLabels.map((label, idx) => (
              <Area
                key={`area-${idx}`}
                type="monotone"
                dataKey={label}
                fill={`url(#gradient-${idx})`}
                stroke={colors[idx % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[idx % colors.length], r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
              label={{ value: 'Retention %', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value) => `${Number(value).toFixed(1)}%`}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              onClick={(e) => {
                const clickedLabel = e.dataKey;
                const cohort = selectedCohorts.find(
                  (c) => (c.cohort_name || `Cohort ${c.cohort_id}`) === clickedLabel
                );
                if (cohort && onSelectCohort) {
                  onSelectCohort(cohort);
                }
              }}
            />
            {cohortLabels.map((label, idx) => (
              <Line
                key={`line-${idx}`}
                type="monotone"
                dataKey={label}
                stroke={colors[idx % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[idx % colors.length], r: 4 }}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>

      {/* Footer Info */}
      <div className="mt-4 text-xs text-gray-600">
        <p>
          Showing {cohortLabels.length} of {cohorts.length} cohorts
          {cohorts.length > maxCohorts && ` (${cohorts.length - maxCohorts} more available)`}
        </p>
      </div>
    </div>
  );
};

RetentionCurveChart.displayName = 'RetentionCurveChart';

export default RetentionCurveChart;
