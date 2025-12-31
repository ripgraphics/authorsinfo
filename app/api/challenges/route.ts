/**
 * Reading Challenges API Routes
 * POST /api/challenges - Create new challenge
 * GET /api/challenges - List user's challenges
 * GET /api/challenges/:id - Get challenge details
 * PATCH /api/challenges/:id - Update challenge
 * DELETE /api/challenges/:id - Delete challenge
 * POST /api/challenges/:id/progress - Log progress
 * GET /api/challenges/leaderboard - Get public challenges
 * GET /api/challenges/templates - Get challenge templates
 */

import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST /api/challenges - Create new challenge
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      title,
      description,
      goalType,
      goalValue,
      startDate,
      endDate,
      isPublic
    } = await request.json();

    // Validate input
    if (!title || !goalType || !goalValue || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['books', 'pages', 'minutes', 'authors'].includes(goalType)) {
      return NextResponse.json(
        { error: 'Invalid goal type' },
        { status: 400 }
      );
    }

    if (goalValue <= 0) {
      return NextResponse.json(
        { error: 'Goal value must be positive' },
        { status: 400 }
      );
    }

    // Use the auth user ID directly - no need to query users table
    const userId = user.id;

    // Create challenge
    // Note: The table has legacy columns (year, target_books, books_read) that are NOT NULL
    // and new columns (challenge_year, goal_type, goal_value, etc.)
    // Parse the startDate correctly to get the year
    const startDateObj = new Date(startDate);
    const challengeYear = startDateObj.getFullYear();
    const { data: challenge, error } = await supabase
      .from('reading_challenges')
      .insert({
        user_id: userId,
        title: title.trim(),
        description: description?.trim() || null,
        goal_type: goalType,
        goal_value: goalValue,
        start_date: startDate,
        end_date: endDate,
        year: challengeYear, // Required NOT NULL legacy column
        target_books: goalType === 'books' ? goalValue : 0, // Required NOT NULL legacy column
        books_read: 0, // Required NOT NULL legacy column (defaults to 0)
        challenge_year: challengeYear, // New column for consistency
        current_value: 0, // Initialize progress
        is_public: isPublic ?? true,
        status: 'active'
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating challenge in database:', error);
      return NextResponse.json(
        { 
          error: 'Failed to create challenge',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: challenge,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/challenges - List user's challenges
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the auth user ID directly - no need to query users table
    const userId = user.id;

    // Get URL params
    const url = new URL(request.url);
    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
    const status = url.searchParams.get('status');

    // Build query using the actual schema
    // The table has both legacy 'year' column and new 'challenge_year' column
    let query = supabase
      .from('reading_challenges')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    // Filter by year - check both challenge_year and year columns
    // PostgREST doesn't support OR easily, so we'll filter in JavaScript if needed
    // For now, prioritize challenge_year, but we'll handle both in the response
    if (!isNaN(year) && year > 0) {
      // Try filtering by challenge_year first
      query = query.eq('challenge_year', year);
    }

    // Apply status filter if provided
    if (status && ['active', 'completed', 'abandoned'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data: challenges, error } = await query;

    if (error) {
      // Check if this is a schema mismatch error
      if (error.code === '42703' || error.message?.includes('does not exist')) {
        console.error('Database schema mismatch detected:', {
          error: error.message,
          code: error.code,
          hint: 'The reading_challenges table may be missing required columns. Please run migration: supabase/migrations/20251226_phase_3_reading_analytics.sql'
        });
        return NextResponse.json(
          { 
            error: 'Database schema mismatch',
            message: 'The reading_challenges table is missing required columns. This indicates the database migration has not been applied.',
            details: error.message,
            code: error.code,
            action: 'Please run the migration: supabase/migrations/20251226_phase_3_reading_analytics.sql',
            migrationFile: '20251226_phase_3_reading_analytics.sql'
          },
          { status: 500 }
        );
      }
      
      // Table doesn't exist
      if (error.code === '42P01') {
        console.error('Table does not exist:', {
          error: error.message,
          hint: 'The reading_challenges table has not been created. Please run migration: supabase/migrations/20251226_phase_3_reading_analytics.sql'
        });
        return NextResponse.json(
          { 
            error: 'Table does not exist',
            message: 'The reading_challenges table has not been created in the database.',
            details: error.message,
            code: error.code,
            action: 'Please run the migration: supabase/migrations/20251226_phase_3_reading_analytics.sql',
            migrationFile: '20251226_phase_3_reading_analytics.sql'
          },
          { status: 500 }
        );
      }
      
      console.error('Error fetching challenges from database:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        userId,
        year,
        status
      });
      return NextResponse.json(
        { 
          error: 'Failed to fetch challenges',
          details: error.message || 'Unknown database error',
          code: error.code
        },
        { status: 500 }
      );
    }

    const challengesData = challenges || [];

    // Add progress percentage and days remaining with proper error handling
    const enrichedChallenges = challengesData.map((challenge: any) => {
      const progressPercentage = challenge.goal_value > 0
        ? Math.min(100, Math.round((challenge.current_value / challenge.goal_value) * 100))
        : 0;
      
      const endDate = new Date(challenge.end_date);
      const now = new Date();
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...challenge,
        progressPercentage,
        daysRemaining: Math.max(0, daysRemaining),
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedChallenges,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

