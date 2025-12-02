import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getFollowersCount } from '@/lib/follows-server'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get the current user (optional - allow viewing friends list without auth)
    const { data: { user } } = await supabase.auth.getUser()

        const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')
    
    // If no userId provided and user is logged in, use their ID
    const userId = targetUserId || user?.id
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
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
      .or(`and(user_id.eq.${userId},status.eq.accepted),and(friend_id.eq.${userId},status.eq.accepted)`)
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
            .select('id, name, email, permalink')
            .eq('id', friend.user_id)
            .single(),
          supabase
            .from('users')
            .select('id, name, email, permalink')
            .eq('id', friend.friend_id)
            .single()
        ])

        // Determine which user is the friend (not the current user)
        const friendUserId = friend.user_id === userId ? friend.friend_id : friend.user_id
        
        // Get followers count for the friend (users following this friend)
        // Use the same method as the profile page - getFollowersCount from follows-server
        let followersCount = 0
        try {
          followersCount = await getFollowersCount(friendUserId, 'user')
        } catch (error) {
          console.error(`Error getting followers count for ${friendUserId}:`, error)
          followersCount = 0
        }

        // Get friends count for the friend (same method as profile page)
        const { data: friendsData, error: friendsError } = await supabase
          .from('user_friends')
          .select('id', { count: 'exact' })
          .eq('user_id', friendUserId)
          .eq('status', 'accepted')
        
        const { data: reverseFriendsData, error: reverseFriendsError } = await supabase
          .from('user_friends')
          .select('id', { count: 'exact' })
          .eq('friend_id', friendUserId)
          .eq('status', 'accepted')
        
        const friendsCount = (friendsError || reverseFriendsError) ? 0 : 
          ((friendsData?.length || 0) + (reverseFriendsData?.length || 0))

        // Get books read count for the friend
        const { data: booksReadData, error: booksError } = await supabase
          .from('reading_progress')
          .select('id', { count: 'exact' })
          .eq('user_id', friendUserId)
          .eq('status', 'completed')
        
        const booksReadCount = booksError ? 0 : (booksReadData?.length || 0)

        return {
          ...friend,
          user: {
            id: userData.data?.id || friend.user_id,
            name: userData.data?.name || userData.data?.email || 'Unknown User',
            email: userData.data?.email || '',
            permalink: userData.data?.permalink
          },
          friend: {
            id: friendData.data?.id || friend.friend_id,
            name: friendData.data?.name || friendData.data?.email || 'Unknown User',
            email: friendData.data?.email || '',
            permalink: friendData.data?.permalink
          },
          followersCount: followersCount || 0,
          friendsCount: friendsCount || 0,
          booksReadCount: booksReadCount || 0
        }
      })
    )

    // Transform the data to get friend details
    const friendsList = friendsWithUserDetails?.map(friend => {
      const isUserRequesting = friend.user_id === userId
      return {
        id: friend.id,
        friend: isUserRequesting ? friend.friend : friend.user,
        friendshipDate: friend.responded_at,
        mutualFriendsCount: 0, // Will be calculated separately
        followersCount: friend.followersCount || 0,
        friendsCount: friend.friendsCount || 0,
        booksReadCount: friend.booksReadCount || 0
      }
    }) || []

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('user_friends')
      .select('*', { count: 'exact', head: true })
      .or(`and(user_id.eq.${userId},status.eq.accepted),and(friend_id.eq.${userId},status.eq.accepted)`)

    if (countError) {
      console.error('Error counting friends:', countError)
    }

    // Get friend analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('friend_analytics')
      .select('*')
      .eq('user_id', userId)
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