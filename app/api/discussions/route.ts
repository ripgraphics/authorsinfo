import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET /api/discussions - Get all discussions with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const bookId = searchParams.get('book_id')
    const groupId = searchParams.get('group_id')
    const userId = searchParams.get('user_id')
    const categoryId = searchParams.get('category_id')
    const pinned = searchParams.get('pinned')

    const offset = (page - 1) * limit

    let query = supabase
      .from('discussions')
      .select(`
        *,
        profiles:user_id(id, display_name, avatar_url),
        books:book_id(id, title, cover_image_url),
        comments(count)
      `, { count: 'exact' })

    // Apply filters
    if (bookId) query = query.eq('book_id', bookId)
    if (groupId) query = query.eq('group_id', groupId)
    if (userId) query = query.eq('user_id', userId)
    if (categoryId) query = query.eq('category_id', parseInt(categoryId))
    if (pinned === 'true') query = query.eq('is_pinned', true)
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }

    const { data: discussions, error, count } = await query
      .order('is_pinned', { ascending: false })
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

// POST /api/discussions - Create a new discussion
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, book_id, group_id, category_id, permalink } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    // Generate permalink if not provided
    let finalPermalink = permalink
    if (!finalPermalink) {
      finalPermalink = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 80)
      finalPermalink = `${finalPermalink}-${Date.now().toString(36)}`
    }

    const { data: discussion, error } = await supabase
      .from('discussions')
      .insert({
        user_id: user.id,
        title,
        content,
        book_id,
        group_id,
        category_id,
        permalink: finalPermalink,
      })
      .select(`
        *,
        profiles:user_id(id, display_name, avatar_url)
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

