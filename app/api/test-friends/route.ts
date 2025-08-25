import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  console.log('🧪 GET /api/test-friends - Test endpoint called')
  
  try {
    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NODE_ENV: process.env.NODE_ENV,
    }
    
    console.log('🔍 Environment check:', envCheck)
    
    // Try to access cookies
    let cookieStore
    try {
      cookieStore = await cookies()
      console.log('✅ Cookies accessible')
    } catch (cookieError) {
      console.error('❌ Cookie access failed:', cookieError)
      return NextResponse.json({
        status: 'error',
        message: 'Cookie access failed',
        error: cookieError instanceof Error ? cookieError.message : 'Unknown',
        envCheck
      }, { status: 500 })
    }
    
    // Try to create Supabase client
    let supabase
    try {
      supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      console.log('✅ Supabase client created')
    } catch (clientError) {
      console.error('❌ Supabase client creation failed:', clientError)
      return NextResponse.json({
        status: 'error',
        message: 'Supabase client creation failed',
        error: clientError instanceof Error ? clientError.message : 'Unknown',
        envCheck
      }, { status: 500 })
    }
    
    // Try to get user
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.log('⚠️ Auth error (expected if not logged in):', authError.message)
        return NextResponse.json({
          status: 'success',
          message: 'API is working but user not authenticated',
          authStatus: 'not_authenticated',
          error: authError.message,
          envCheck,
          timestamp: new Date().toISOString()
        })
      }
      
      if (user) {
        console.log('✅ User authenticated:', user.id)
        
        // Test database connection
        try {
          const { data: testData, error: testError } = await supabase
            .from('user_friends')
            .select('count')
            .limit(1)
          
          if (testError) {
            console.warn('⚠️ Database test failed:', testError.message)
            return NextResponse.json({
              status: 'partial_success',
              message: 'API working, user authenticated, but database test failed',
              authStatus: 'authenticated',
              user: { id: user.id, email: user.email },
              databaseTest: { success: false, error: testError.message },
              envCheck,
              timestamp: new Date().toISOString()
            })
          }
          
          console.log('✅ Database test successful')
          return NextResponse.json({
            status: 'success',
            message: 'API fully functional',
            authStatus: 'authenticated',
            user: { id: user.id, email: user.email },
            databaseTest: { success: true },
            envCheck,
            timestamp: new Date().toISOString()
          })
          
        } catch (dbError) {
          console.error('❌ Database test error:', dbError)
          return NextResponse.json({
            status: 'partial_success',
            message: 'API working, user authenticated, but database test error',
            authStatus: 'authenticated',
            user: { id: user.id, email: user.email },
            databaseTest: { success: false, error: dbError instanceof Error ? dbError.message : 'Unknown' },
            envCheck,
            timestamp: new Date().toISOString()
          })
        }
      } else {
        console.log('⚠️ No user in session')
        return NextResponse.json({
          status: 'success',
          message: 'API is working but no user session',
          authStatus: 'no_session',
          envCheck,
          timestamp: new Date().toISOString()
        })
      }
      
    } catch (authError) {
      console.error('❌ Auth check failed:', authError)
      return NextResponse.json({
        status: 'error',
        message: 'Auth check failed',
        error: authError instanceof Error ? authError.message : 'Unknown',
        envCheck
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Unexpected error in test endpoint:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Unexpected error',
      error: error instanceof Error ? error.message : 'Unknown',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
