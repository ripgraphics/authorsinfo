import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

function isValidUUID(uuid: string | null): boolean {
  if (!uuid) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

        const { searchParams } = new URL(request.url)
    const rawUserId = searchParams.get('userId')
    const targetUserId = isValidUUID(rawUserId) ? rawUserId! : user.id
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get accepted friends
    const { data: friends, error } = await supabase
      .from('user_friends')
      .select(`
        id,
        user_id,
        friend_id,
        requested_at,
        responded_at
      `)
      .or(`and(user_id.eq.${targetUserId},status.eq.accepted),and(friend_id.eq.${targetUserId},status.eq.accepted)`)
      .order('responded_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching friends:', error)
      return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 })
    }

    // Get user details for each friend
    const friendsWithUserDetails = await Promise.all(
      (friends || []).map(async (friend) => {
        const [userData, friendData] = await Promise.all([
          supabase
            .from('users')
            .select('id, name, email')
            .eq('id', friend.user_id)
            .single(),
          supabase
            .from('users')
            .select('id, name, email')
            .eq('id', friend.friend_id)
            .single()
        ])

        return {
          ...friend,
          user: {
            id: userData.data?.id || friend.user_id,
            name: userData.data?.name || userData.data?.email || 'Unknown User',
            email: userData.data?.email || ''
          },
          friend: {
            id: friendData.data?.id || friend.friend_id,
            name: friendData.data?.name || friendData.data?.email || 'Unknown User',
            email: friendData.data?.email || ''
          }
        }
      })
    )

    if (error) {
      console.error('Error fetching friends:', error)
      return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 })
    }

    // Transform the data to get friend details
    const friendsList = friendsWithUserDetails?.map(friend => {
      const isUserRequesting = friend.user_id === targetUserId
      return {
        id: friend.id,
        friend: isUserRequesting ? friend.friend : friend.user,
        friendshipDate: friend.responded_at,
        mutualFriendsCount: 0 // Will be calculated separately
      }
    }) || []

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('user_friends')
      .select('*', { count: 'exact', head: true })
      .or(`and(user_id.eq.${targetUserId},status.eq.accepted),and(friend_id.eq.${targetUserId},status.eq.accepted)`)

    if (countError) {
      console.error('Error counting friends:', countError)
    }

    // Get friend analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('friend_analytics')
      .select('*')
      .eq('user_id', targetUserId)
      .single()

    return NextResponse.json({
      success: true,
      friends: friendsList,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      },
      analytics: analytics || null
    })

  } catch (error) {
    console.error('Error in friends list:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 