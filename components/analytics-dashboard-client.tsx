'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, Download, RefreshCw, Filter } from 'lucide-react';
import { CohortRetentionTable } from './cohort-retention-table';
import { RetentionCurveChart } from './retention-curve-chart';
import { ChurnRiskDashboard } from './churn-risk-dashboard';
import { UserSegmentationChart } from './user-segmentation-chart';
import { EngagementHeatmap } from './engagement-heatmap';
import { TrendingTopicsTable } from './trending-topics-table';
import type { CohortRetentionView, UserChurnRisk, UserSegment, EngagementHeatmap as EngagementHeatmapType, TrendingTopic } from '@/types/analytics';

interface DateRange {
  from: Date;
  to: Date;
}

interface Tab {
  id: 'cohorts' | 'churn' | 'segments' | 'engagement';
  label: string;
  icon: React.ReactNode;
}

export interface AnalyticsDashboardClientProps {
  initialTab?: 'cohorts' | 'churn' | 'segments' | 'engagement';
  cohorts?: CohortRetentionView[];
  churnUsers?: UserChurnRisk[];
  segments?: UserSegment[];
  engagementData?: EngagementHeatmapType[];
  trendingTopics?: TrendingTopic[];
  isLoading?: boolean;
  onExportCSV?: (tab: string, data: unknown) => void;
}

export const AnalyticsDashboardClient: React.FC<AnalyticsDashboardClientProps> = ({
  initialTab = 'cohorts',
  cohorts = [],
  churnUsers = [],
  segments = [],
  engagementData = [],
  trendingTopics = [],
  isLoading = false,
  onExportCSV,
}) => {
  const [activeTab, setActiveTab] = useState<Tab['id']>(initialTab);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
    to: new Date(),
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [selectedSegmentType, setSelectedSegmentType] = useState<string>('all');

  const tabs: Tab[] = [
    { id: 'cohorts', label: 'Cohort Analysis', icon: '📊' },
    { id: 'churn', label: 'Churn Risk', icon: '⚠️' },
    { id: 'segments', label: 'Segmentation', icon: '👥' },
    { id: 'engagement', label: 'Engagement', icon: '📈' },
  ];

  // Filter data based on date range and selected filters
  const filteredChurnUsers = useMemo(() => {
    return churnUsers.filter((user) => {
      if (selectedRiskLevel === 'all') return true;
      return user.risk_level.toString().toLowerCase() === selectedRiskLevel;
    });
  }, [churnUsers, selectedRiskLevel]);

  const filteredSegments = useMemo(() => {
    return segments.filter((seg) => {
      if (selectedSegmentType === 'all') return true;
      return seg.segment_type.toString().toLowerCase() === selectedSegmentType;
    });
  }, [segments, selectedSegmentType]);

  const handleExport = (format: 'csv' | 'json' = 'csv') => {
    let data: unknown;
    let filename = `analytics-${activeTab}-${new Date().toISOString().split('T')[0]}`;

    switch (activeTab) {
      case 'cohorts':
        data = cohorts;
        filename += '.csv';
        break;
      case 'churn':
        data = filteredChurnUsers;
        filename += '.csv';
        break;
      case 'segments':
        data = filteredSegments;
        filename += '.csv';
        break;
      case 'engagement':
        data = { engagementData, trendingTopics };
        filename += '.csv';
        break;
    }

    if (onExportCSV) {
      onExportCSV(activeTab, data);
    }

    // Fallback: Basic CSV export
    if (format === 'csv' && Array.isArray(data)) {
      const csv = convertToCSV(data);
      downloadCSV(csv, filename);
    }
  };

  const handleRefresh = async () => {
    // Trigger a page refresh to re-fetch data
    window.location.reload();
  };

  const handleDateRangeChange = (from: Date, to: Date) => {
    setDateRange({ from, to });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Analytics Dashboard</h1>
        <p className="text-slate-400">Real-time insights into user behavior and platform health</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Date Range Picker */}
        <div className="flex-1 flex items-center gap-2 bg-slate-700/50 px-4 py-3 rounded-lg border border-slate-600">
          <Calendar className="w-5 h-5 text-slate-400" />
          <input
            type="date"
            value={dateRange.from.toISOString().split('T')[0]}
            onChange={(e) =>
              handleDateRangeChange(new Date(e.target.value), dateRange.to)
            }
            className="bg-transparent text-white text-sm border-none outline-none"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={dateRange.to.toISOString().split('T')[0]}
            onChange={(e) =>
              handleDateRangeChange(dateRange.from, new Date(e.target.value))
            }
            className="bg-transparent text-white text-sm border-none outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg border border-slate-600 transition-colors"
            title="Toggle filters"
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg border border-slate-600 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            title="Export to CSV"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-slate-700/30 p-4 rounded-lg border border-slate-600">
          {activeTab === 'churn' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Risk Level
              </label>
              <select
                value={selectedRiskLevel}
                onChange={(e) => setSelectedRiskLevel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          )}
          {activeTab === 'segments' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Segment Type
              </label>
              <select
                value={selectedSegmentType}
                onChange={(e) => setSelectedSegmentType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="behavioral">Behavioral</option>
                <option value="demographic">Demographic</option>
                <option value="engagement">Engagement</option>
                <option value="activity">Activity</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'cohorts' && (
          <div className="space-y-6">
            <div className="bg-slate-700/30 rounded-lg border border-slate-600 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Retention Analysis</h2>
              <RetentionCurveChart
                cohorts={cohorts}
                isLoading={isLoading}
                height={400}
              />
            </div>
            <div className="bg-slate-700/30 rounded-lg border border-slate-600 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Cohort Retention Heatmap</h2>
              <CohortRetentionTable
                cohorts={cohorts}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {activeTab === 'churn' && (
          <div className="bg-slate-700/30 rounded-lg border border-slate-600 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Churn Risk Analysis</h2>
            <ChurnRiskDashboard
              atRiskUsers={filteredChurnUsers}
              isLoading={isLoading}
              maxUsers={50}
            />
          </div>
        )}

        {activeTab === 'segments' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-700/30 rounded-lg border border-slate-600 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Segment Distribution</h2>
              <UserSegmentationChart
                segments={filteredSegments}
                isLoading={isLoading}
                chartType="pie"
              />
            </div>
            <div className="bg-slate-700/30 rounded-lg border border-slate-600 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Segment Comparison</h2>
              <UserSegmentationChart
                segments={filteredSegments}
                isLoading={isLoading}
                chartType="bar"
              />
            </div>
          </div>
        )}

        {activeTab === 'engagement' && (
          <div className="space-y-6">
            <div className="bg-slate-700/30 rounded-lg border border-slate-600 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Engagement Heatmap</h2>
              <EngagementHeatmap
                data={engagementData}
                isLoading={isLoading}
              />
            </div>
            <div className="bg-slate-700/30 rounded-lg border border-slate-600 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Trending Topics</h2>
              <TrendingTopicsTable
                topics={trendingTopics}
                isLoading={isLoading}
                maxTopics={20}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Utility functions
function convertToCSV(data: unknown[]): string {
  if (!Array.isArray(data) || data.length === 0) return '';

  const headers = Object.keys(data[0] as Record<string, unknown>);
  const rows = data.map((item) =>
    headers.map((header) => {
      const value = (item as Record<string, unknown>)[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    })
  );

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
