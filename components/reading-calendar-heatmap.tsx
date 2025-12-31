'use client';

/**
 * ReadingCalendarHeatmap Component
 * GitHub-style activity calendar for reading tracking
 */

import React, { useMemo } from 'react';
import { CalendarDay } from '@/types/phase3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Calendar, Flame, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReadingCalendarHeatmapProps {
  data: CalendarDay[];
  months?: number;
  showLegend?: boolean;
  showStats?: boolean;
}

const INTENSITY_COLORS = [
  'bg-muted',           // 0 - no activity
  'bg-green-200',       // 1 - low
  'bg-green-300',       // 2 - medium-low
  'bg-green-500',       // 3 - medium-high
  'bg-green-700',       // 4 - high
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ReadingCalendarHeatmap({
  data,
  months = 12,
  showLegend = true,
  showStats = true,
}: ReadingCalendarHeatmapProps) {
  // Create a map for quick lookup
  const dataMap = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    data.forEach(d => map.set(d.date, d));
    return map;
  }, [data]);

  // Generate calendar grid
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    
    // Adjust to start of week (Sunday)
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const weeks: { date: Date; data: CalendarDay | null }[][] = [];
    const monthLabels: { month: string; weekIndex: number }[] = [];
    
    let currentDate = new Date(startDate);
    let currentWeek: { date: Date; data: CalendarDay | null }[] = [];
    let lastMonth = -1;

    while (currentDate <= today) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      
      // Track month changes for labels
      if (currentDate.getMonth() !== lastMonth && currentDate.getDate() <= 7) {
        monthLabels.push({
          month: MONTHS[currentDate.getMonth()],
          weekIndex: weeks.length,
        });
        lastMonth = currentDate.getMonth();
      }

      currentWeek.push({
        date: new Date(currentDate),
        data: dataMap.get(dateStr) || null,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Push remaining days
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: new Date(currentDate), data: null });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(currentWeek);
    }

    return { weeks, monthLabels };
  }, [dataMap, months]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalDays = data.length;
    const totalPages = data.reduce((sum, d) => sum + d.totalPages, 0);
    const totalMinutes = data.reduce((sum, d) => sum + d.totalMinutes, 0);
    const avgPagesPerDay = totalDays > 0 ? Math.round(totalPages / totalDays) : 0;

    // Calculate current streak
    let currentStreak = 0;
    const sortedDates = [...data].sort((a, b) => b.date.localeCompare(a.date));
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (sortedDates.length > 0 && (sortedDates[0].date === todayStr || sortedDates[0].date === yesterdayStr)) {
      currentStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const current = new Date(sortedDates[i - 1].date);
        const prev = new Date(sortedDates[i].date);
        const diffDays = Math.round((current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return { totalDays, totalPages, totalMinutes, avgPagesPerDay, currentStreak };
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Reading Activity
            </CardTitle>
            <CardDescription>
              Your reading history over the past {months} months
            </CardDescription>
          </div>
          {stats.currentStreak > 0 && (
            <div className="flex items-center gap-2 text-orange-500">
              <Flame className="h-5 w-5" />
              <span className="font-bold">{stats.currentStreak} day streak</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showStats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalDays}</p>
              <p className="text-xs text-muted-foreground">Days Read</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalPages.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Pages</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{Math.round(stats.totalMinutes / 60)}h</p>
              <p className="text-xs text-muted-foreground">Time Read</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.avgPagesPerDay}</p>
              <p className="text-xs text-muted-foreground">Avg Pages/Day</p>
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-fit">
            {/* Month labels */}
            <div className="flex text-xs text-muted-foreground mb-1 ml-8">
              {monthLabels.map((label, i) => (
                <div
                  key={i}
                  className="w-3"
                  style={{ marginLeft: i === 0 ? 0 : `${(label.weekIndex - (i > 0 ? monthLabels[i - 1].weekIndex : 0)) * 14 - 14}px` }}
                >
                  {label.month}
                </div>
              ))}
            </div>

            <div className="flex gap-1">
              {/* Day labels */}
              <div className="flex flex-col gap-1 text-xs text-muted-foreground pr-2">
                {DAYS_OF_WEEK.map((day, i) => (
                  <div key={day} className="h-3 flex items-center" style={{ display: i % 2 === 1 ? 'flex' : 'none' }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              <TooltipProvider>
                <div className="flex gap-1">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1">
                      {week.map((day, dayIndex) => {
                        const intensity = day.data?.intensityLevel || 0;
                        const isToday = day.date.toDateString() === new Date().toDateString();
                        const isFuture = day.date > new Date();

                        return (
                          <Tooltip key={dayIndex}>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  'w-3 h-3 rounded-sm cursor-pointer transition-colors',
                                  isFuture ? 'bg-muted/30' : INTENSITY_COLORS[intensity],
                                  isToday && 'ring-2 ring-primary ring-offset-1'
                                )}
                              />
                            </TooltipTrigger>
                            {!isFuture && (
                              <TooltipContent>
                                <div className="text-sm">
                                  <p className="font-medium">
                                    {day.date.toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </p>
                                  {day.data ? (
                                    <>
                                      <p className="flex items-center gap-1">
                                        <BookOpen className="h-3 w-3" />
                                        {day.data.totalPages} pages
                                      </p>
                                      <p>{day.data.sessionCount} session(s)</p>
                                    </>
                                  ) : (
                                    <p className="text-muted-foreground">No reading</p>
                                  )}
                                </div>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
            <span>Less</span>
            {INTENSITY_COLORS.map((color, i) => (
              <div
                key={i}
                className={cn('w-3 h-3 rounded-sm', color)}
              />
            ))}
            <span>More</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
