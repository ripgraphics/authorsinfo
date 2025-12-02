import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getFollowersCount } from '@/lib/follows-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
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

    // Extract all friend user IDs (the ones that aren't the current user)
    const friendUserIds = (friends || []).map(friend => 
      friend.user_id === userId ? friend.friend_id : friend.user_id
    )

    // Batch fetch all user data, profiles, and stats in parallel
    const [usersResult, profilesResult] = await Promise.all([
      supabase
        .from('users')
        .select('id, name, email, permalink')
        .in('id', friendUserIds),
      supabase
        .from('profiles')
        .select('user_id, avatar_image_id')
        .in('user_id', friendUserIds)
    ])

    const users = usersResult.data || []
    const profiles = profilesResult.data || []

    // Get unique avatar_image_ids and fetch image URLs
    const avatarImageIds = Array.from(new Set(
      profiles.map(p => p.avatar_image_id).filter(Boolean)
    ))

    let avatarImageMap = new Map()
    if (avatarImageIds.length > 0) {
      const { data: images } = await supabaseAdmin
        .from('images')
        .select('id, url')
        .in('id', avatarImageIds)

      if (images) {
        images.forEach(img => {
          avatarImageMap.set(img.id, img.url)
        })
      }
    }

    // Batch fetch followers counts for all friends
    const followersCountPromises = friendUserIds.map(id => getFollowersCount(id, 'user'))
    const followersCounts = await Promise.all(followersCountPromises)
    const followersCountMap = new Map(friendUserIds.map((id, idx) => [id, followersCounts[idx] || 0]))

    // Batch fetch friends counts
    const [friendsDataResult, reverseFriendsDataResult] = await Promise.all([
      supabase
        .from('user_friends')
        .select('user_id, id')
        .in('user_id', friendUserIds)
        .eq('status', 'accepted'),
      supabase
        .from('user_friends')
        .select('friend_id, id')
        .in('friend_id', friendUserIds)
        .eq('status', 'accepted')
    ])

    const friendsData = friendsDataResult.data || []
    const reverseFriendsData = reverseFriendsDataResult.data || []
    
    // Count friends per user
    const friendsCountMap = new Map()
    friendUserIds.forEach(id => {
      const userFriends = friendsData.filter(f => f.user_id === id).length
      const reverseFriends = reverseFriendsData.filter(f => f.friend_id === id).length
      friendsCountMap.set(id, userFriends + reverseFriends)
    })

    // Batch fetch books read counts
    const { data: booksReadData } = await supabase
      .from('reading_progress')
      .select('user_id, id')
      .in('user_id', friendUserIds)
      .eq('status', 'completed')

    const booksReadCountMap = new Map()
    friendUserIds.forEach(id => {
      const count = booksReadData?.filter(b => b.user_id === id).length || 0
      booksReadCountMap.set(id, count)
    })

    // Create maps for quick lookup
    const userMap = new Map(users.map(u => [u.id, u]))
    const profileMap = new Map(profiles.map(p => [p.user_id, p]))

    // Build friends with user details
    const friendsWithUserDetails = (friends || []).map(friend => {
      const friendUserId = friend.user_id === userId ? friend.friend_id : friend.user_id
      const user = userMap.get(friend.user_id)
      const friendUser = userMap.get(friend.friend_id)
      const profile = profileMap.get(friendUserId)
      const avatarImageId = profile?.avatar_image_id
      const avatarUrl = avatarImageId ? avatarImageMap.get(avatarImageId) : null

      return {
        ...friend,
        user: {
          id: user?.id || friend.user_id,
          name: user?.name || user?.email || 'Unknown User',
          email: user?.email || '',
          permalink: user?.permalink
        },
        friend: {
          id: friendUser?.id || friend.friend_id,
          name: friendUser?.name || friendUser?.email || 'Unknown User',
          email: friendUser?.email || '',
          permalink: friendUser?.permalink,
          avatar_url: avatarUrl
        },
        followersCount: followersCountMap.get(friendUserId) || 0,
        friendsCount: friendsCountMap.get(friendUserId) || 0,
        booksReadCount: booksReadCountMap.get(friendUserId) || 0
      }
    })

    // Transform the data to get friend details
    const friendsList = friendsWithUserDetails?.map(friend => {
      const isUserRequesting = friend.user_id === userId
      const friendData = isUserRequesting ? friend.friend : friend.user
      return {
        id: friend.id,
        friend: {
          ...friendData,
          avatar_url: friendData.avatar_url || null // Include avatar_url in friend object
        },
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