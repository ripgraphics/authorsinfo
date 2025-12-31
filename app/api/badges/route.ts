/**
 * Badges API Routes
 * GET /api/badges - List all available badges
 * GET /api/badges/user - Get current user's badges
 * GET /api/badges/user/:userId - Get specific user's badges
 * POST /api/badges/feature - Toggle featured badge
 */

import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/badges - List all available badges
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const tier = url.searchParams.get('tier');

    let query = supabase
      .from('badges')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('points');

    if (category) {
      query = query.eq('category', category);
    }
    if (tier) {
      query = query.eq('tier', tier);
    }

    const { data: badges, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Map to camelCase
    const mappedBadges = badges.map((b: any) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      icon: b.icon,
      category: b.category,
      tier: b.tier,
      points: b.points,
      requirementType: b.requirement_type,
      requirementValue: b.requirement_value,
      isSecret: b.is_secret,
      isActive: b.is_active,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: mappedBadges,
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

