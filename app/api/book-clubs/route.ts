import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET /api/book-clubs - Get all book clubs with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const isPublic = searchParams.get('public')
    const userId = searchParams.get('user_id')

    const offset = (page - 1) * limit

    let query = supabase
      .from('book_clubs')
      .select(`
        *,
        book_club_members(count),
        profiles:created_by(id, display_name, avatar_url)
      `, { count: 'exact' })

    // Filter by public/private
    if (isPublic === 'true') {
      query = query.eq('is_public', true)
    } else if (isPublic === 'false') {
      query = query.eq('is_public', false)
    }

    // Filter by user membership
    if (userId) {
      const { data: memberClubs } = await supabase
        .from('book_club_members')
        .select('book_club_id')
        .eq('user_id', userId)

      if (memberClubs && memberClubs.length > 0) {
        const clubIds = memberClubs.map(m => m.book_club_id)
        query = query.in('id', clubIds)
      } else {
        return NextResponse.json({
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        })
      }
    }

    // Search by name or description
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: clubs, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[API] Error fetching book clubs:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: clubs,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error: any) {
    console.error('[API] Error fetching book clubs:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch book clubs' }, { status: 500 })
  }
}

// POST /api/book-clubs - Create a new book club
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, cover_image_url, is_public = true, max_members, rules } = body

    if (!name) {
      return NextResponse.json({ error: 'Club name is required' }, { status: 400 })
    }

    // Create the book club
    const { data: club, error } = await supabase
      .from('book_clubs')
      .insert({
        name,
        description,
        cover_image_url,
        is_public,
        max_members,
        rules,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('[API] Error creating book club:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Add creator as admin member
    await supabase.from('book_club_members').insert({
      book_club_id: club.id,
      user_id: user.id,
      role: 'admin',
      joined_at: new Date().toISOString(),
    })

    return NextResponse.json({ data: club, message: 'Book club created successfully' }, { status: 201 })
  } catch (error: any) {
    console.error('[API] Error creating book club:', error)
    return NextResponse.json({ error: error.message || 'Failed to create book club' }, { status: 500 })
  }
}
