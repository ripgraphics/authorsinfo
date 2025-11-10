import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET: List all comments for a content item
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params; // Await params even though we don't use it in this function
  const supabase = createClient();
  const contentId = req.nextUrl.searchParams.get('content_id');
  if (!contentId) return NextResponse.json({ error: 'Missing content_id' }, { status: 400 });
  const { data, error } = await supabase
    .from('group_content_comments')
    .select('*')
    .eq('content_id', contentId)
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST: Add a new comment to a content item
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const body = await req.json();
  if (!body.content_id || !body.body) return NextResponse.json({ error: 'Missing content_id or body' }, { status: 400 });
  const { data, error } = await supabase
    .from('group_content_comments')
    .insert([{ ...body, group_id: id }])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
} 