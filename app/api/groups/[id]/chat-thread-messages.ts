import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET: List all messages for a thread
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params // Await params even though we don't use it in this function
  const supabase = createClient()
  const threadId = req.nextUrl.searchParams.get('thread_id')
  if (!threadId) return NextResponse.json({ error: 'Missing thread_id' }, { status: 400 })
  const { data, error } = await supabase
    .from('group_chat_thread_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// POST: Add a new message to a thread
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const body = await req.json()
  if (!body.thread_id || !body.user_id || !body.body)
    return NextResponse.json({ error: 'Missing thread_id, user_id, or body' }, { status: 400 })
  const { data, error } = await supabase
    .from('group_chat_thread_messages')
    .insert([{ ...body, group_id: id }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
