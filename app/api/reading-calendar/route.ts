/**
 * Reading Calendar API
 * GET /api/reading-calendar - Get calendar heatmap data
 */

import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/reading-calendar - Get calendar heatmap data
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const months = parseInt(searchParams.get('months') || '12');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);

    // Get all sessions in range
    const { data: sessions, error } = await supabase
      .from('reading_sessions')
      .select('started_at, pages_read, duration_minutes')
      .eq('user_id', user.id)
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString());

    if (error) {
      console.error('Error fetching calendar data:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Aggregate by date
    const dateMap: Record<string, { totalPages: number; totalMinutes: number; sessionCount: number }> = {};

    sessions?.forEach((s: any) => {
      const date = new Date(s.started_at);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { totalPages: 0, totalMinutes: 0, sessionCount: 0 };
      }
      
      dateMap[dateStr].totalPages += s.pages_read || 0;
      dateMap[dateStr].totalMinutes += s.duration_minutes || 0;
      dateMap[dateStr].sessionCount += 1;
    });

    // Find max for intensity calculation
    const maxPages = Math.max(...Object.values(dateMap).map(d => d.totalPages), 1);

    // Convert to array with intensity levels
    const calendarData = Object.entries(dateMap).map(([date, stats]) => ({
      date,
      totalPages: stats.totalPages,
      totalMinutes: stats.totalMinutes,
      sessionCount: stats.sessionCount,
      intensityLevel: calculateIntensity(stats.totalPages, maxPages),
    }));

    // Calculate summary stats
    const totalDaysRead = calendarData.length;
    const totalPages = calendarData.reduce((sum, d) => sum + d.totalPages, 0);
    const totalMinutes = calendarData.reduce((sum, d) => sum + d.totalMinutes, 0);
    const avgPagesPerDay = totalDaysRead > 0 ? totalPages / totalDaysRead : 0;

    // Find best day
    const bestDay = calendarData.reduce((best, current) => 
      current.totalPages > (best?.totalPages || 0) ? current : best, 
      null as typeof calendarData[0] | null
    );

    // Calculate streak info
    const sortedDates = calendarData.map(d => d.date).sort();
    const { currentStreak, longestStreak } = calculateStreakFromDates(sortedDates);

    return NextResponse.json({
      success: true,
      data: {
        calendar: calendarData.sort((a, b) => a.date.localeCompare(b.date)),
        summary: {
          totalDaysRead,
          totalPages,
          totalMinutes,
          avgPagesPerDay: Math.round(avgPagesPerDay * 10) / 10,
          currentStreak,
          longestStreak,
          bestDay: bestDay ? {
            date: bestDay.date,
            pages: bestDay.totalPages,
            minutes: bestDay.totalMinutes,
          } : null,
        },
        range: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      },
    });
  } catch (error) {
    console.error('Error in GET /api/reading-calendar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Calculate intensity level (0-4) for heatmap coloring
function calculateIntensity(pages: number, maxPages: number): number {
  if (pages === 0) return 0;
  const ratio = pages / maxPages;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

// Calculate streak from sorted date strings
function calculateStreakFromDates(dates: string[]): { currentStreak: number; longestStreak: number } {
  if (dates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const reversedDates = [...dates].sort().reverse();
  const lastDate = reversedDates[0];

  // Current streak
  let currentStreak = 0;
  if (lastDate === todayStr || lastDate === yesterdayStr) {
    currentStreak = 1;
    let checkDate = new Date(lastDate);
    
    for (let i = 1; i < reversedDates.length; i++) {
      checkDate.setDate(checkDate.getDate() - 1);
      const checkStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      
      if (reversedDates.includes(checkStr)) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Longest streak
  const sortedDates = [...dates].sort();
  let longestStreak = 0;
  let tempStreak = 1;
  
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const current = new Date(sortedDates[i]);
    const next = new Date(sortedDates[i + 1]);
    const diffDays = Math.round((next.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
}

