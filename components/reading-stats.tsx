'use client';

/**
 * ReadingStats Component - Fully Reusable
 * Displays reading statistics in a card grid
 * 
 * @example Basic usage
 * <ReadingStats stats={statsData} />
 * 
 * @example Custom layout
 * <ReadingStats 
 *   stats={statsData}
 *   columns={2}
 *   variant="compact"
 * />
 * 
 * @example With custom stat items
 * <ReadingStats 
 *   stats={statsData}
 *   customStatItems={[
 *     { key: 'customStat', title: 'Custom', icon: Star, color: 'text-purple-500' }
 *   ]}
 * />
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Flame, 
  BookOpen, 
  Clock, 
  TrendingUp, 
  Trophy,
  Target,
  Calendar,
  type LucideIcon 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES - All exported for reusability
// ============================================================================

/** Stats data structure */
export interface ReadingStatsData {
  totalPages: number;
  totalBooks: number;
  totalMinutes: number;
  streak: number;
  pagesPerDay: number;
  year: number;
  /** Additional custom stats */
  [key: string]: number | string | undefined;
}

/** Single stat item configuration */
export interface StatItem {
  /** Unique key for the stat */
  key: string;
  /** Display title */
  title: string;
  /** Icon component */
  icon: LucideIcon;
  /** Tailwind color class */
  color: string;
  /** Value formatter */
  formatValue?: (value: any, stats: ReadingStatsData) => string;
  /** Description formatter */
  formatDescription?: (value: any, stats: ReadingStatsData) => string;
  /** Static description if no formatter */
  description?: string;
  /** Hide if value is zero/empty */
  hideIfEmpty?: boolean;
}

/** Visual variants */
export type ReadingStatsVariant = 'default' | 'compact' | 'minimal' | 'detailed';

/** Props for ReadingStats component */
export interface ReadingStatsProps {
  /** Stats data to display */
  stats: ReadingStatsData | null;
  /** Visual variant */
  variant?: ReadingStatsVariant;
  /** Number of columns in grid */
  columns?: 2 | 3 | 4;
  /** Show only specific stats */
  showStats?: string[];
  /** Hide specific stats */
  hideStats?: string[];
  /** Custom stat items to add/override */
  customStatItems?: StatItem[];
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Show year in stats */
  showYear?: boolean;
  /** Additional class names */
  className?: string;
  /** Card class names */
  cardClassName?: string;
  /** Click handler for stat cards */
  onStatClick?: (key: string, value: any) => void;
}

// ============================================================================
// UTILITIES - All exported for external use
// ============================================================================

/** Default stat items configuration */
export const DEFAULT_STAT_ITEMS: StatItem[] = [
  {
    key: 'streak',
    title: 'Reading Streak',
    icon: Flame,
    color: 'text-orange-500',
    formatValue: (value) => `${value} days`,
    description: 'Keep it up!',
  },
  {
    key: 'totalBooks',
    title: 'Books Read',
    icon: Trophy,
    color: 'text-yellow-500',
    formatValue: (value) => String(value),
    formatDescription: (_, stats) => `In ${stats.year}`,
  },
  {
    key: 'totalPages',
    title: 'Pages Read',
    icon: BookOpen,
    color: 'text-blue-500',
    formatValue: (value) => value.toLocaleString(),
    description: 'Total pages',
  },
  {
    key: 'pagesPerDay',
    title: 'Reading Speed',
    icon: TrendingUp,
    color: 'text-green-500',
    formatValue: (value) => String(value),
    description: 'Pages per day',
  },
  {
    key: 'totalMinutes',
    title: 'Time Reading',
    icon: Clock,
    color: 'text-purple-500',
    formatValue: (value) => {
      const hours = Math.floor(value / 60);
      const mins = value % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    },
    description: 'Total time',
    hideIfEmpty: true,
  },
];

/**
 * Get grid columns class based on column count
 */
