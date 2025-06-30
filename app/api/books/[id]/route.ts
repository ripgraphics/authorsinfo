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
        cover_image:images(id, url, alt_text, img_type_id),
        binding_type:binding_types(id, name),
        format_type:format_types(id, name)
      `)
      .eq('id', bookId)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Book fetched successfully');
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