import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET /api/book-clubs/[id] - Get a specific book club
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient()

    const { data: club, error } = await supabase
      .from('book_clubs')
      .select(`
        *,
        book_club_members(
          user_id,
          role,
          joined_at,
          profiles:user_id(id, display_name, avatar_url)
        ),
        book_club_books(
          id,
          book_id,
          status,
          start_date,
          end_date,
          books:book_id(id, title, cover_image_url, authors:book_authors(authors(id, name)))
        ),
        book_club_discussions(
          id,
          title,
          created_at,
          profiles:created_by(id, display_name, avatar_url)
        ),
        profiles:created_by(id, display_name, avatar_url)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('[API] Error fetching book club:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!club) {
      return NextResponse.json({ error: 'Book club not found' }, { status: 404 })
    }

    return NextResponse.json({ data: club })
  } catch (error: any) {
    console.error('[API] Error fetching book club:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch book club' }, { status: 500 })
  }
}

// PATCH /api/book-clubs/[id] - Update a book club
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user is admin of this club
    const { data: membership } = await supabase
      .from('book_club_members')
      .select('role')
      .eq('book_club_id', id)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update the club' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, cover_image_url, is_public, max_members, rules } = body

    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (cover_image_url !== undefined) updateData.cover_image_url = cover_image_url
    if (is_public !== undefined) updateData.is_public = is_public
    if (max_members !== undefined) updateData.max_members = max_members
    if (rules !== undefined) updateData.rules = rules

    const { data: club, error } = await supabase
      .from('book_clubs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[API] Error updating book club:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: club, message: 'Book club updated successfully' })
  } catch (error: any) {
    console.error('[API] Error updating book club:', error)
    return NextResponse.json({ error: error.message || 'Failed to update book club' }, { status: 500 })
  }
}

// DELETE /api/book-clubs/[id] - Delete a book club
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user is admin of this club
    const { data: membership } = await supabase
      .from('book_club_members')
      .select('role')
      .eq('book_club_id', id)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete the club' }, { status: 403 })
    }

    const { error } = await supabase
      .from('book_clubs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[API] Error deleting book club:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Book club deleted successfully' })
  } catch (error: any) {
    console.error('[API] Error deleting book club:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete book club' }, { status: 500 })
  }
}
