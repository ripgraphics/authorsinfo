import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params;

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    console.log(`Fetching book: ${bookId}`);

    // Fetch book with related data
    const { data, error } = await supabaseAdmin
      .from('books')
      .select(`
        *,
        cover_image:images!books_cover_image_id_fkey(id, url, alt_text),
        binding_type:binding_types(id, name),
        format_type:format_types(id, name)
      `)
      .eq('id', bookId)
      .single();

    if (error) {
      console.error('Database error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If cover_image is not available from foreign key, try to get it from album
    if (!data.cover_image) {
      console.log('Cover image not found via foreign key, checking album...');
      
      // Find the "Cover Images" album for this book
      const { data: album } = await supabaseAdmin
        .from('photo_albums')
        .select('id')
        .eq('entity_type', 'book')
        .eq('entity_id', bookId)
        .eq('name', 'Cover Images')
        .maybeSingle();

      if (album) {
        // Get the cover image from the album
        const { data: albumImage } = await supabaseAdmin
          .from('album_images')
          .select(`
            image_id,
            images!inner(id, url, alt_text)
          `)
          .eq('album_id', album.id)
          .eq('is_cover', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (albumImage && albumImage.images) {
          data.cover_image = albumImage.images as any;
          console.log('✅ Found cover image from album:', data.cover_image.url);
        }
      }
    }

    console.log('Book fetched successfully');
    console.log('Book data:', data);
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params;
    const updateData = await request.json();

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    console.log(`Updating book: ${bookId}`);
    console.log('Update data:', updateData);

    // Perform the update
    const { data, error } = await supabaseAdmin
      .from('books')
      .update(updateData)
      .eq('id', bookId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Update successful:', data);
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Error updating book:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 