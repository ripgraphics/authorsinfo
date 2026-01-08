/**
 * Shelf Books Management Routes
 * POST /api/shelves/:id/books - Add book to shelf
 * DELETE /api/shelves/:id/books/:bookId - Remove book from shelf
 * PATCH /api/shelves/:id/books/:bookId - Update book position in shelf
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to verify user owns the shelf
async function verifyShelfOwnership(shelfId: string, userEmail: string) {
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('email', userEmail)
    .single();

  if (!userData) return null;

  const { data: shelf } = await supabase
    .from('custom_shelves')
    .select('id')
    .eq('id', shelfId)
    .eq('user_id', userData.id)
    .single();

  return shelf && userData.id;
}

// POST /api/shelves/:id/books - Add book to shelf
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabaseAuth = await createRouteHandlerClientAsync();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: shelf } = await supabase
      .from('custom_shelves')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!shelf) {
      return NextResponse.json({ error: 'Shelf not found' }, { status: 404 });
    }

    const { bookId, displayOrder, readingStatus, currentPage } = await request.json();

    if (!bookId) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

    // Verify book exists and get page count
    const { data: book } = await supabase
      .from('books')
      .select('id, pages')
      .eq('id', bookId)
      .single();

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Get next display order if not provided
    let order = displayOrder;
    if (order === undefined) {
      const { data: lastBook } = await supabase
        .from('shelf_books')
        .select('display_order')
        .eq('shelf_id', id)
        .order('display_order', { ascending: false })
        .limit(1);

      order = (lastBook?.[0]?.display_order ?? -1) + 1;
    }

    // Add book to shelf
    const { data: shelfBook, error } = await supabase
      .from('shelf_books')
      .insert({
        shelf_id: id,
        book_id: bookId,
        display_order: order,
      })
      .select()
      .single();

    if (error) {
      // Check if it's a unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Book already in shelf' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to add book to shelf' },
        { status: 400 }
      );
    }

    // If reading status is provided, create/update reading_progress entry
    if (readingStatus) {
      const statusMap: Record<string, string> = {
        not_started: 'not_started',
        in_progress: 'in_progress',
        completed: 'completed',
        on_hold: 'on_hold',
        abandoned: 'abandoned',
      }

      const progressStatus = statusMap[readingStatus] || 'not_started'

      // Check if reading_progress entry already exists
      const { data: existingProgress } = await supabase
        .from('reading_progress')
        .select('id')
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .single()

      // Core progress data - save current_page if provided (single source of truth for user's current page)
      const progressData: any = {
        user_id: user.id,
        book_id: bookId,
        status: progressStatus,
        updated_at: new Date().toISOString(),
      }

      // Save current_page if provided
      if (currentPage !== undefined && currentPage !== null) {
        progressData.current_page = currentPage
        
        // Calculate progress_percentage from books.pages (single source of truth for total pages)
        if (book?.pages && book.pages > 0 && currentPage > 0) {
          progressData.progress_percentage = Math.round((currentPage / book.pages) * 100)
        }
      }

      // Add start_date or finish_date based on status
      if (progressStatus === 'in_progress' && !existingProgress) {
        progressData.start_date = new Date().toISOString()
      } else if (progressStatus === 'completed') {
        progressData.finish_date = new Date().toISOString()
      }

      // Get user's default privacy settings
      const { data: privacySettings } = await supabase
        .from('user_privacy_settings')
        .select('default_privacy_level')
        .eq('user_id', user.id)
        .single()

      const defaultPrivacyLevel = privacySettings?.default_privacy_level || 'private'
      progressData.privacy_level = defaultPrivacyLevel
      progressData.allow_friends = defaultPrivacyLevel === 'friends'
      progressData.allow_followers = defaultPrivacyLevel === 'followers'

      if (existingProgress) {
        // Update existing entry
        const { error: updateError } = await supabase
          .from('reading_progress')
          .update(progressData)
          .eq('id', existingProgress.id)

        if (updateError) {
          console.error('Error updating reading progress:', updateError)
          // Don't fail the whole operation, just log the error
        }
      } else {
        // Create new entry
        progressData.created_at = new Date().toISOString()
        const { error: insertError } = await supabase
          .from('reading_progress')
          .insert(progressData)

        if (insertError) {
          console.error('Error creating reading progress:', insertError)
          // Don't fail the whole operation, just log the error
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: shelfBook,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding book to shelf:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/shelves/:id/books/:bookId - Remove book from shelf
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bookId: string }> }
) {
  try {
    const { id, bookId } = await params;
    const supabaseAuth = await createRouteHandlerClientAsync();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: shelf } = await supabase
      .from('custom_shelves')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!shelf) {
      return NextResponse.json({ error: 'Shelf not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('shelf_books')
      .delete()
      .eq('shelf_id', id)
      .eq('book_id', bookId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to remove book from shelf' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Book removed from shelf',
    });
  } catch (error) {
    console.error('Error removing book from shelf:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/shelves/:id/books/:bookId - Update book position
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bookId: string }> }
) {
  try {
    const { id, bookId } = await params;
    const supabaseAuth = await createRouteHandlerClientAsync();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: shelf } = await supabase
      .from('custom_shelves')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!shelf) {
      return NextResponse.json({ error: 'Shelf not found' }, { status: 404 });
    }

    const { displayOrder } = await request.json();

    if (displayOrder === undefined) {
      return NextResponse.json(
        { error: 'Display order is required' },
        { status: 400 }
      );
    }

    const { data: updatedBook, error } = await supabase
      .from('shelf_books')
      .update({ display_order: displayOrder })
      .eq('shelf_id', id)
      .eq('book_id', bookId)
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
