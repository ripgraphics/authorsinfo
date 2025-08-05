import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('GET /api/friends/pending - User:', user.id)

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

    console.log('Pending requests found:', pendingRequests?.length || 0)
    console.log('Pending requests:', pendingRequests)

    if (error) {
      console.error('Error fetching pending requests:', error)
      return NextResponse.json({ error: 'Failed to fetch pending requests' }, { status: 500 })
    }

    // Get user details for each request
    const requestsWithUserDetails = await Promise.all(
      (pendingRequests || []).map(async (request) => {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, email, permalink')
          .eq('id', request.user_id)
          .single()

        return {
          ...request,
          user: {
            id: userData?.id || request.user_id,
            name: userData?.name || userData?.email || 'Unknown User',
            email: userData?.email || '',
            permalink: userData?.permalink || null
          }
        }
      })
    )

    console.log('Requests with user details:', requestsWithUserDetails)

    return NextResponse.json({
      success: true,
      requests: requestsWithUserDetails || []
    })

  } catch (error) {
    console.error('Error in pending requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 