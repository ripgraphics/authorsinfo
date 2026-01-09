/**
 * Dynamic Shelf Routes
 * GET /api/shelves/:id - Get shelf details with books
 * PATCH /api/shelves/:id - Update shelf metadata
 * DELETE /api/shelves/:id - Delete shelf
 * POST /api/shelves/:id/books - Add book to shelf
 * DELETE /api/shelves/:id/books/:bookId - Remove book from shelf
 * PATCH /api/shelves/:id/books/:bookId - Update book position in shelf
 */

import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Helper to verify user owns the shelf
async function verifyShelfOwnership(supabase: any, shelfId: string, userId: string) {
  const { data: shelf } = await supabase
    .from('custom_shelves')
    .select('id')
    .eq('id', shelfId)
    .eq('user_id', userId)
    .single();

  return !!shelf;
}

// Helper to check if two users are friends
async function checkIfFriends(userId1: string, userId2: string): Promise<boolean> {
  const { data: friendship } = await supabaseAdmin
    .from('user_friends')
    .select('id')
    .or(
      `and(user_id.eq.${userId1},friend_id.eq.${userId2},status.eq.accepted),and(user_id.eq.${userId2},friend_id.eq.${userId1},status.eq.accepted)`
    )
    .maybeSingle();

  return !!friendship;
}

// Helper to check if user1 is following user2
async function checkIfFollowing(followerId: string, targetId: string): Promise<boolean> {
  const { data: userTargetType } = await (supabaseAdmin
    .from('follow_target_types') as any)
    .select('id')
    .eq('name', 'user')
    .single();

  if (!userTargetType?.id) return false;

  const { data: follow } = await supabaseAdmin
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', targetId)
    .eq('target_type_id', userTargetType.id)
    .maybeSingle();

  return !!follow;
}

