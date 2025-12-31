/**
 * Reading Streak API
 * GET /api/reading-streak - Get dedicated streak statistics
 * 
 * Returns detailed streak information including:
 * - Current streak (consecutive days)
 * - Longest streak (all time)
 * - Last read date
 * - Streak history for visualization
 * - Days until streak breaks
 */

import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Helper function to get date string in YYYY-MM-DD format
function getDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Helper function to get consecutive days
function getConsecutiveDays(dates: string[], fromDate: string): number {
  if (!dates.includes(fromDate)) return 0;
  
  let count = 1;
  let current = new Date(fromDate);
  
  while (true) {
    current.setDate(current.getDate() - 1);
    const prevDateStr = getDateString(current);
    if (dates.includes(prevDateStr)) {
      count++;
    } else {
      break;
    }
  }
  
  return count;
}

// Calculate longest streak from a sorted array of dates
function calculateLongestStreak(sortedDates: string[]): number {
  if (sortedDates.length === 0) return 0;
  if (sortedDates.length === 1) return 1;
  
  let longestStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < sortedDates.length; i++) {
    const current = new Date(sortedDates[i]);
    const previous = new Date(sortedDates[i - 1]);
    const diffDays = Math.round((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentStreak++;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1;
    }
  }
  
  return Math.max(longestStreak, currentStreak);
}

// GET /api/reading-streak - Get reading streak data
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('includeHistory') === 'true';
    const historyDays = parseInt(searchParams.get('historyDays') || '90');

    // Get all sessions to calculate streak
    const { data: sessions, error: sessionsError } = await supabase
      .from('reading_sessions')
      .select('started_at')
      .eq('user_id', user.id)
      .order('started_at', { ascending: true });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json({ error: sessionsError.message }, { status: 400 });
    }

    // Get unique dates with reading sessions
    const uniqueDates = Array.from(new Set(
      (sessions || []).map(s => getDateString(new Date(s.started_at)))
    )).sort();

    // Calculate today and yesterday
    const today = new Date();
    const todayStr = getDateString(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getDateString(yesterday);

    // Get last read date
    const lastReadDate = uniqueDates.length > 0 ? uniqueDates[uniqueDates.length - 1] : null;

    // Calculate current streak
    let currentStreak = 0;
    if (lastReadDate === todayStr) {
      currentStreak = getConsecutiveDays(uniqueDates, todayStr);
    } else if (lastReadDate === yesterdayStr) {
      currentStreak = getConsecutiveDays(uniqueDates, yesterdayStr);
    }

    // Calculate longest streak
    const longestStreak = calculateLongestStreak(uniqueDates);

    // Calculate streak status
    const readToday = uniqueDates.includes(todayStr);
    const streakAtRisk = !readToday && currentStreak > 0;
    
    // Time until streak breaks (midnight)
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    const msUntilMidnight = endOfDay.getTime() - today.getTime();
    const hoursUntilMidnight = Math.floor(msUntilMidnight / (1000 * 60 * 60));
    const minutesUntilMidnight = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));

    // Build response
    const response: Record<string, any> = {
      success: true,
      data: {
        currentStreak,
        longestStreak,
        lastReadDate,
        readToday,
        streakAtRisk,
        totalReadingDays: uniqueDates.length,
        timeUntilStreakBreaks: streakAtRisk ? {
          hours: hoursUntilMidnight,
          minutes: minutesUntilMidnight,
          formatted: `${hoursUntilMidnight}h ${minutesUntilMidnight}m`,
        } : null,
        streakMessage: getStreakMessage(currentStreak, readToday, streakAtRisk),
      },
    };

    // Include history if requested
    if (includeHistory) {
      const historyStartDate = new Date(today);
      historyStartDate.setDate(historyStartDate.getDate() - historyDays);
      
      const history: { date: string; hadSession: boolean }[] = [];
      const current = new Date(historyStartDate);
      
      while (current <= today) {
        const dateStr = getDateString(current);
        history.push({
          date: dateStr,
          hadSession: uniqueDates.includes(dateStr),
        });
        current.setDate(current.getDate() + 1);
      }
      
      response.data.history = history;
      response.data.historyStats = {
        daysWithSessions: history.filter(h => h.hadSession).length,
        totalDays: history.length,
        percentage: Math.round((history.filter(h => h.hadSession).length / history.length) * 100),
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/reading-streak:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to generate encouraging streak messages
function getStreakMessage(currentStreak: number, readToday: boolean, streakAtRisk: boolean): string {
  if (currentStreak === 0) {
    return "Start your reading streak today! 📚";
  }
  
  if (streakAtRisk) {
    return `⚠️ Read today to maintain your ${currentStreak}-day streak!`;
  }
  
  if (readToday) {
    if (currentStreak === 1) {
      return "Great start! Day 1 complete! 🎉";
    } else if (currentStreak < 7) {
      return `${currentStreak} days strong! Keep it up! 🔥`;
    } else if (currentStreak < 30) {
      return `Amazing! ${currentStreak}-day streak! You're on fire! 🔥🔥`;
    } else if (currentStreak < 100) {
      return `Incredible ${currentStreak}-day streak! You're a reading machine! 📖✨`;
    } else {
      return `LEGENDARY ${currentStreak}-day streak! Absolutely incredible! 🏆👑`;
    }
  }
  
  return `${currentStreak}-day streak`;
}

