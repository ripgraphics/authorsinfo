import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET: List all book reviews for a group
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data, error } = await supabase
    .from('book_reviews')
    .select(`
      *,
      books (
        id,
        title,
        author,
        cover_image_id,
        average_rating,
        review_count
      ),
      users (
        id,
        name
      ),
      groups (
        id,
        name
      )
    `)
    .or(`group_id.eq.${id},visibility.eq.public`)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST: Create a new book review
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const body = await req.json();
  
  if (!body.book_id || !body.rating) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('book_reviews')
    .insert([{ 
      ...body, 
      group_id: id,
      visibility: 'public',
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// PATCH: Update a book review
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const body = await req.json();
  
  if (!body.id) {
    return NextResponse.json({ error: 'Missing review id' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('book_reviews')
    .update(body)
    .eq('id', body.id)
    .or(`group_id.eq.${id},visibility.eq.public`)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE: Remove a book review
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const url = new URL(req.url);
  const reviewId = url.searchParams.get('review_id');

  if (!reviewId) {
    return NextResponse.json({ error: 'Missing review_id' }, { status: 400 });
  }

  const { error } = await supabase
    .from('book_reviews')
    .delete()
    .eq('id', reviewId)
    .or(`group_id.eq.${id},visibility.eq.public`);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
} 