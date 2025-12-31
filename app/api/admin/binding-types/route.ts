import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { data: bindingTypes, error } = await supabaseAdmin
      .from('binding_types')
      .select(
        `
        id,
        name
      `
      )
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching binding types:', error)
      return NextResponse.json(
        { error: 'Failed to fetch binding types', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      bindingTypes: bindingTypes || [],
    })
  } catch (error) {
    console.error('Error in GET /api/admin/binding-types:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
