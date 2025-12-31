import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const search = searchParams.get('search') || ''

    let query = supabaseAdmin
      .from('publishers')
      .select(
        `
        id,
        name,
        publisher_image:publisher_image_id(id, url, alt_text)
      `
      )
      .order('name', { ascending: true })

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    if (limit) {
      query = query.limit(limit)
    }

    const { data: publishers, error } = await query

    if (error) {
      console.error('Error fetching publishers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch publishers', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      publishers: publishers || [],
    })
  } catch (error) {
    console.error('Error in GET /api/admin/publishers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
