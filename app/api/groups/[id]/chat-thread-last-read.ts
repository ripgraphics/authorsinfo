import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET: Get last read timestamp for a user in a thread
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params; // Await params even though we don't use it in this function
  const supabase = createClient();
  const threadId = req.nextUrl.searchParams.get('thread_id');
  const userId = req.nextUrl.searchParams.get('user_id');
  if (!threadId || !userId) return NextResponse.json({ error: 'Missing thread_id or user_id' }, { status: 400 });
  const { data, error } = await supabase
    .from('group_chat_thread_last_read')
    .select('*')
    .eq('thread_id', threadId)
    .eq('user_id', userId)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST: Set last read timestamp for a user in a thread
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const body = await req.json();
  if (!body.thread_id || !body.user_id || !body.last_read) return NextResponse.json({ error: 'Missing thread_id, user_id, or last_read' }, { status: 400 });
  const { data, error } = await supabase
    .from('group_chat_thread_last_read')
    .upsert([{ ...body, group_id: id }], { onConflict: ['thread_id', 'user_id'] })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
} 