/**
 * User Badges API Routes
 * GET /api/badges/user - Get current user's badges
 * POST /api/badges/user - Toggle featured badge
 */

import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/badges/user - Get current user's badges with progress
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's earned badges
    const { data: userBadges, error: badgesError } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false });

    if (badgesError) {
      return NextResponse.json({ error: badgesError.message }, { status: 400 });
    }

    // Get all badges to calculate progress
    const { data: allBadges } = await supabase
      .from('badges')
      .select('*')
      .eq('is_active', true);

    // Get user stats for progress calculation
    const { data: readingProgress } = await supabase
      .from('reading_progress')
      .select('id, status')
      .eq('user_id', user.id);

    const { data: challenges } = await supabase
      .from('reading_challenges')
      .select('id, status')
      .eq('user_id', user.id);

    const { data: shelves } = await supabase
      .from('custom_shelves')
      .select('id')
      .eq('user_id', user.id);

    const { data: friends } = await supabase
      .from('user_friends')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    // Calculate current values
    const booksRead = (readingProgress as any[])?.filter(p => p.status === 'completed').length || 0;
    const pagesRead = (readingProgress as any[])?.reduce((sum, p) => sum + (p.current_page || 0), 0) || 0;
    const challengesCompleted = (challenges as any[])?.filter(c => c.status === 'completed').length || 0;
    const shelvesCreated = shelves?.length || 0;
    const friendsCount = friends?.length || 0;

    // Map earned badges
    const earnedBadgeIds = new Set((userBadges as any[])?.map(ub => ub.badge_id) || []);
    
    const mappedUserBadges = (userBadges as any[])?.map((ub: any) => ({
      id: ub.id,
      userId: ub.user_id,
      badgeId: ub.badge_id,
      earnedAt: ub.earned_at,
      isFeatured: ub.is_featured,
      progressValue: ub.progress_value,
      notified: ub.notified,
      badge: ub.badge ? {
        id: ub.badge.id,
        name: ub.badge.name,
        description: ub.badge.description,
        icon: ub.badge.icon,
        category: ub.badge.category,
        tier: ub.badge.tier,
        points: ub.badge.points,
        requirementType: ub.badge.requirement_type,
        requirementValue: ub.badge.requirement_value,
        isSecret: ub.badge.is_secret,
      } : null,
    })) || [];

    // Calculate progress for unearned badges
    const badgeProgress = (allBadges as any[])?.filter(b => !earnedBadgeIds.has(b.id) && !b.is_secret).map((b: any) => {
      let currentValue = 0;
      switch (b.requirement_type) {
        case 'books_read':
          currentValue = booksRead;
          break;
        case 'pages_read':
          currentValue = pagesRead;
          break;
        case 'challenges_completed':
          currentValue = challengesCompleted;
          break;
        case 'shelves_created':
          currentValue = shelvesCreated;
          break;
        case 'friends_count':
          currentValue = friendsCount;
          break;
        default:
          currentValue = 0;
      }

      return {
        badge: {
          id: b.id,
          name: b.name,
          description: b.description,
          icon: b.icon,
          category: b.category,
          tier: b.tier,
          points: b.points,
          requirementType: b.requirement_type,
          requirementValue: b.requirement_value,
        },
        currentValue,
        targetValue: b.requirement_value,
        progressPercent: Math.min(Math.round((currentValue / b.requirement_value) * 100), 100),
        isEarned: false,
      };
    }) || [];

    // Calculate total points
    const totalPoints = mappedUserBadges.reduce((sum, ub) => sum + (ub.badge?.points || 0), 0);

    // Get featured badges
    const featuredBadges = mappedUserBadges.filter(ub => ub.isFeatured);

    return NextResponse.json({
      success: true,
      data: {
        badges: mappedUserBadges,
        featuredBadges,
        totalPoints,
        badgeProgress: badgeProgress.sort((a, b) => b.progressPercent - a.progressPercent).slice(0, 5),
        stats: {
          booksRead,
          pagesRead,
          challengesCompleted,
          shelvesCreated,
          friendsCount,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching user badges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/badges/user - Toggle featured badge
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { badgeId, isFeatured } = await request.json();

    if (!badgeId) {
      return NextResponse.json({ error: 'Badge ID is required' }, { status: 400 });
    }

    // Check if user owns this badge
    const { data: userBadge, error: checkError } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', user.id)
      .eq('badge_id', badgeId)
      .single();

    if (checkError || !userBadge) {
      return NextResponse.json({ error: 'Badge not found' }, { status: 404 });
    }

    // If setting as featured, limit to 3 featured badges
    if (isFeatured) {
      const { data: featuredCount } = await supabase
        .from('user_badges')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('is_featured', true);

      if ((featuredCount?.length || 0) >= 3) {
        return NextResponse.json({ error: 'Maximum 3 featured badges allowed' }, { status: 400 });
      }
    }

    // Update featured status using RPC or raw SQL workaround
    const { error: updateError } = await (supabase as any)
      .from('user_badges')
      .update({ is_featured: isFeatured })
      .eq('id', (userBadge as any).id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating featured badge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

