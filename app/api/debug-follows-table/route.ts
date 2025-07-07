import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })
    
    // Simple check if table exists
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Error checking follows table:', error)
      return NextResponse.json(
        { 
          error: 'Follows table error', 
          details: error,
          code: error.code,
          message: error.message,
          hint: error.hint
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tableExists: true,
      message: 'Follows table is accessible'
    })

  } catch (error: any) {
    console.error('Error in debug follows table API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
} 