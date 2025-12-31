'use client';

import React, { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { EngagementHeatmap as EngagementHeatmapType } from '@/types/analytics';
import { Activity, Clock } from 'lucide-react';

/**
 * Props for EngagementHeatmap component
 */
export interface EngagementHeatmapProps {
  /** Array of heatmap data (hour × day matrix) */
  data: EngagementHeatmapType[];
  /** Callback when cell is clicked */
  onSelectCell?: (dayOfWeek: number, hourOfDay: number) => void;
  /** Additional CSS classes for container */
  className?: string;
  /** Show loading state */
  isLoading?: boolean;
}

/**
 * Get color for engagement intensity
 * Scale from 0 (white) to 100 (dark blue)
 */
const getIntensityColor = (intensity: number): string => {
  if (intensity >= 80) return 'bg-blue-900';
  if (intensity >= 60) return 'bg-blue-700';
  if (intensity >= 40) return 'bg-blue-500';
  if (intensity >= 20) return 'bg-blue-300';
  if (intensity > 0) return 'bg-blue-100';
  return 'bg-gray-50';
};

/**
 * Get text color based on background intensity
 */
const getTextColor = (intensity: number): string => {
  return intensity >= 40 ? 'text-white' : 'text-gray-700';
};

/**
 * Day names
 */
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Hour labels (0-23)
 */
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

/**
 * EngagementHeatmap
 * 
 * Displays a 2D heatmap showing engagement intensity by:
 * - Day of week (rows: Sun-Sat)
 * - Hour of day (columns: 0-23)
 * 
 * Features:
 * - Color gradient (0 = light, 100 = dark blue)
 * - Peak hour/day indicators
 * - Interactive cells
 * - Tooltip with exact values
 * - Responsive grid layout
 */
export const EngagementHeatmap: React.FC<EngagementHeatmapProps> = ({
  data,
  onSelectCell,
  className = '',
  isLoading = false,
}) => {
  // Process heatmap data
  const heatmapGrid = useMemo(() => {
    // Create 7×24 grid
    const grid: Record<string, number> = {};

    // Initialize all cells to 0
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        grid[`${day}-${hour}`] = 0;
      }
    }

    // Fill with data
    if (data && data.length > 0) {
      data.forEach((cell) => {
        const key = `${cell.day_of_week}-${cell.hour_of_day}`;
        grid[key] = cell.engagement_score || 0;
      });
    }

    return grid;
  }, [data]);

  // Find peak times
  const peakAnalysis = useMemo(() => {
    let maxIntensity = 0;
    let peakDay = 0;
    let peakHour = 0;

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const intensity = heatmapGrid[`${day}-${hour}`] || 0;
        if (intensity > maxIntensity) {
          maxIntensity = intensity;
          peakDay = day;
          peakHour = hour;
        }
      }
    }

    // Calculate average
    const allIntensities = Object.values(heatmapGrid);
    const avgIntensity =
      allIntensities.length > 0
        ? allIntensities.reduce((sum, val) => sum + val, 0) / allIntensities.length
        : 0;

    return { maxIntensity, peakDay, peakHour, avgIntensity };
  }, [heatmapGrid]);

  if (isLoading) {
    return (
      <div className={`w-full bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="h-96 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`w-full bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">Engagement Heatmap</h3>
        </div>
        <p className="text-sm text-slate-600">
          User activity intensity by day of week and hour of day
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-xs text-blue-700 font-semibold uppercase">Peak Intensity</p>
          <p className="text-lg font-bold text-blue-900 mt-1">
            {peakAnalysis.maxIntensity.toFixed(1)}%
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {DAY_NAMES[peakAnalysis.peakDay]} {HOUR_LABELS[peakAnalysis.peakHour]}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-700 font-semibold uppercase">Average Intensity</p>
          <p className="text-lg font-bold text-slate-900 mt-1">
            {peakAnalysis.avgIntensity.toFixed(1)}%
          </p>
        </div>

        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-xs text-gray-700 font-semibold uppercase">Peak Day</p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {DAY_NAMES[peakAnalysis.peakDay]}
          </p>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        {/* Column Headers (Hours) */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <div className="w-16 flex-shrink-0" />
          <div className="flex-1 grid grid-cols-24 gap-px bg-gray-200">
            {HOUR_LABELS.map((hour, i) => (
              <div
                key={i}
                className="bg-white p-1 text-center text-xs font-semibold text-gray-700"
              >
                {i % 6 === 0 ? hour : ''}
              </div>
            ))}
          </div>
        </div>

        {/* Rows (Days) */}
        {DAY_NAMES.map((day, dayIdx) => (
          <div key={dayIdx} className="flex border-b border-gray-200 last:border-b-0 bg-gray-50">
            {/* Row Header (Day) */}
            <div className="w-16 flex-shrink-0 flex items-center justify-center font-semibold text-sm text-gray-700 bg-gray-50 border-r border-gray-200">
              {day}
            </div>

            {/* Cells */}
            <div className="flex-1 grid grid-cols-24 gap-px bg-gray-200">
              {HOUR_LABELS.map((_, hourIdx) => {
                const intensity = heatmapGrid[`${dayIdx}-${hourIdx}`] || 0;
                const bgColor = getIntensityColor(intensity);
                const textColor = getTextColor(intensity);
                const isPeak =
                  dayIdx === peakAnalysis.peakDay && hourIdx === peakAnalysis.peakHour;

                return (
                  <div
                    key={`${dayIdx}-${hourIdx}`}
                    onClick={() => onSelectCell?.(dayIdx, hourIdx)}
                    className={`p-1 text-center text-xs font-bold cursor-pointer transition-all hover:ring-2 hover:ring-blue-400 ${bgColor} ${textColor} ${
                      isPeak ? 'ring-2 ring-yellow-400 shadow-lg' : ''
                    }`}
                    title={`${day} ${HOUR_LABELS[hourIdx]}: ${intensity.toFixed(1)}%`}
                  >
                    {intensity > 30 ? Math.round(intensity) : ''}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-700 uppercase mb-3">Intensity Scale</p>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 border border-gray-300 rounded" />
            <span className="text-xs text-gray-600">0%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 rounded" />
            <span className="text-xs text-gray-600">0-20%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-300 rounded" />
            <span className="text-xs text-gray-600">20-40%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-xs text-gray-600">40-60%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-700 rounded" />
            <span className="text-xs text-gray-600">60-80%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-900 rounded" />
            <span className="text-xs text-gray-600">80-100%</span>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Peak Activity Window
        </h4>
        <p className="text-sm text-blue-700">
          Highest engagement on {DAY_NAMES[peakAnalysis.peakDay]}s at{' '}
          {HOUR_LABELS[peakAnalysis.peakHour]} with{' '}
          {peakAnalysis.maxIntensity.toFixed(1)}% intensity.
        </p>
      </div>
    </div>
  );
};

EngagementHeatmap.displayName = 'EngagementHeatmap';

export default EngagementHeatmap;
