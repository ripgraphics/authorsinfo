import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const search = searchParams.get('search') || ''

    let query = supabaseAdmin
      .from('authors')
      .select(
        `
        id,
        name,
        author_image:images!authors_author_image_id_fkey(url, alt_text)
      `
      )
      .order('name', { ascending: true })

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    if (limit) {
      query = query.limit(limit)
    }

    const { data: authors, error } = await query

    if (error) {
      console.error('Error fetching authors:', error)
      return NextResponse.json(
        { error: 'Failed to fetch authors', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      authors: authors || [],
    })
  } catch (error) {
    console.error('Error in GET /api/admin/authors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
