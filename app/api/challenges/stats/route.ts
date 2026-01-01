import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper';

export const dynamic = 'force-dynamic';

/**
 * GET /api/challenges/stats
 * Get reading statistics for the current user for the current year
 * Uses reading_sessions and reading_progress tables as source of truth
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const currentYear = new Date().getFullYear();
    const yearStart = `${currentYear}-01-01T00:00:00Z`;
    const yearEnd = `${currentYear}-12-31T23:59:59Z`;

    // 1. Get reading sessions for the current year (source of truth for pages/minutes)
    // Schema from migration 20251226_phase_3_reading_analytics.sql:
    // reading_sessions has columns: id, user_id, book_id, session_date, pages_started_at, pages_ended_at,
    // pages_read, duration_minutes, reading_speed_ppm, mood, notes, location, created_at, updated_at
    const { data: sessions, error: sessionsError } = await supabase
      .from('reading_sessions')
      .select('pages_read, duration_minutes, session_date')
      .eq('user_id', userId)
      .gte('session_date', yearStart)
      .lte('session_date', yearEnd)
      .order('session_date', { ascending: false });

    if (sessionsError) {
      // Check if this is a schema mismatch error
      if (sessionsError.code === '42703' || sessionsError.message?.includes('does not exist')) {
        console.error('Database schema mismatch detected:', {
          error: sessionsError.message,
          code: sessionsError.code,
          hint: 'The reading_sessions table may be missing required columns. Please run migration: supabase/migrations/20251226_phase_3_reading_analytics.sql'
        });
        return NextResponse.json(
          { 
            error: 'Database schema mismatch',
            message: 'The reading_sessions table is missing required columns. This indicates the database migration has not been applied.',
            details: sessionsError.message,
            code: sessionsError.code,
            action: 'Please run the migration: supabase/migrations/20251226_phase_3_reading_analytics.sql',
            migrationFile: '20251226_phase_3_reading_analytics.sql'
          },
          { status: 500 }
        );
      }
      
      // Table doesn't exist
      if (sessionsError.code === '42P01') {
        console.error('Table does not exist:', {
          error: sessionsError.message,
          hint: 'The reading_sessions table has not been created. Please run migration: supabase/migrations/20251226_phase_3_reading_analytics.sql'
        });
        return NextResponse.json(
          { 
            error: 'Table does not exist',
            message: 'The reading_sessions table has not been created in the database.',
            details: sessionsError.message,
            code: sessionsError.code,
            action: 'Please run the migration: supabase/migrations/20251226_phase_3_reading_analytics.sql',
            migrationFile: '20251226_phase_3_reading_analytics.sql'
          },
          { status: 500 }
        );
      }
      
      console.error('Error fetching reading sessions:', {
        message: sessionsError.message,
        details: sessionsError.details,
        hint: sessionsError.hint,
        code: sessionsError.code,
        userId,
        yearStart,
        yearEnd
      });
      return NextResponse.json(
        { 
          error: 'Failed to fetch reading sessions', 
          details: sessionsError.message || 'Unknown database error',
          code: sessionsError.code
        },
        { status: 500 }
      );
    }

    const filteredSessions = sessions || [];

    // 2. Get completed books for the current year (source of truth for books)
    const { data: readingProgress, error: progressError } = await supabase
      .from('reading_progress')
      .select('id, status, updated_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('updated_at', yearStart)
      .lte('updated_at', yearEnd);

    if (progressError) {
      console.error('Error fetching reading progress:', progressError);
      return NextResponse.json(
        { error: 'Failed to fetch reading progress', details: progressError.message },
        { status: 500 }
      );
    }

    // 3. Calculate statistics from sessions
    const sessionsData = filteredSessions;
    const totalPages = sessionsData.reduce((sum, session: any) => sum + (session.pages_read || 0), 0);
    const totalMinutes = sessionsData.reduce((sum, session: any) => sum + (session.duration_minutes || 0), 0);
    const totalBooks = readingProgress?.length || 0;

    // 4. Calculate reading streak from sessions
    let streak = 0;
    if (sessionsData.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get unique dates from sessions, sorted descending
      const uniqueDates = Array.from(
        new Set(
          sessionsData.map((s: any) => {
            const d = new Date(s.session_date);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
          })
        )
      ).sort((a, b) => b - a);

      if (uniqueDates.length > 0) {
        const mostRecentDate = uniqueDates[0];
        const diffDays = Math.floor((today.getTime() - mostRecentDate) / (1000 * 60 * 60 * 24));
        
        // If most recent reading was today or yesterday, calculate streak
        if (diffDays <= 1) {
          streak = 1;
          // Count consecutive days
          for (let i = 0; i < uniqueDates.length - 1; i++) {
            const current = uniqueDates[i];
            const next = uniqueDates[i + 1];
            const dayDiff = (current - next) / (1000 * 60 * 60 * 24);
            if (dayDiff === 1) {
              streak++;
            } else {
              break;
            }
          }
        }
      }
    }

    // 5. Calculate reading speed (pages per day) for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSessions = sessionsData.filter((s: any) => 
      new Date(s.session_date) >= thirtyDaysAgo
    );
    const recentPages = recentSessions.reduce((sum, session: any) => sum + (session.pages_read || 0), 0);
    const pagesPerDay = recentSessions.length > 0 
      ? Math.round((recentPages / 30) * 10) / 10 
      : 0;

    return NextResponse.json({
      totalPages,
      totalBooks,
      totalMinutes,
      streak,
      pagesPerDay,
      year: currentYear
    });

  } catch (error: any) {
    console.error('Error fetching reading stats:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

