import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  console.log('🚀 GET /api/friends/pending - Request received')
  
  try {
    // Check if we can access cookies
    let cookieStore
    try {
      cookieStore = await cookies()
      console.log('✅ Cookies accessed successfully')
    } catch (cookieError) {
      console.error('❌ Error accessing cookies:', cookieError)
      return NextResponse.json({ 
        error: 'Failed to access cookies',
        details: cookieError instanceof Error ? cookieError.message : 'Unknown cookie error'
      }, { status: 500 })
    }

    // Create Supabase client
    let supabase
    try {
      supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      console.log('✅ Supabase client created successfully')
    } catch (clientError) {
      console.error('❌ Error creating Supabase client:', clientError)
      return NextResponse.json({ 
        error: 'Failed to create Supabase client',
        details: clientError instanceof Error ? clientError.message : 'Unknown client error'
      }, { status: 500 })
    }

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
      return NextResponse.json({ 
        error: 'Missing Supabase configuration',
        details: 'NEXT_PUBLIC_SUPABASE_URL not set'
      }, { status: 500 })
    }

    // Get the current user
    console.log('🔍 Attempting to get current user...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ 
        error: 'Authentication error',
        details: authError.message
      }, { status: 401 })
    }
    
    if (!user) {
      console.log('❌ No user found in session')
      return NextResponse.json({ 
        error: 'Unauthorized - No user session found'
      }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    // Test database connection
    console.log('🔍 Testing database connection...')
    const { data: testData, error: testError } = await supabase
      .from('user_friends')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Database connection test failed:', testError)
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: testError.message
      }, { status: 500 })
    }
    
    console.log('✅ Database connection successful')

    // Get pending friend requests where the current user is the recipient
    console.log('🔍 Fetching pending friend requests...')
    const { data: pendingRequests, error } = await supabase
      .from('user_friends')
      .select(`
        id,
        user_id,
        friend_id,
        requested_by,
        status,
        requested_at,
        responded_at
      `)
      .eq('friend_id', user.id)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })

    console.log('📊 Pending requests query result:', { 
      count: pendingRequests?.length || 0, 
      error: error?.message || null 
    })

    if (error) {
      console.error('❌ Error fetching pending requests:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch pending requests',
        details: error.message
      }, { status: 500 })
    }

    console.log('✅ Pending requests fetched successfully:', pendingRequests?.length || 0)

    // Get user details for each request
    console.log('🔍 Fetching user details for requests...')
    const requestsWithUserDetails = await Promise.all(
      (pendingRequests || []).map(async (request, index) => {
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, name, email, permalink')
            .eq('id', request.user_id)
            .single()

          if (userError) {
            console.warn(`⚠️ Warning: Could not fetch user details for request ${index}:`, userError)
            return {
              ...request,
              user: {
                id: request.user_id,
                name: 'Unknown User',
                email: '',
                permalink: null
              }
            }
          }

          return {
            ...request,
            user: {
              id: userData?.id || request.user_id,
              name: userData?.name || userData?.email || 'Unknown User',
              email: userData?.email || '',
              permalink: userData?.permalink || null
            }
          }
        } catch (userError) {
          console.warn(`⚠️ Warning: Error processing user details for request ${index}:`, userError)
          return {
            ...request,
            user: {
              id: request.user_id,
              name: 'Unknown User',
              email: '',
              permalink: null
            }
          }
        }
      })
    )

    console.log('✅ User details fetched successfully')

    const response = NextResponse.json({
      success: true,
      requests: requestsWithUserDetails || [],
      timestamp: new Date().toISOString()
    })

    // Add CORS headers if needed
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

    console.log('✅ Response prepared successfully')
    return response

  } catch (error) {
    console.error('❌ Unexpected error in pending requests API:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    }, { status: 500 })
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 