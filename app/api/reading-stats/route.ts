/**
 * Reading Stats API
 * GET /api/reading-stats - Get comprehensive reading statistics
 */

import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/reading-stats - Get reading statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all_time'; // daily, weekly, monthly, yearly, all_time

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'daily':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'yearly':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date('1900-01-01');
    }

    // Get sessions within period
    const { data: sessions, error: sessionsError } = await (supabase.from('reading_sessions') as any)
      .select('*')
      .eq('user_id', user.id)
      .gte('started_at', startDate.toISOString());

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json({ error: sessionsError.message }, { status: 400 });
    }

    // Get completed books
    const { data: readingProgress } = await (supabase.from('reading_progress') as any)
      .select('*')
      .eq('user_id', user.id);

    // Calculate statistics
    const totalSessions = sessions?.length || 0;
    const totalPages = sessions?.reduce((sum: number, s: any) => sum + ((s as any).pages_read || 0), 0) || 0;
    const totalMinutes = sessions?.reduce((sum: number, s: any) => sum + ((s as any).duration_minutes || 0), 0) || 0;
    
    const avgPagesPerSession = totalSessions > 0 ? totalPages / totalSessions : 0;
    const avgMinutesPerSession = totalSessions > 0 ? totalMinutes / totalSessions : 0;
    const avgPagesPerMinute = totalMinutes > 0 ? totalPages / totalMinutes : 0;
    
    // Estimate words per minute (assuming ~250 words per page)
    const estimatedWordsPerMinute = avgPagesPerMinute * 250;

    // Calculate streak
    const { currentStreak, longestStreak, lastReadDate } = calculateStreak(sessions || []);

    // Calculate most active patterns
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<number, number> = {};
    const formatCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};

    sessions?.forEach((s: any) => {
      const date = new Date((s as any).started_at);
      const hour = date.getHours();
      const day = date.getDay();
      
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayCounts[day] = (dayCounts[day] || 0) + 1;
      
      if (s.reading_format) {
        formatCounts[s.reading_format] = (formatCounts[s.reading_format] || 0) + 1;
      }
      if (s.reading_location) {
        locationCounts[s.reading_location] = (locationCounts[s.reading_location] || 0) + 1;
      }
    });

    const mostActiveHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
    const mostActiveDayOfWeek = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
    const preferredFormat = Object.entries(formatCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'physical';
    const preferredLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    // Count books
    const totalBooksRead = readingProgress?.filter((p: any) => (p as any).status === 'completed').length || 0;

    // Time distribution by hour
    const timeDistribution = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      sessionCount: hourCounts[hour] || 0,
      totalPages: sessions?.filter((s: any) => new Date((s as any).started_at).getHours() === hour)
        .reduce((sum: number, s: any) => sum + ((s as any).pages_read || 0), 0) || 0,
      percentage: totalSessions > 0 ? ((hourCounts[hour] || 0) / totalSessions) * 100 : 0,
    }));

    // Day distribution
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayDistribution = Array.from({ length: 7 }, (_, day) => ({
      day,
      dayName: dayNames[day],
      sessionCount: dayCounts[day] || 0,
      totalPages: sessions?.filter((s: any) => new Date((s as any).started_at).getDay() === day)
        .reduce((sum: number, s: any) => sum + ((s as any).pages_read || 0), 0) || 0,
      percentage: totalSessions > 0 ? ((dayCounts[day] || 0) / totalSessions) * 100 : 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        period,
        overview: {
          totalBooksRead,
          totalPagesRead: totalPages,
          totalMinutesRead: totalMinutes,
          totalSessionsLogged: totalSessions,
        },
        speed: {
          avgPagesPerSession: Math.round(avgPagesPerSession * 100) / 100,
          avgMinutesPerSession: Math.round(avgMinutesPerSession * 100) / 100,
          avgPagesPerMinute: Math.round(avgPagesPerMinute * 1000) / 1000,
          estimatedWordsPerMinute: Math.round(estimatedWordsPerMinute),
        },
        streaks: {
          currentStreak,
          longestStreak,
          lastReadDate,
        },
        patterns: {
          mostActiveHour: parseInt(mostActiveHour as string),
          mostActiveDayOfWeek: parseInt(mostActiveDayOfWeek as string),
          preferredFormat,
          preferredLocation,
        },
        distributions: {
          byHour: timeDistribution,
          byDay: dayDistribution,
        },
      },
    });
  } catch (error) {
    console.error('Error in GET /api/reading-stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to calculate reading streak
function calculateStreak(sessions: any[]): { currentStreak: number; longestStreak: number; lastReadDate?: string } {
  if (!sessions || sessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Get unique dates with reading sessions
  const uniqueDates = Array.from(new Set(
    sessions.map(s => {
      const date = new Date(s.started_at);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    })
  )).sort().reverse();

  if (uniqueDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const lastReadDate = uniqueDates[0];
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  // Calculate current streak
  let currentStreak = 0;
  if (lastReadDate === todayStr || lastReadDate === yesterdayStr) {
    currentStreak = 1;
    let checkDate = new Date(lastReadDate);
    
    for (let i = 1; i < uniqueDates.length; i++) {
      checkDate.setDate(checkDate.getDate() - 1);
      const checkStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      
      if (uniqueDates.includes(checkStr)) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;
  
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const current = new Date(uniqueDates[i]);
    const next = new Date(uniqueDates[i + 1]);
    const diffDays = Math.round((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    currentStreak,
    longestStreak,
    lastReadDate,
  };
}

