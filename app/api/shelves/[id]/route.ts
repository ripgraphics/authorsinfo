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

// GET /api/shelves/:id - Get shelf details with books (paginated)
export async function GET(
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

    // Verify ownership
    const isOwner = await verifyShelfOwnership(supabase, id, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Shelf not found' }, { status: 404 });
    }

    // Get pagination params
    const url = new URL(request.url);
    const skip = parseInt(url.searchParams.get('skip') || '0');
    const take = Math.min(parseInt(url.searchParams.get('take') || '20'), 100);

    // Get shelf details
    const { data: shelf, error: shelfError } = await (supabase.from('custom_shelves') as any)
      .select('*')
      .eq('id', id)
      .single();

    if (shelfError || !shelf) {
      return NextResponse.json({ error: 'Shelf not found' }, { status: 404 });
    }

    let books: any[] = [];
    let count = 0;

    // For default shelves, fetch books from reading_progress
    if ((shelf as any).is_default) {
      // Map shelf name to reading_progress status
      const statusMap: Record<string, string> = {
        'Want to Read': 'not_started',
        'Currently Reading': 'in_progress',
        'Read': 'completed',
      };

      const status = statusMap[(shelf as any).name];
      if (status) {
        // Get total count
        const { count: totalCount } = await (supabase.from('reading_progress') as any)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', status);

        count = totalCount || 0;

        // Fetch reading progress entries with books
        const { data: readingProgress, error: progressError } = await (
          supabase.from('reading_progress') as any
        )
          .select(
            `
            id,
            book_id,
            updated_at,
            books (
              id,
              title,
              cover_image_id,
              cover_image:images!books_cover_image_id_fkey(url, alt_text)
            )
          `
          )
          .eq('user_id', user.id)
          .eq('status', status)
          .order('updated_at', { ascending: false })
          .range(skip, skip + take - 1);

        if (progressError) {
          return NextResponse.json(
            { error: 'Failed to fetch books from reading progress' },
            { status: 400 }
          );
        }

        // Transform to match expected format
        books =
          readingProgress?.map((rp: any) => ({
            id: rp.books?.id,
            title: rp.books?.title,
            cover_url: rp.books?.cover_image?.url || null,
            author: null, // Will need to fetch separately if needed
            published_date: null,
            shelfBookId: rp.id,
            displayOrder: 0,
            addedAt: rp.updated_at,
          })) || [];

        // Fetch authors for books
        if (books.length > 0) {
          const bookIds = books.map((b) => b.id).filter(Boolean);
          const { data: bookAuthors } = await (supabase.from('book_authors') as any)
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
      const { data: shelfBooks, error: booksError } = await (supabase.from('shelf_books') as any)
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
      const { count: totalCount } = await (supabase.from('shelf_books') as any)
        .select('*', { count: 'exact', head: true })
        .eq('shelf_id', id);

      count = totalCount || 0;

      // Transform to match expected format
      books =
        shelfBooks?.map((b: any) => ({
          id: b.books?.id,
          title: b.books?.title,
          cover_url: b.books?.cover_image?.url || null,
          author: null, // Will need to fetch separately if needed
          published_date: null,
          shelfBookId: b.id,
          displayOrder: b.display_order,
          addedAt: b.added_at,
        })) || [];

      // Fetch authors and reading progress for books
      if (books.length > 0) {
        const bookIds = books.map((b) => b.id).filter(Boolean);
        
        // Fetch authors
        const { data: bookAuthors } = await (supabase.from('book_authors') as any)
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

        // Fetch reading progress for books
        const { data: readingProgress } = await (supabase.from('reading_progress') as any)
          .select('book_id, status')
          .eq('user_id', user.id)
          .in('book_id', bookIds);

        if (readingProgress) {
          const progressMap = new Map();
          readingProgress.forEach((rp: any) => {
            progressMap.set(rp.book_id, {
              status: rp.status,
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
        ...(shelf as any),
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
