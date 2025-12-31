import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET: List all book lists for a group
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const { data, error } = await supabase
    .from('group_book_lists')
    .select('*')
    .eq('group_id', id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// POST: Create a new book list
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const body = await req.json()
  if (!body.title || !body.created_by) {
    return NextResponse.json({ error: 'Missing title or created_by' }, { status: 400 })
  }
  const { data, error } = await supabase
    .from('group_book_lists')
    .insert([{ ...body, group_id: id }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// PATCH: Update a book list
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params // Await params even though we don't use it in this function
  const supabase = createClient()
  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: 'Missing list id' }, { status: 400 })
  const { data, error } = await supabase
    .from('group_book_lists')
    .update(body)
    .eq('id', body.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// DELETE: Delete a book list (admin/mod/creator only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params // Await params even though we don't use it in this function
  const supabase = createClient()
  const url = new URL(req.url)
  const listId = url.searchParams.get('id')
  const userId = url.searchParams.get('user_id')
  if (!listId || !userId)
    return NextResponse.json({ error: 'Missing id or user_id' }, { status: 400 })
  // Fetch the list
  const { data: list, error: fetchError } = await supabase
    .from('group_book_lists')
    .select('id, created_by')
    .eq('id', listId)
    .single()
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 404 })
  // Mock admin check: allow if user is creator or user_id === 'admin'
  if (list.created_by !== userId && userId !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { error } = await supabase.from('group_book_lists').delete().eq('id', listId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

// --- Book List Items ---
// POST: Add a book to a list
export async function POST_item(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const body = await req.json()
  if (!body.list_id || !body.book_id || !body.added_by) {
    return NextResponse.json({ error: 'Missing list_id, book_id, or added_by' }, { status: 400 })
  }
  const { data, error } = await supabase
    .from('group_book_list_items')
    .insert([{ ...body, group_id: id }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
// DELETE: Remove a book from a list
export async function DELETE_item(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params // Await params even though we don't use it in this function
  const supabase = createClient()
  const url = new URL(req.url)
  const itemId = url.searchParams.get('item_id')
  if (!itemId) return NextResponse.json({ error: 'Missing item_id' }, { status: 400 })
  const { error } = await supabase.from('group_book_list_items').delete().eq('id', itemId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
// --- Voting ---
// POST: Vote for a book in a list
export async function POST_vote(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const body = await req.json()
  if (!body.list_id || !body.book_id || !body.user_id) {
    return NextResponse.json({ error: 'Missing list_id, book_id, or user_id' }, { status: 400 })
  }
  // Upsert vote
  const { data, error } = await supabase
    .from('group_book_list_votes')
    .upsert([{ ...body, group_id: id }], { onConflict: 'list_id,book_id,user_id' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
// GET: Get votes for books in a list
export async function GET_votes(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params // Await params even though we don't use it in this function
  const supabase = createClient()
  const listId = new URL(req.url).searchParams.get('list_id')
  if (!listId) return NextResponse.json({ error: 'Missing list_id' }, { status: 400 })
  const { data, error } = await supabase
    .from('group_book_list_votes')
    .select('*')
    .eq('list_id', listId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
