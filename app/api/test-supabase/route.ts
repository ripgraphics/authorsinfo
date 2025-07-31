import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Test the connection by trying to access the database
    // Don't require auth session since this is called during login
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (error) {
      return NextResponse.json({ 
        error: 'Supabase connection failed', 
        details: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection successful',
      databaseAccessible: true
    })
    
  } catch (error: any) {
    console.error('Test Supabase error:', error)
    return NextResponse.json({ 
      error: 'Supabase connection failed', 
      details: error.message 
    }, { status: 500 })
  }
} 