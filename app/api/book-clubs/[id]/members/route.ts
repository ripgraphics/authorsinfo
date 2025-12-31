import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET /api/book-clubs/[id]/members - Get all members of a book club
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

    const { data: members, error } = await supabase
      .from('book_club_members')
      .select(`
        *,
        profiles:user_id(id, display_name, avatar_url, bio)
      `)
      .eq('book_club_id', id)
      .order('joined_at', { ascending: true })

    if (error) {
      console.error('[API] Error fetching members:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: members })
  } catch (error: any) {
    console.error('[API] Error fetching members:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch members' }, { status: 500 })
  }
}

// POST /api/book-clubs/[id]/members - Join a book club
export async function POST(
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

    // Check if club exists and is public
    const { data: club, error: clubError } = await supabase
      .from('book_clubs')
      .select('id, is_public, max_members')
      .eq('id', id)
      .single()

    if (clubError || !club) {
      return NextResponse.json({ error: 'Book club not found' }, { status: 404 })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('book_club_members')
      .select('id')
      .eq('book_club_id', id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      return NextResponse.json({ error: 'Already a member of this club' }, { status: 400 })
    }

    // Check max members limit
    if (club.max_members) {
      const { count } = await supabase
        .from('book_club_members')
        .select('*', { count: 'exact', head: true })
        .eq('book_club_id', id)

      if (count && count >= club.max_members) {
        return NextResponse.json({ error: 'Club has reached maximum members' }, { status: 400 })
      }
    }

    // Add member
    const { data: member, error } = await supabase
      .from('book_club_members')
      .insert({
        book_club_id: id,
        user_id: user.id,
        role: 'member',
        joined_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('[API] Error joining club:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: member, message: 'Joined club successfully' }, { status: 201 })
  } catch (error: any) {
    console.error('[API] Error joining club:', error)
    return NextResponse.json({ error: error.message || 'Failed to join club' }, { status: 500 })
  }
}

// DELETE /api/book-clubs/[id]/members - Leave a book club
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
    const searchParams = request.nextUrl.searchParams
    const targetUserId = searchParams.get('user_id') || user.id

    // If removing another user, check if current user is admin
    if (targetUserId !== user.id) {
      const { data: membership } = await supabase
        .from('book_club_members')
        .select('role')
        .eq('book_club_id', id)
        .eq('user_id', user.id)
        .single()

      if (!membership || membership.role !== 'admin') {
        return NextResponse.json({ error: 'Only admins can remove members' }, { status: 403 })
      }
    }

    const { error } = await supabase
      .from('book_club_members')
      .delete()
      .eq('book_club_id', id)
      .eq('user_id', targetUserId)

    if (error) {
      console.error('[API] Error leaving club:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Left club successfully' })
  } catch (error: any) {
    console.error('[API] Error leaving club:', error)
    return NextResponse.json({ error: error.message || 'Failed to leave club' }, { status: 500 })
  }
}
