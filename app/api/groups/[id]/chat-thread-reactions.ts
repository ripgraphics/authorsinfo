import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET: List all reactions for a thread
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params // Await params even though we don't use it in this function
  const supabase = createClient()
  const threadId = req.nextUrl.searchParams.get('thread_id')
  if (!threadId) return NextResponse.json({ error: 'Missing thread_id' }, { status: 400 })
  const { data, error } = await supabase
    .from('group_chat_thread_reactions')
    .select('*')
    .eq('thread_id', threadId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// POST: Add a reaction to a thread
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const body = await req.json()
  if (!body.thread_id || !body.user_id || !body.emoji)
    return NextResponse.json({ error: 'Missing thread_id, user_id, or emoji' }, { status: 400 })
  const { data, error } = await supabase
    .from('group_chat_thread_reactions')
    .insert([{ ...body, group_id: id }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// DELETE: Remove a reaction from a thread
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params // Await params even though we don't use it in this function
  const supabase = createClient()
  const threadId = req.nextUrl.searchParams.get('thread_id')
  const userId = req.nextUrl.searchParams.get('user_id')
  const emoji = req.nextUrl.searchParams.get('emoji')
  if (!threadId || !userId || !emoji)
    return NextResponse.json({ error: 'Missing thread_id, user_id, or emoji' }, { status: 400 })
  const { error } = await supabase
    .from('group_chat_thread_reactions')
    .delete()
    .eq('thread_id', threadId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
