'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Dashboard skeleton loader for initial page load
 * Shows placeholder UI while data is loading
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-4 border-b">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-32" />
        ))}
      </div>

      {/* Content area */}
      <TabContentSkeleton />
    </div>
  );
}

/**
 * Skeleton for tab content area
 */
export function TabContentSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="mt-2 h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <ChartSkeleton key={i} />
        ))}
      </div>

      {/* Additional charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <ChartSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for chart components
 */
export function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-1 h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
          <div className="mt-6 h-48 bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for table/list content
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 border-b pb-4">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for filter section
 */
export function FilterSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for analytics summary
 */
export function AnalyticsSummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Skeleton for detail page
 */
export function DetailPageSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Content grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j}>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="mt-1 h-4 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for moderation queue
 */
export function ModerationQueueSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter section */}
      <FilterSkeleton />

      {/* Queue items */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for audit logs
 */
export function AuditLogsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter section */}
      <FilterSkeleton />

      {/* Logs table */}
      <Card>
        <CardContent className="pt-4">
          <TableSkeleton rows={10} />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Spinner/Loading indicator
 */
export function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

/**
 * Minimal loading state
 */
export function MiniLoadingSpinner() {
  return (
    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
  );
}

/**
 * Card skeleton for generic use
 */
export function CardSkeleton({
  header = true,
  lines = 3,
  className = '',
}: {
  header?: boolean;
  lines?: number;
  className?: string;
}) {
  return (
    <Card className={className}>
      {header && (
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-1 h-4 w-48" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Hook to conditionally show skeleton
 */
export function useSkeletonLoader(isLoading: boolean, delay = 500) {
  const [showSkeleton, setShowSkeleton] = React.useState(false);

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isLoading) {
      timeout = setTimeout(() => setShowSkeleton(true), delay);
    } else {
      setShowSkeleton(false);
    }

    return () => clearTimeout(timeout);
  }, [isLoading, delay]);

  return showSkeleton;
}
