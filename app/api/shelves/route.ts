/**
 * Custom Bookshelves API Routes
 * POST /api/shelves - Create shelf
 * GET /api/shelves - List user's shelves
 * PATCH /api/shelves/reorder - Reorder shelves
 * GET /api/shelves/:id - Get shelf details
 * PATCH /api/shelves/:id - Update shelf
 * DELETE /api/shelves/:id - Delete shelf
 * POST /api/shelves/:id/books - Add book to shelf
 * DELETE /api/shelves/:id/books/:bookId - Remove book from shelf
 * PATCH /api/shelves/:id/books/:bookId - Update book position
 */

import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST /api/shelves - Create a new shelf
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, icon, color, isPublic } = await request.json();

    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Shelf name is required' },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Shelf name must be 100 characters or less' },
        { status: 400 }
      );
    }

    // Get user ID from session
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get next display order
    const { data: shelves } = await supabase
      .from('custom_shelves')
      .select('display_order')
      .eq('user_id', userData.id)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = (shelves?.[0]?.display_order ?? -1) + 1;

    // Create shelf
    const { data: newShelf, error } = await supabase
      .from('custom_shelves')
      .insert({
        user_id: userData.id,
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || null,
        color: color || '#3B82F6',
        is_public: isPublic !== undefined ? isPublic : true,
        display_order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to create shelf' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: newShelf,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating shelf:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/shelves - List user's shelves
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: shelves, error } = await supabase
      .from('custom_shelves')
      .select('*')
      .eq('user_id', userData.id)
      .order('display_order');

    if
