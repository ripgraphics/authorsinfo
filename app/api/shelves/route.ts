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
    const { data: userData } = await (supabase.from('users') as any)
      .select('id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get next display order
    const { data: shelves } = await (supabase.from('custom_shelves') as any)
      .select('display_order')
      .eq('user_id', (userData as any).id)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = (shelves?.[0]?.display_order ?? -1) + 1;

    // Create shelf
    const { data: newShelf, error } = await (supabase.from('custom_shelves') as any)
      .insert({
        user_id: (userData as any).id,
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Determine which user's shelves to fetch
    let userId: string;
    let isViewingOwnProfile = true;

    if (targetUserId) {
      // Viewing someone else's profile
      userId = targetUserId;
      isViewingOwnProfile = targetUserId === user.id;
    } else {
      // Fetching own shelves
      const { data: userData } = await (supabase.from('users') as any)
        .select('id')
        .eq('id', user.id)
        .single();

      if (!userData) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      userId = (userData as any).id;
    }

    // Only create default shelves if viewing own profile
    if (isViewingOwnProfile) {
      // Define default shelves
      const defaultShelves = [
        { name: 'Want to Read', status: 'not_started', display_order: 0 },
        { name: 'Currently Reading', status: 'in_progress', display_order: 1 },
        { name: 'Read', status: 'completed', display_order: 2 },
      ];

      // Check which default shelves exist
      const { data: existingDefaultShelves, error: checkError } = await (
        supabase.from('custom_shelves') as any
      )
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true);

      if (checkError) {
        console.error('Error checking default shelves:', checkError);
      }

      const existingDefaultNames = new Set(
        (existingDefaultShelves || []).map((s: any) => s.name)
      );

      // Create missing default shelves
      for (const defaultShelf of defaultShelves) {
        if (!existingDefaultNames.has(defaultShelf.name)) {
          const { error: createError } = await (supabase.from('custom_shelves') as any).insert({
            user_id: userId,
            name: defaultShelf.name,
            description: `Books with status: ${defaultShelf.status}`,
            is_default: true,
            is_public: true,
            display_order: defaultShelf.display_order,
          });

          if (createError) {
            console.error(`Error creating default shelf "${defaultShelf.name}":`, createError);
          }
        }
      }
    }

    // Build query for fetching shelves
    let shelvesQuery = (supabase.from('custom_shelves') as any)
      .select('*')
      .eq('user_id', userId);

    // If viewing someone else's profile, only show public shelves
    if (!isViewingOwnProfile) {
      shelvesQuery = shelvesQuery.eq('is_public', true);
    }

    // Fetch all shelves (users typically have < 50 shelves, so paginating in memory is acceptable)
    const { data: allShelves, error } = await shelvesQuery
      .order('is_default', { ascending: false })
      .order('display_order');

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to fetch shelves' },
        { status: 400 }
      );
    }

    // Paginate in memory
    const skip = Math.max(0, (page - 1) * limit);
    const shelves = (allShelves || []).slice(skip, skip + limit);
    const totalCount = (allShelves || []).length;

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to fetch shelves' },
        { status: 400 }
      );
    }

    // Get book counts for default shelves from reading_progress
    const shelvesWithCounts = await Promise.all(
      (shelves || []).map(async (shelf: any) => {
        if (shelf.is_default) {
          // Map shelf name to reading_progress status
          const statusMap: Record<string, string> = {
            'Want to Read': 'not_started',
            'Currently Reading': 'in_progress',
            'Read': 'completed',
          };

          const status = statusMap[shelf.name];
          if (status) {
            // Count books with this status
            const { count, error: countError } = await (
              supabase.from('reading_progress') as any
            )
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('status', status);

            if (!countError && count !== null) {
              return {
                ...shelf,
                book_count: count,
              };
            }
          }
        } else {
          // For custom shelves, count books in shelf_books
          const { count, error: countError } = await (
            supabase.from('shelf_books') as any
          )
            .select('*', { count: 'exact', head: true })
            .eq('shelf_id', shelf.id);

          if (!countError && count !== null) {
            return {
              ...shelf,
              book_count: count,
            };
          }
        }

        return {
          ...shelf,
          book_count: 0,
        };
      })
    );

    // Transform shelf data to match frontend expectations (camelCase)
    const transformedShelves = (shelvesWithCounts || []).map((shelf: any) => ({
      id: shelf.id,
      userId: shelf.user_id,
      name: shelf.name,
      description: shelf.description,
      icon: shelf.icon,
      color: shelf.color,
      isDefault: shelf.is_default,
      isPublic: shelf.is_public,
      displayOrder: shelf.display_order,
      createdAt: shelf.created_at,
      updatedAt: shelf.updated_at,
      bookCount: shelf.book_count || 0,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: transformedShelves,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching shelves:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