// GET /api/shelves/:id - Get shelf details with books (paginated)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClientAsync();
    
    // Get current user (may be null for public access)
    const { data: { user } } = await supabase.auth.getUser();
    const viewerId = user?.id || null;

    // Fetch shelf using admin client to bypass RLS for initial check
    const { data: shelf, error: shelfError } = await (supabaseAdmin.from('custom_shelves') as any)
      .select('*')
      .eq('id', id)
      .single();

    if (shelfError || !shelf) {
      return NextResponse.json({ error: 'Shelf not found' }, { status: 404 });
    }

    const shelfOwnerId = shelf.user_id;
    const isOwner = viewerId === shelfOwnerId;

    // Access control: allow if owner OR shelf is public
    if (!isOwner && !shelf.is_public) {
      return NextResponse.json({ error: 'Shelf not found' }, { status: 404 });
    }

    // Get pagination params
    const url = new URL(request.url);
    const skip = parseInt(url.searchParams.get('skip') || '0');
    const take = Math.min(parseInt(url.searchParams.get('take') || '20'), 100);

    let books: any[] = [];
    let count = 0;

    // For default shelves, fetch books from reading_progress
    if (shelf.is_default) {
      // Map shelf name to reading_progress status
      const statusMap: Record<string, string> = {
        'Want to Read': 'not_started',
        'Currently Reading': 'in_progress',
        'Read': 'completed',
      };

      const status = statusMap[shelf.name];
      if (status) {
        // Build base query for reading_progress using shelf owner's ID
        let progressQuery = (supabaseAdmin.from('reading_progress') as any)
          .select(
            `
            id,
            book_id,
            status,
            progress_percentage,
            percentage,
            current_page,
            total_pages,
            updated_at,
            privacy_level,
            allow_friends,
            allow_followers,
            books (
              id,
              title,
              cover_image_id,
              cover_image:images!books_cover_image_id_fkey(url, alt_text)
            )
          `
          )
          .eq('user_id', shelfOwnerId)
          .eq('status', status)
          .order('updated_at', { ascending: false });

        // Fetch all matching entries (we'll filter by privacy in code)
        const { data: readingProgress, error: progressError } = await progressQuery;

        if (progressError) {
          return NextResponse.json(
            { error: 'Failed to fetch books from reading progress' },
            { status: 400 }
          );
        }

        // Filter by privacy level if viewer is not the owner
        let filteredProgress = readingProgress || [];
        if (!isOwner) {
          // Determine viewer's relationship to owner
          const [isFriend, isFollower] = viewerId
            ? await Promise.all([
                checkIfFriends(viewerId, shelfOwnerId),
                checkIfFollowing(viewerId, shelfOwnerId),
              ])
            : [false, false];

          filteredProgress = filteredProgress.filter((rp: any) => {
            // Public entries are visible to everyone
            if (rp.privacy_level === 'public') return true;
            // Friends-only entries
            if (rp.privacy_level === 'friends' && isFriend) return true;
            if (rp.allow_friends === true && isFriend) return true;
            // Followers-only entries
            if (rp.privacy_level === 'followers' && isFollower) return true;
            if (rp.allow_followers === true && isFollower) return true;
            // Private entries are only visible to owner (handled above)
            return false;
          });
        }

        count = filteredProgress.length;

        // Apply pagination after filtering
        const paginatedProgress = filteredProgress.slice(skip, skip + take);

        // Transform to match expected format
        books = paginatedProgress.map((rp: any) => ({
          id: rp.books?.id,
          title: rp.books?.title,
          cover_url: rp.books?.cover_image?.url || null,
          author: null,
          published_date: null,
          shelfBookId: rp.id,
          displayOrder: 0,
          addedAt: rp.updated_at,
          readingProgress: {
            status: rp.status,
            progress_percentage: rp.progress_percentage,
            percentage: rp.percentage,
            current_page: rp.current_page,
            total_pages: rp.total_pages,
          },
        }));

        // Fetch authors for books
        if (books.length > 0) {
          const bookIds = books.map((b) => b.id).filter(Boolean);
          const { data: bookAuthors } = await (supabaseAdmin.from('book_authors') as any)
            .select(
              `
              book_id,
              authors (
                id,
                name
              )
            `
            )
            .in('book_id', bookIds);

          if (bookAuthors) {
            const authorMap = new Map();
            bookAuthors.forEach((ba: any) => {
              if (ba.authors && !authorMap.has(ba.book_id)) {
                authorMap.set(ba.book_id, ba.authors.name);
              }
            });

            books = books.map((book) => ({
              ...book,
              author: authorMap.get(book.id) || null,
            }));
          }
        }
      }
    } else {
      // For custom shelves, fetch from shelf_books
      const { data: shelfBooks, error: booksError } = await (supabaseAdmin.from('shelf_books') as any)
        .select(
          `
          id,
          book_id,
          display_order,
          added_at,
          books (
            id,
            title,
            cover_image_id,
            cover_image:images!books_cover_image_id_fkey(url, alt_text)
          )
        `
        )
        .eq('shelf_id', id)
        .order('display_order')
        .range(skip, skip + take - 1);

      if (booksError) {
        return NextResponse.json(
          { error: 'Failed to fetch books' },
          { status: 400 }
        );
      }

      // Get total count
      const { count: totalCount } = await (supabaseAdmin.from('shelf_books') as any)
        .select('*', { count: 'exact', head: true })
        .eq('shelf_id', id);

      count = totalCount || 0;

      // Transform to match expected format
      books =
        shelfBooks?.map((b: any) => ({
          id: b.books?.id,
          title: b.books?.title,
          cover_url: b.books?.cover_image?.url || null,
          author: null,
          published_date: null,
          shelfBookId: b.id,
          displayOrder: b.display_order,
          addedAt: b.added_at,
        })) || [];

      // Fetch authors and reading progress for books
      if (books.length > 0) {
        const bookIds = books.map((b) => b.id).filter(Boolean);
        
        // Fetch authors
        const { data: bookAuthors } = await (supabaseAdmin.from('book_authors') as any)
          .select(
            `
            book_id,
            authors (
              id,
              name
            )
          `
          )
          .in('book_id', bookIds);

        if (bookAuthors) {
          const authorMap = new Map();
          bookAuthors.forEach((ba: any) => {
            if (ba.authors && !authorMap.has(ba.book_id)) {
              authorMap.set(ba.book_id, ba.authors.name);
            }
          });

          books = books.map((book) => ({
            ...book,
            author: authorMap.get(book.id) || null,
          }));
        }

        // Fetch reading progress for books (use shelf owner's progress)
        const { data: readingProgress } = await (supabaseAdmin.from('reading_progress') as any)
          .select('book_id, status, progress_percentage, percentage, current_page, total_pages')
          .eq('user_id', shelfOwnerId)
          .in('book_id', bookIds);

        if (readingProgress) {
          const progressMap = new Map();
          readingProgress.forEach((rp: any) => {
            progressMap.set(rp.book_id, {
              status: rp.status,
              progress_percentage: rp.progress_percentage,
              percentage: rp.percentage,
              current_page: rp.current_page,
              total_pages: rp.total_pages,
            });
          });

          books = books.map((book) => ({
            ...book,
            readingProgress: progressMap.get(book.id) || null,
          }));
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...shelf,
        books: books || [],
        bookCount: count || 0,
        pagination: {
          skip,
          take,
          total: count || 0,
          hasMore: (skip + take) < (count || 0),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching shelf:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/shelves/:id - Update shelf metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isOwner = await verifyShelfOwnership(supabase, id, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Shelf not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, icon, color, displayOrder, isPublic } = body;

    // Build update object
    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (icon !== undefined) updates.icon = icon || null;
    if (color !== undefined) updates.color = color;
    if (displayOrder !== undefined) updates.display_order = displayOrder;
    if (isPublic !== undefined) updates.is_public = isPublic;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data: updatedShelf, error } = await (supabase.from('custom_shelves') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update shelf' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedShelf,
    });
  } catch (error) {
    console.error('Error updating shelf:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/shelves/:id - Delete shelf
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isOwner = await verifyShelfOwnership(supabase, id, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Shelf not found' }, { status: 404 });
    }

    // Check if default shelf
    const { data: shelf } = await (supabase.from('custom_shelves') as any)
      .select('is_default')
      .eq('id', id)
      .single();

    if ((shelf as any)?.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete default shelf' },
        { status: 400 }
      );
    }

    // Delete shelf (will cascade to shelf_books)
    const { error } = await supabase
      .from('custom_shelves')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete shelf' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Shelf deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting shelf:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/shelves/:id/books - Add book to shelf
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isOwner = await verifyShelfOwnership(supabase, id, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Shelf not found' }, { status: 404 });
    }

    const { bookId, displayOrder } = await request.json();

    // Validate input
    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    // Check if book already in shelf
    const { data: existing } = await supabase
      .from('shelf_books')
      .select('id')
      .eq('shelf_id', id)
      .eq('book_id', bookId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Book already in this shelf' },
        { status: 400 }
      );
    }

    // Add book to shelf
    const { data: shelfBook, error: insertError } = await (supabase.from('shelf_books') as any)
      .insert({
        shelf_id: id,
        book_id: bookId,
        display_order: displayOrder,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to add book to shelf' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: shelfBook.id,
        bookId: shelfBook.book_id,
        displayOrder: shelfBook.display_order,
        addedAt: shelfBook.added_at,
      },
    });
  } catch (error) {
    console.error('Error adding book to shelf:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/shelves/:id/books/:bookId - Remove book from shelf
export async function DELETE_BOOK(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isOwner = await verifyShelfOwnership(supabase, id, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Shelf not found' }, { status: 404 });
    }

    const { bookId } = await request.json();

    // Remove book from shelf
    const { error } = await supabase
      .from('shelf_books')
      .delete()
      .eq('id', bookId)
      .eq('shelf_id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to remove book from shelf' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Book removed from shelf successfully',
    });
  } catch (error) {
    console.error('Error removing book from shelf:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/shelves/:id/books/:bookId - Update book position in shelf
export async function PATCH_BOOK(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isOwner = await verifyShelfOwnership(supabase, id, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Shelf not found' }, { status: 404 });
    }

    const { displayOrder, bookId } = await request.json();

    // Update book position
    const { data: updatedBook, error } = await (supabase.from('shelf_books') as any)
      .update({ display_order: displayOrder })
      .eq('id', bookId)
      .eq('shelf_id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update book position' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedBook,
    });
  } catch (error) {
    console.error('Error updating book position:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
