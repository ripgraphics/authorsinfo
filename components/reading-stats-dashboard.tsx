'use client';

/**
 * ReadingStatsDashboard Component
 * Comprehensive reading statistics display
 */

import React from 'react';
import { ReadingAnalytics, TimeDistribution, DayDistribution } from '@/types/phase3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Clock,
  Zap,
  TrendingUp,
  Flame,
  Calendar,
  Target,
  Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReadingStatsDashboardProps {
  stats: ReadingAnalytics | null;
  timeDistribution?: TimeDistribution[];
  dayDistribution?: DayDistribution[];
  loading?: boolean;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function ReadingStatsDashboard({
  stats,
  timeDistribution = [],
  dayDistribution = [],
  loading = false,
}: ReadingStatsDashboardProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="h-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No Reading Data</h3>
          <p className="text-muted-foreground text-sm">
            Start logging your reading sessions to see your stats!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Find peak reading hour
  const peakHour = timeDistribution.reduce((max, curr) => 
    curr.sessionCount > (max?.sessionCount || 0) ? curr : max, 
    null as TimeDistribution | null
  );

  // Find peak day
  const peakDay = dayDistribution.reduce((max, curr) =>
    curr.sessionCount > (max?.sessionCount || 0) ? curr : max,
    null as DayDistribution | null
  );

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Books */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{stats.totalBooksRead}</p>
                <p className="text-sm text-muted-foreground">Books Completed</p>
              </div>
              <BookOpen className="h-10 w-10 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* Total Pages */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{stats.totalPagesRead.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Pages Read</p>
              </div>
              <Target className="h-10 w-10 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* Time Read */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">
                  {Math.round(stats.totalMinutesRead / 60)}h
                </p>
                <p className="text-sm text-muted-foreground">Time Reading</p>
              </div>
              <Clock className="h-10 w-10 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{stats.currentStreak}</p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </div>
              <Flame className={cn(
                "h-10 w-10 opacity-80",
                stats.currentStreak > 0 ? "text-orange-500" : "text-muted-foreground"
              )} />
            </div>
            {stats.longestStreak > stats.currentStreak && (
              <p className="text-xs text-muted-foreground mt-2">
                Best: {stats.longestStreak} days
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Speed & Session Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Reading Speed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Words per minute</span>
              <Badge variant="secondary" className="text-lg font-bold">
                {stats.estimatedWordsPerMinute} WPM
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pages per minute</span>
              <span className="font-medium">{stats.avgPagesPerMinute.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Avg session length</span>
              <span className="font-medium">{Math.round(stats.avgMinutesPerSession)} min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Avg pages per session</span>
              <span className="font-medium">{Math.round(stats.avgPagesPerSession)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Reading Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Peak hour</span>
              <Badge variant="outline">
                {formatHour(stats.mostActiveHour)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Peak day</span>
              <Badge variant="outline">
                {DAYS_OF_WEEK[stats.mostActiveDayOfWeek]}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Preferred format</span>
              <Badge variant="outline" className="capitalize">
                {stats.preferredFormat}
              </Badge>
            </div>
            {stats.preferredLocation && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Favorite spot</span>
                <Badge variant="outline" className="capitalize">
                  {stats.preferredLocation}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Time Distribution Chart */}
      {timeDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              Reading by Hour
            </CardTitle>
            <CardDescription>
              When you read most during the day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-32">
              {timeDistribution.map((hour) => {
                const maxSessions = Math.max(...timeDistribution.map(h => h.sessionCount), 1);
                const height = (hour.sessionCount / maxSessions) * 100;
                
                return (
                  <div
                    key={hour.hour}
                    className="flex-1 group relative"
                  >
                    <div
                      className={cn(
                        'w-full rounded-t transition-colors',
                        hour.sessionCount > 0 ? 'bg-primary/70 hover:bg-primary' : 'bg-muted'
                      )}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                      {formatHour(hour.hour)}: {hour.sessionCount} sessions
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>11 PM</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day Distribution */}
      {dayDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Reading by Day
            </CardTitle>
            <CardDescription>
              Your reading activity throughout the week
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dayDistribution.map((day) => {
              const maxSessions = Math.max(...dayDistribution.map(d => d.sessionCount), 1);
              const percentage = (day.sessionCount / maxSessions) * 100;
              
              return (
                <div key={day.day} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="w-24">{day.dayName}</span>
                    <span className="text-muted-foreground">
                      {day.sessionCount} sessions • {day.totalPages} pages
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper function to format hour
function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}
