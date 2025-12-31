import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET /api/book-clubs/[id]/discussions - Get all discussions in a book club
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    const supabase = createClient()
    const { id } = params
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const { data: discussions, error, count } = await supabase
      .from('book_club_discussions')
      .select(`
        *,
        profiles:created_by(id, display_name, avatar_url),
        books:book_id(id, title, cover_image_url)
      `, { count: 'exact' })
      .eq('book_club_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[API] Error fetching discussions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: discussions,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error: any) {
    console.error('[API] Error fetching discussions:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch discussions' }, { status: 500 })
  }
}

// POST /api/book-clubs/[id]/discussions - Create a new discussion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = params

    // Check if user is a member
    const { data: membership } = await supabase
      .from('book_club_members')
      .select('id')
      .eq('book_club_id', id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Must be a member to create discussions' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, book_id } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const { data: discussion, error } = await supabase
      .from('book_club_discussions')
      .insert({
        book_club_id: id,
        title,
        content,
        book_id,
        created_by: user.id,
      })
      .select(`
        *,
        profiles:created_by(id, display_name, avatar_url)
      `)
      .single()

    if (error) {
      console.error('[API] Error creating discussion:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: discussion, message: 'Discussion created successfully' }, { status: 201 })
  } catch (error: any) {
    console.error('[API] Error creating discussion:', error)
    return NextResponse.json({ error: error.message || 'Failed to create discussion' }, { status: 500 })
  }
}
