import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createRouteHandlerClientAsync()

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
      return NextResponse.json({ 
        error: 'Missing Supabase configuration',
        details: 'NEXT_PUBLIC_SUPABASE_URL not set'
      }, { status: 500 })
    }

    // Get the current user - use getUser() to authenticate with Supabase Auth server
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ User authentication error:', userError)
      return NextResponse.json({ 
        error: 'Failed to authenticate user',
        details: userError.message
      }, { status: 500 })
    }
    
    if (!user) {
      console.log('❌ No authenticated user found')
      return NextResponse.json({ 
        error: 'Unauthorized - No authenticated user found'
      }, { status: 401 })
    }

    

    // Get pending friend requests where the current user is the recipient
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

    if (error) {
      console.error('❌ Error fetching pending requests:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch pending requests',
        details: error.message
      }, { status: 500 })
    }

    // Get user details for each request
    const requestsWithUserDetails = await Promise.all(
      (pendingRequests || []).map(async (request, index) => {
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, name, email, permalink')
            .eq('id', request.user_id)
            .single()

          if (userError) {
            
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

    const response = NextResponse.json({
      success: true,
      requests: requestsWithUserDetails || [],
      timestamp: new Date().toISOString()
    })

    // Add CORS headers if needed
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

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