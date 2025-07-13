import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { data: formatTypes, error } = await supabaseAdmin
      .from('format_types')
      .select(`
        id,
        name
      `)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching format types:', error)
      return NextResponse.json(
        { error: 'Failed to fetch format types', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      formatTypes: formatTypes || []
    })

  } catch (error) {
    console.error('Error in GET /api/admin/format-types:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 