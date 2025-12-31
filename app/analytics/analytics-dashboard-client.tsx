'use client';

/**
 * Analytics Dashboard Client Component
 * Main reading analytics page bringing all components together
 */

import React, { useEffect, useState } from 'react';
import { useAnalyticsStore } from '@/lib/stores/analytics-store';
import { ReadingStatsDashboard } from '@/components/reading-stats-dashboard';
import { ReadingCalendarHeatmap } from '@/components/reading-calendar-heatmap';
import { SessionLogger } from '@/components/session-logger';
import { StreakCounter } from '@/components/streak-counter';
import { GenreChart } from '@/components/genre-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Calendar,
  Clock,
  Plus,
  BookOpen,
  TrendingUp,
  RefreshCw,
  Flame,
  Target,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { GenreStats, ReadingAnalytics, CalendarDay, TimeDistribution, DayDistribution } from '@/types/phase3';

type TimeRange = 'week' | 'month' | 'year' | 'all';

export function AnalyticsDashboardClient() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [isLoggerOpen, setIsLoggerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const {
    sessions,
    stats,
    calendar,
    genreStats,
    loading,
    fetchSessions,
    fetchStats,
    fetchCalendar,
    fetchGenreStats,
  } = useAnalyticsStore();

  // Get time-based distributions from sessions
  const timeDistribution: TimeDistribution[] = React.useMemo(() => {
    const distribution: Record<number, { sessionCount: number; totalMinutes: number; totalPages: number }> = {};
    
    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      distribution[i] = { sessionCount: 0, totalMinutes: 0, totalPages: 0 };
    }
    
    sessions.forEach(session => {
      const date = new Date(session.startedAt);
      const hour = date.getHours();
      distribution[hour].sessionCount++;
      distribution[hour].totalMinutes += session.durationMinutes || 0;
      distribution[hour].totalPages += session.pagesRead;
    });
    
    const totalSessions = sessions.length || 1;
    return Object.entries(distribution)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        sessionCount: data.sessionCount,
        totalPages: data.totalPages,
        percentage: (data.sessionCount / totalSessions) * 100,
      }))
      .sort((a, b) => a.hour - b.hour);
  }, [sessions]);

  const dayDistribution: DayDistribution[] = React.useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const distribution: Record<number, { sessionCount: number; totalPages: number }> = {};
    
    // Initialize all days
    for (let i = 0; i < 7; i++) {
      distribution[i] = { sessionCount: 0, totalPages: 0 };
    }
    
    sessions.forEach(session => {
      const date = new Date(session.startedAt);
      const day = date.getDay();
      distribution[day].sessionCount++;
      distribution[day].totalPages += session.pagesRead;
    });
    
    const totalSessions = sessions.length || 1;
    return Object.entries(distribution)
      .map(([day, data]) => ({
        day: parseInt(day),
        dayName: days[parseInt(day)],
        sessionCount: data.sessionCount,
        totalPages: data.totalPages,
        percentage: (data.sessionCount / totalSessions) * 100,
      }))
      .sort((a, b) => a.day - b.day);
  }, [sessions]);

  // Fetch data on mount and when time range changes
  useEffect(() => {
    const now = new Date();
    let startDate: Date | undefined;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
      default:
        startDate = undefined;
    }

    fetchSessions({ startDate: startDate?.toISOString() });
    fetchStats();
    fetchCalendar(now.getFullYear());
    fetchGenreStats();
  }, [timeRange, refreshKey, fetchSessions, fetchStats, fetchCalendar, fetchGenreStats]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSessionLogged = () => {
    setIsLoggerOpen(false);
    handleRefresh();
  };

  const handleDayClick = (day: CalendarDay) => {
    console.log('Day clicked:', day);
    // Could open a modal with day details
  };

  // Calculate quick stats for the header
  const todaysSessions = sessions.filter(s => {
    const today = new Date().toDateString();
    return new Date(s.startedAt).toDateString() === today;
  });
  const todaysPages = todaysSessions.reduce((sum, s) => sum + s.pagesRead, 0);
  const todaysMinutes = todaysSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Reading Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your reading habits and discover insights
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
          
          <Dialog open={isLoggerOpen} onOpenChange={setIsLoggerOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Log Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Log Reading Session</DialogTitle>
              </DialogHeader>
              <SessionLogger onSessionCreated={handleSessionLogged} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Today's Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Sessions</p>
                <p className="text-2xl font-bold">{todaysSessions.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pages Today</p>
                <p className="text-2xl font-bold">{todaysPages}</p>
              </div>
              <Target className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Minutes Today</p>
                <p className="text-2xl font-bold">{todaysMinutes}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{stats?.currentStreak || 0}</p>
              </div>
              <Flame className={cn(
                "h-8 w-8 opacity-80",
                (stats?.currentStreak || 0) > 0 ? "text-orange-500" : "text-muted-foreground"
              )} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="genres" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Genres</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Sessions</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Streak Counter */}
          {stats && (
            <StreakCounter
              currentStreak={stats.currentStreak}
              longestStreak={stats.longestStreak}
              lastReadDate={stats.lastReadDate ? stats.lastReadDate.toString() : null}
              showMilestones
            />
          )}
          
          {/* Reading Stats Dashboard */}
          <ReadingStatsDashboard
            stats={stats}
            timeDistribution={timeDistribution}
            dayDistribution={dayDistribution}
            loading={loading}
          />
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <ReadingCalendarHeatmap
            data={calendar}
          />
        </TabsContent>

        {/* Genres Tab */}
        <TabsContent value="genres" className="space-y-6">
          <GenreChart
            data={genreStats}
            loading={loading}
            showTopAuthors
          />
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>
                Your reading sessions from the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No sessions yet</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Start logging your reading sessions to track your progress
                  </p>
                  <Button onClick={() => setIsLoggerOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Log Your First Session
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.slice(0, 20).map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {session.pagesRead} pages read
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.startedAt).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {session.durationMinutes && (
                          <Badge variant="secondary">
                            {session.durationMinutes} min
                          </Badge>
                        )}
                        {session.sessionMood && (
                          <Badge variant="outline" className="capitalize">
                            {session.sessionMood}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {sessions.length > 20 && (
                    <p className="text-center text-sm text-muted-foreground pt-4">
                      Showing 20 of {sessions.length} sessions
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