export function getGridColumnsClass(columns: 2 | 3 | 4): string {
  const classes: Record<number, string> = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };
  return classes[columns] || classes[4];
}

/**
 * Format stat value with fallback
 */
export function formatStatValue(
  value: any,
  item: StatItem,
  stats: ReadingStatsData
): string {
  if (item.formatValue) {
    return item.formatValue(value, stats);
  }
  return String(value ?? 0);
}

/**
 * Get stat description
 */
export function getStatDescription(
  value: any,
  item: StatItem,
  stats: ReadingStatsData
): string {
  if (item.formatDescription) {
    return item.formatDescription(value, stats);
  }
  return item.description || '';
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ReadingStats({
  stats,
  variant = 'default',
  columns = 4,
  showStats,
  hideStats,
  customStatItems,
  loading = false,
  emptyMessage = 'No reading stats available',
  showYear = true,
  className,
  cardClassName,
  onStatClick,
}: ReadingStatsProps) {
  // Loading state
  if (loading) {
    return (
      <div className={cn("grid gap-4", getGridColumnsClass(columns), className)}>
        {[...Array(columns)].map((_, i) => (
          <Card key={i} className={cn("animate-pulse", cardClassName)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded mb-2" />
              <div className="h-3 w-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // No stats state
  if (!stats) {
    return (
      <Card className={cn(cardClassName, className)}>
        <CardContent className="py-8 text-center text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  // Merge default and custom stat items
  let statItems = [...DEFAULT_STAT_ITEMS];
  if (customStatItems) {
    // Override existing items or add new ones
    customStatItems.forEach((customItem) => {
      const existingIndex = statItems.findIndex((item) => item.key === customItem.key);
      if (existingIndex >= 0) {
        statItems[existingIndex] = { ...statItems[existingIndex], ...customItem };
      } else {
        statItems.push(customItem);
      }
    });
  }

  // Filter stat items
  if (showStats) {
    statItems = statItems.filter((item) => showStats.includes(item.key));
  }
  if (hideStats) {
    statItems = statItems.filter((item) => !hideStats.includes(item.key));
  }

  // Filter empty stats if configured
  statItems = statItems.filter((item) => {
    if (item.hideIfEmpty) {
      const value = stats[item.key];
      return value !== undefined && value !== 0 && value !== '';
    }
    return true;
  });

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <div className={cn("flex flex-wrap gap-4", className)}>
        {statItems.map((item) => {
          const value = stats[item.key];
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50",
                onStatClick && "cursor-pointer hover:bg-muted"
              )}
              onClick={() => onStatClick?.(item.key, value)}
            >
              <Icon className={cn("h-4 w-4", item.color)} />
              <span className="font-semibold">{formatStatValue(value, item, stats)}</span>
              <span className="text-xs text-muted-foreground">{item.title}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn("grid gap-3", getGridColumnsClass(columns), className)}>
        {statItems.map((item) => {
          const value = stats[item.key];
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border bg-card",
                onStatClick && "cursor-pointer hover:bg-muted/50 transition-colors"
              )}
              onClick={() => onStatClick?.(item.key, value)}
            >
              <Icon className={cn("h-5 w-5", item.color)} />
              <div>
                <p className="font-bold">{formatStatValue(value, item, stats)}</p>
                <p className="text-xs text-muted-foreground">{item.title}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Default variant (cards)
  return (
    <div className={cn("grid gap-4", getGridColumnsClass(columns), className)}>
      {statItems.map((item) => {
        const value = stats[item.key];
        const Icon = item.icon;
        return (
          <Card
            key={item.key}
            className={cn(
              cardClassName,
              onStatClick && "cursor-pointer hover:shadow-md transition-shadow"
            )}
            onClick={() => onStatClick?.(item.key, value)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <Icon className={cn("h-4 w-4", item.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatStatValue(value, item, stats)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {getStatDescription(value, item, stats)}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
