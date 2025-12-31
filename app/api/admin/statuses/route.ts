import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { data: statuses, error } = await supabaseAdmin
      .from('statuses')
      .select(
        `
        id,
        name
      `
      )
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching statuses:', error)
      return NextResponse.json(
        { error: 'Failed to fetch statuses', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      statuses: statuses || [],
    })
  } catch (error) {
    console.error('Error in GET /api/admin/statuses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
