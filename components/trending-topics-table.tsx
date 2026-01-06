'use client';

import React, { useMemo } from 'react';
import { TrendingTopic, TrendingTopicType } from '@/types/analytics';
import { TrendingUp, TrendingDown, Minus, Flame } from 'lucide-react';

/**
 * Props for TrendingTopicsTable component
 */
export interface TrendingTopicsTableProps {
  /** Array of trending topics */
  topics: TrendingTopic[];
  /** Callback when topic is selected */
  onSelectTopic?: (topic: TrendingTopic) => void;
  /** Additional CSS classes for container */
  className?: string;
  /** Show loading state */
  isLoading?: boolean;
  /** Max topics to display */
  maxTopics?: number;
  /** Sort by 'mentions' or 'trend' */
  sortBy?: 'mentions' | 'trend';
}

/**
 * Topic type labels and colors
 */
const TOPIC_TYPES: Record<TrendingTopicType, { label: string; color: string; bg: string }> = {
  book: { label: 'Book', color: 'text-blue-700', bg: 'bg-blue-100' },
  author: { label: 'Author', color: 'text-purple-700', bg: 'bg-purple-100' },
  genre: { label: 'Genre', color: 'text-green-700', bg: 'bg-green-100' },
  hashtag: { label: 'Hashtag', color: 'text-pink-700', bg: 'bg-pink-100' },
};

/**
 * Get trend direction icon and styling
 */
const getTrendIcon = (direction: number) => {
  if (direction > 5) {
    return {
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
      label: 'Rising',
    };
  }
  if (direction < -5) {
    return {
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-50',
      label: 'Falling',
    };
  }
  return {
    icon: Minus,
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    label: 'Stable',
  };
};

/**
 * TrendingTopicsTable
 * 
 * Displays a table of trending topics with:
 * - Topic name and type (book, author, genre, hashtag)
 * - Mention count
 * - Trend direction (rising/falling/stable)
 * - Rank and velocity
 * - Heat indicator (flame icon for hot topics)
 * 
 * Features:
 * - Color-coded by topic type
 * - Trend direction indicators
 * - Interactive rows
 * - Sortable columns
 * - Loading states
 * - Responsive design
 */
export const TrendingTopicsTable: React.FC<TrendingTopicsTableProps> = ({
  topics,
  onSelectTopic,
  className = '',
  isLoading = false,
  maxTopics = 20,
  sortBy = 'mentions',
}) => {
  // Sort and limit topics
  const sortedTopics = useMemo(() => {
    if (!topics || topics.length === 0) return [];

    let sorted = [...topics].slice(0, maxTopics);

    if (sortBy === 'trend') {
      sorted.sort((a, b) => {
        const aTrend = typeof a.trend_direction === 'number' ? a.trend_direction : 0;
        const bTrend = typeof b.trend_direction === 'number' ? b.trend_direction : 0;
        return Math.abs(bTrend) - Math.abs(aTrend);
      });
    } else {
      sorted.sort((a, b) => (b.mention_count || 0) - (a.mention_count || 0));
    }

    return sorted;
  }, [topics, maxTopics, sortBy]);

  // Calculate stats
  const stats = useMemo(() => {
    if (sortedTopics.length === 0) {
      return {
        totalMentions: 0,
        avgTrend: 0,
        risingCount: 0,
        maxMentions: 0,
      };
    }

    const totalMentions = sortedTopics.reduce((sum, t) => sum + (t.mention_count || 0), 0);
    const avgTrend =
      sortedTopics.reduce((sum, t) => {
        const trend = typeof t.trend_direction === 'number' ? t.trend_direction : 0;
        return sum + trend;
      }, 0) / sortedTopics.length;
    const risingCount = sortedTopics.filter((t) => {
      const trend = typeof t.trend_direction === 'number' ? t.trend_direction : 0;
      return trend > 5;
    }).length;
    const maxMentions = Math.max(...sortedTopics.map((t) => t.mention_count || 0));

    return { totalMentions, avgTrend, risingCount, maxMentions };
  }, [sortedTopics]);

  if (isLoading) {
    return (
      <div className={`w-full bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!sortedTopics || sortedTopics.length === 0) {
    return (
      <div className={`w-full bg-white rounded-lg border border-gray-200 p-12 text-center ${className}`}>
        <p className="text-gray-500 text-sm">No trending topics found</p>
      </div>
    );
  }

  return (
    <div className={`w-full bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-slate-900">Trending Topics</h3>
        <p className="text-sm text-slate-600 mt-1">
          {sortedTopics.length} trending topics with {stats.totalMentions.toLocaleString()} total mentions
        </p>
      </div>

      {/* Stats Bar */}
      <div className="px-4 py-4 bg-gray-50 border-b border-gray-200 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-600 font-semibold uppercase">Total Mentions</p>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {stats.totalMentions.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-semibold uppercase">Rising Topics</p>
          <p className="text-xl font-bold text-green-600 mt-1">{stats.risingCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-semibold uppercase">Avg Trend</p>
          <p className={`text-xl font-bold mt-1 ${stats.avgTrend > 0 ? 'text-green-600' : stats.avgTrend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {stats.avgTrend.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-semibold uppercase">Peak Mentions</p>
          <p className="text-xl font-bold text-blue-600 mt-1">
            {stats.maxMentions.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Head */}
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Topic
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Mentions
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Trend
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Heat
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-200">
            {sortedTopics.map((topic, idx) => {
              const trendValue = typeof topic.trend_direction === 'number' ? topic.trend_direction : 0;
              const trend = getTrendIcon(trendValue);
              const TrendIcon = trend.icon;
              const typeInfo = TOPIC_TYPES[topic.topic_type];
              const mentionPercent =
                stats.maxMentions > 0
                  ? Math.round((topic.mention_count || 0) / stats.maxMentions * 100)
                  : 0;
              const isHot = (topic.mention_count || 0) > stats.totalMentions / sortedTopics.length * 1.5;

              return (
                <tr
                  key={topic.id}
                  onClick={() => onSelectTopic?.(topic)}
                  className={`${
                    onSelectTopic ? 'hover:bg-slate-50 cursor-pointer transition-colors' : ''
                  } ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  {/* Rank */}
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                      {idx + 1}
                    </div>
                  </td>

                  {/* Topic Name */}
                  <td className="px-4 py-4">
                    <div className="font-semibold text-gray-900">{topic.topic_name}</div>
                  </td>

                  {/* Type Badge */}
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeInfo.bg} ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                  </td>

                  {/* Mention Count with Bar */}
                  <td className="px-4 py-4">
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 mb-1">
                        {(topic.mention_count || 0).toLocaleString()}
                      </div>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${mentionPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Trend Direction */}
                  <td className="px-4 py-4">
                      <div className={`flex items-center justify-center`}>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${trend.bg}`}>
                          <TrendIcon className={`w-4 h-4 ${trend.color}`} />
                          <span className={`text-xs font-semibold ${trend.color}`}>
                            {Math.abs(trendValue).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                  </td>

                  {/* Heat Indicator */}
                  <td className="px-4 py-4 text-center">
                    {isHot ? (
                      <Flame className="w-5 h-5 text-red-500 inline" />
                    ) : (
                      <div className="w-5 h-5 inline" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span>Rising: Topics with trend &gt; 5%</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500" />
            <span>Hot: Topics exceeding average mentions by 50%+</span>
          </div>
        </div>
      </div>
    </div>
  );
};

TrendingTopicsTable.displayName = 'TrendingTopicsTable';

export default TrendingTopicsTable;
