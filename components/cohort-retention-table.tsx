'use client';

import React from 'react';
import { CohortRetentionView } from '@/types/analytics';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Props for CohortRetentionTable component
 * All data provided via props - zero store coupling
 */
export interface CohortRetentionTableProps {
  /** Array of cohort retention data from analytics store or API */
  cohorts: CohortRetentionView[];
  /** Callback when cohort is selected for detailed view */
  onSelectCohort?: (cohort: CohortRetentionView) => void;
  /** Additional CSS classes for container */
  className?: string;
  /** Show loading state */
  isLoading?: boolean;
  /** Custom column order */
  columnOrder?: Array<'day1' | 'day7' | 'day30' | 'day90' | 'year1'>;
}

/**
 * Internal type for retention color mapping
 */
interface RetentionColor {
  bg: string;
  text: string;
  border: string;
}

/**
 * Get color class based on retention percentage
 * 80-100%: Excellent (dark green)
 * 60-79%: Good (green)
 * 40-59%: Fair (yellow)
 * 20-39%: Poor (orange)
 * 0-19%: Critical (red)
 */
const getRetentionColor = (percentage: number): RetentionColor => {
  if (percentage >= 80) {
    return {
      bg: 'bg-emerald-900',
      text: 'text-emerald-50',
      border: 'border-emerald-700',
    };
  }
  if (percentage >= 60) {
    return {
      bg: 'bg-green-700',
      text: 'text-green-50',
      border: 'border-green-600',
    };
  }
  if (percentage >= 40) {
    return {
      bg: 'bg-amber-600',
      text: 'text-amber-50',
      border: 'border-amber-500',
    };
  }
  if (percentage >= 20) {
    return {
      bg: 'bg-orange-600',
      text: 'text-orange-50',
      border: 'border-orange-500',
    };
  }
  return {
    bg: 'bg-red-700',
    text: 'text-red-50',
    border: 'border-red-600',
  };
};

/**
 * CohortRetentionTable
 * 
 * Displays a color-coded heatmap table showing retention rates across
 * multiple retention milestones (Day 1, 7, 30, 90, Year 1).
 * 
 * Features:
 * - Color-coded retention percentages (red-yellow-green gradient)
 * - Cohort information (date, size, type)
 * - Clickable rows for detailed view
 * - Responsive table design
 * - Loading state with skeleton
 */
export const CohortRetentionTable: React.FC<CohortRetentionTableProps> = ({
  cohorts,
  onSelectCohort,
  className = '',
  isLoading = false,
  columnOrder = ['day1', 'day7', 'day30', 'day90', 'year1'],
}) => {
  if (isLoading) {
    return (
      <div className={`w-full bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!cohorts || cohorts.length === 0) {
    return (
      <div className={`w-full bg-white rounded-lg border border-gray-200 p-12 text-center ${className}`}>
        <p className="text-gray-500 text-sm">No cohort data available</p>
      </div>
    );
  }

  // Column labels with descriptions
  const columnLabels: Record<string, string> = {
    day1: 'Day 1',
    day7: 'Day 7',
    day30: 'Day 30',
    day90: 'Day 90',
    year1: 'Year 1',
  };

  // Get retention value for column
  const getRetentionValue = (cohort: CohortRetentionView, column: string): number => {
    const values: Record<string, number> = {
      day1: cohort.retention_d1 || 0,
      day7: cohort.retention_d7 || 0,
      day30: cohort.retention_d30 || 0,
      day90: cohort.retention_d90 || 0,
      year1: cohort.retention_y1 || 0,
    };
    return values[column] || 0;
  };

  // Format cohort date
  const formatCohortDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={`w-full bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-slate-900">Cohort Retention Rates</h3>
        <p className="text-sm text-slate-600 mt-1">
          Color-coded retention percentages across key milestones
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Head */}
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Cohort
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Size
              </th>
              {columnOrder.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  {columnLabels[col]}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-200">
            {cohorts.map((cohort, idx) => (
              <tr
                key={cohort.cohort_id}
                onClick={() => onSelectCohort?.(cohort)}
                className={`${
                  onSelectCohort ? 'hover:bg-slate-50 cursor-pointer transition-colors' : ''
                } ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                {/* Cohort Name */}
                <td className="px-4 py-4">
                  <div className="font-medium text-gray-900">{cohort.cohort_name || 'N/A'}</div>
                </td>

                {/* Cohort Date */}
                <td className="px-4 py-4 text-sm text-gray-600">
                  {formatCohortDate(cohort.snapshot_date)}
                </td>

                {/* Cohort Size */}
                <td className="px-4 py-4 text-sm font-medium text-gray-900">
                  {cohort.cohort_size?.toLocaleString() || '0'}
                </td>

                {/* Retention Cells */}
                {columnOrder.map((col) => {
                  const retention = getRetentionValue(cohort, col);
                  const color = getRetentionColor(retention);

                  return (
                    <td key={col} className="px-4 py-4 text-center">
                      <div
                        className={`inline-flex items-center justify-center w-16 h-10 rounded font-semibold text-sm ${color.bg} ${color.text} border ${color.border}`}
                      >
                        {retention.toFixed(1)}%
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-900 rounded border border-emerald-700" />
            <span className="text-gray-600">Excellent (80-100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-700 rounded border border-green-600" />
            <span className="text-gray-600">Good (60-79%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-600 rounded border border-amber-500" />
            <span className="text-gray-600">Fair (40-59%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-600 rounded border border-orange-500" />
            <span className="text-gray-600">Poor (20-39%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-700 rounded border border-red-600" />
            <span className="text-gray-600">Critical (0-19%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

CohortRetentionTable.displayName = 'CohortRetentionTable';

export default CohortRetentionTable;
