import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET: List all book swaps for a group
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data, error } = await supabase
    .from('group_book_swaps')
    .select(`
      *,
      books (
        id,
        title,
        author,
        cover_image_id
      ),
      offered_by:users!offered_by(name),
      accepted_by:users!accepted_by(name)
    `)
    .eq('group_id', id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST: Create a new book swap offer
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const body = await req.json();
  
  if (!body.book_id || !body.offered_by) {
    return NextResponse.json({ error: 'Missing book_id or offered_by' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('group_book_swaps')
    .insert([{ ...body, group_id: id, status: 'available' }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// PATCH: Update a book swap (accept/reject)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params; // Await params even though we don't use it in this function
  const supabase = createClient();
  const body = await req.json();
  
  if (!body.swap_id || !body.status || !body.accepted_by) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('group_book_swaps')
    .update({
      status: body.status,
      accepted_by: body.accepted_by,
      accepted_at: new Date().toISOString()
    })
    .eq('id', body.swap_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE: Remove a book swap offer
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params; // Await params even though we don't use it in this function
  const supabase = createClient();
  const url = new URL(req.url);
  const swapId = url.searchParams.get('swap_id');
  const userId = url.searchParams.get('user_id');

  if (!swapId || !userId) {
    return NextResponse.json({ error: 'Missing swap_id or user_id' }, { status: 400 });
  }

  // Verify the user is the one who offered the book
  const { data: swap } = await supabase
    .from('group_book_swaps')
    .select('offered_by')
    .eq('id', swapId)
    .single();

  if (!swap || swap.offered_by !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { error } = await supabase
    .from('group_book_swaps')
    .delete()
    .eq('id', swapId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
} 