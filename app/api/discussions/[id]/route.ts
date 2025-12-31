import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET /api/discussions/[id] - Get a specific discussion
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

    // Check if id is a permalink or UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    let query = supabase
      .from('discussions')
      .select(`
        *,
        profiles:user_id(id, display_name, avatar_url, bio),
        books:book_id(id, title, cover_image_url, authors:book_authors(authors(id, name))),
        comments(
          id,
          content,
          created_at,
          profiles:user_id(id, display_name, avatar_url)
        )
      `)

    if (isUUID) {
      query = query.eq('id', id)
    } else {
      query = query.eq('permalink', id)
    }

    const { data: discussion, error } = await query.single()

    if (error) {
      console.error('[API] Error fetching discussion:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 })
    }

    return NextResponse.json({ data: discussion })
  } catch (error: any) {
    console.error('[API] Error fetching discussion:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch discussion' }, { status: 500 })
  }
}

// PATCH /api/discussions/[id] - Update a discussion
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = params

    // Verify ownership
    const { data: existing } = await supabase
      .from('discussions')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to edit this discussion' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, is_pinned, category_id } = body

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned
    if (category_id !== undefined) updateData.category_id = category_id

    const { data: discussion, error } = await supabase
      .from('discussions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[API] Error updating discussion:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: discussion, message: 'Discussion updated successfully' })
  } catch (error: any) {
    console.error('[API] Error updating discussion:', error)
    return NextResponse.json({ error: error.message || 'Failed to update discussion' }, { status: 500 })
  }
}

// DELETE /api/discussions/[id] - Delete a discussion
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = params

    // Verify ownership
    const { data: existing } = await supabase
      .from('discussions')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this discussion' }, { status: 403 })
    }

    const { error } = await supabase
      .from('discussions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[API] Error deleting discussion:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Discussion deleted successfully' })
  } catch (error: any) {
    console.error('[API] Error deleting discussion:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete discussion' }, { status: 500 })
  }
}
