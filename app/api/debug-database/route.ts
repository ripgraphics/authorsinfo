import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Check auth.users table
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .limit(5)
    
    // Check public.users table
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .limit(5)
    
    // Check public.profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, role')
      .limit(5)
    
    // Check if we can access the database at all
    const { data: testQuery, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    return NextResponse.json({
      authUsers: {
        count: authUsers?.length || 0,
        sample: authUsers?.slice(0, 3) || [],
        error: authError?.message || null
      },
      publicUsers: {
        count: publicUsers?.length || 0,
        sample: publicUsers?.slice(0, 3) || [],
        error: publicError?.message || null
      },
      profiles: {
        count: profiles?.length || 0,
        sample: profiles?.slice(0, 3) || [],
        error: profilesError?.message || null
      },
      testQuery: {
        success: !testError,
        error: testError?.message || null
      }
    })
  } catch (error: any) {
    console.error('Debug database error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
} 