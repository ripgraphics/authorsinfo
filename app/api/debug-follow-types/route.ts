import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })
    
    // Get all follow target types
    const { data: targetTypes, error } = await supabase
      .from('follow_target_types')
      .select('*')
      .order('id')

    if (error) {
      console.error('Error fetching follow target types:', error)
      return NextResponse.json(
        { error: 'Failed to fetch follow target types', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      targetTypes,
      count: targetTypes?.length || 0
    })

  } catch (error) {
    console.error('Error in debug follow types API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 