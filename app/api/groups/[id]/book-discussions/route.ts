import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET: List all book discussions for a group
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const { data, error } = await supabase
    .from('book_discussions')
    .select(
      `
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
      book_discussion_participants (
        user_id,
        role,
        last_read_at
      )
    `
    )
    .eq('group_id', id)
    .order('is_pinned', { ascending: false })
    .order('last_activity_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// POST: Create a new book discussion
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const body = await req.json()

  if (!body.book_id || !body.title || !body.created_by) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: discussion, error: discussionError } = await supabase
    .from('book_discussions')
    .insert([
      {
        ...body,
        group_id: id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (discussionError) return NextResponse.json({ error: discussionError.message }, { status: 400 })

  // Add creator as a participant
  const { error: participantError } = await supabase.from('book_discussion_participants').insert([
    {
      discussion_id: discussion.id,
      user_id: body.created_by,
      role: 'moderator',
      joined_at: new Date().toISOString(),
      last_read_at: new Date().toISOString(),
    },
  ])

  if (participantError)
    return NextResponse.json({ error: participantError.message }, { status: 400 })

  return NextResponse.json(discussion)
}

// PATCH: Update a book discussion
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const body = await req.json()

  if (!body.id) {
    return NextResponse.json({ error: 'Missing discussion id' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('book_discussions')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.id)
    .eq('group_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// DELETE: Remove a book discussion
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const url = new URL(req.url)
  const discussionId = url.searchParams.get('discussion_id')

  if (!discussionId) {
    return NextResponse.json({ error: 'Missing discussion_id' }, { status: 400 })
  }

  const { error } = await supabase
    .from('book_discussions')
    .delete()
    .eq('id', discussionId)
    .eq('group_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
