import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getFollowTargetType } from '@/lib/follows-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    // Get the current user (optional - allow viewing friends list without auth)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')

    // If no userId provided and user is logged in, use their ID
    const userId = targetUserId || user?.id

    console.log(`Friends list requested for userId: ${userId}, targetUserId: ${targetUserId}, authenticated: ${!!user?.id}`)

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get accepted friends
    const { data: friends, error } = await supabase
      .from('user_friends')
      .select(
        `
        id,
        user_id,
        friend_id,
        requested_at,
        responded_at
      `
      )
      .or(
        `and(user_id.eq.${userId},status.eq.accepted),and(friend_id.eq.${userId},status.eq.accepted)`
      )
      .order('responded_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching friends:', error)
      return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 })
    }

    console.log(`Found ${(friends || []).length} friend relationships for user ${userId}`)

    // Extract all friend user IDs (the ones that aren't the current user)
    const friendUserIds = ((friends || []) as any[]).map((friend: any) =>
      friend.user_id === userId ? friend.friend_id : friend.user_id
    )

    // Batch fetch all user data, profiles, and stats in parallel - use admin client for speed
    // Only fetch if we have friend IDs to avoid empty array issues with .in() filter
    let usersResult = { data: [] as any[] }
    let profilesResult = { data: [] as any[] }

    if (friendUserIds.length > 0) {
      const results = await Promise.all([
        supabaseAdmin.from('users').select('id, name, email, permalink').in('id', friendUserIds),
        supabaseAdmin
          .from('profiles')
          .select('user_id, avatar_image_id')
          .in('user_id', friendUserIds),
      ])
      usersResult = results[0]
      profilesResult = results[1]
    }

    const users = usersResult.data || []
    const profiles = (profilesResult.data || []) as any[]

    // Get unique avatar_image_ids and fetch image URLs
    const avatarImageIds = Array.from(
      new Set(profiles.map((p: any) => p.avatar_image_id).filter(Boolean))
    )

    const avatarImageMap = new Map()
    if (avatarImageIds.length > 0) {
      const { data: images } = await supabaseAdmin
        .from('images')
        .select('id, url')
        .in('id', avatarImageIds)

      if (images) {
        ;(images as any[]).forEach((img: any) => {
          avatarImageMap.set(img.id, img.url)
        })
      }
    }

    // Batch fetch followers counts for all friends in a single query (like followers does)
    const userTargetType = await getFollowTargetType('user')
    const followersCountMap = new Map<string, number>()

    if (userTargetType && friendUserIds.length > 0) {
      const { data: userFollowsData } = await supabaseAdmin
        .from('follows')
        .select('following_id')
        .eq('target_type_id', userTargetType.id)
        .in('following_id', friendUserIds)

      if (userFollowsData) {
        // Count followers for each user
        userFollowsData.forEach((follow: any) => {
          const currentCount = followersCountMap.get(follow.following_id) || 0
          followersCountMap.set(follow.following_id, currentCount + 1)
        })
      }

      // Initialize all users with 0 followers if they don't have any
      friendUserIds.forEach((id) => {
        if (!followersCountMap.has(id)) {
          followersCountMap.set(id, 0)
        }
      })
    }

    // Batch fetch friends counts - use admin client for speed
    const [friendsDataResult, reverseFriendsDataResult] = await Promise.all([
      supabaseAdmin
        .from('user_friends')
        .select('user_id, friend_id')
        .in('user_id', friendUserIds)
        .eq('status', 'accepted'),
      supabaseAdmin
        .from('user_friends')
        .select('user_id, friend_id')
        .in('friend_id', friendUserIds)
        .eq('status', 'accepted'),
    ])

    const friendsData = friendsDataResult.data || []
    const reverseFriendsData = reverseFriendsDataResult.data || []

    // Count friends per user
    const friendsCountMap = new Map<string, number>()
    if (friendsDataResult.data) {
      friendsDataResult.data.forEach((friendship: any) => {
        const currentCount = friendsCountMap.get(friendship.user_id) || 0
        friendsCountMap.set(friendship.user_id, currentCount + 1)
      })
    }
    if (reverseFriendsDataResult.data) {
      reverseFriendsDataResult.data.forEach((friendship: any) => {
        const currentCount = friendsCountMap.get(friendship.friend_id) || 0
        friendsCountMap.set(friendship.friend_id, currentCount + 1)
      })
    }

    // Initialize all users with 0 friends if they don't have any
    friendUserIds.forEach((id) => {
      if (!friendsCountMap.has(id)) {
        friendsCountMap.set(id, 0)
      }
    })

    // Batch fetch books read counts - use admin client and count in query
    const booksReadCountMap = new Map<string, number>()
    if (friendUserIds.length > 0) {
      const { data: booksReadData } = await supabaseAdmin
        .from('reading_progress')
        .select('user_id')
        .eq('status', 'completed')
        .in('user_id', friendUserIds)

      if (booksReadData) {
        booksReadData.forEach((progress: any) => {
          const currentCount = booksReadCountMap.get(progress.user_id) || 0
          booksReadCountMap.set(progress.user_id, currentCount + 1)
        })
      }

      // Initialize all users with 0 books read if they don't have any
      friendUserIds.forEach((id) => {
        if (!booksReadCountMap.has(id)) {
          booksReadCountMap.set(id, 0)
        }
      })
    }

    // Create maps for quick lookup
    const userMap = new Map((users as any[]).map((u: any) => [u.id, u]))
    const profileMap = new Map((profiles as any[]).map((p: any) => [p.user_id, p]))

    // Build friends with user details
    const friendsWithUserDetails = ((friends || []) as any[]).map((friend: any) => {
      const friendUserId = friend.user_id === userId ? friend.friend_id : friend.user_id
      const user = userMap.get(friend.user_id)
      const friendUser = userMap.get(friend.friend_id)
      const profile = profileMap.get(friendUserId) as any
      const avatarImageId = profile?.avatar_image_id
      const avatarUrl = avatarImageId ? avatarImageMap.get(avatarImageId) : null

      // Get avatar URLs for both users
      const userProfile = profileMap.get(friend.user_id) as any
      const friendProfile = profileMap.get(friend.friend_id) as any
      const userAvatarId = userProfile?.avatar_image_id
      const friendAvatarId = friendProfile?.avatar_image_id
      const userAvatarUrl = userAvatarId ? avatarImageMap.get(userAvatarId) : null
      const friendAvatarUrl = friendAvatarId ? avatarImageMap.get(friendAvatarId) : null

      return {
        ...friend,
        user: {
          id: user?.id || friend.user_id,
          name: user?.name || user?.email || 'Unknown User',
          email: user?.email || '',
          permalink: user?.permalink,
          avatar_url: userAvatarUrl || null,
        },
        friend: {
          id: friendUser?.id || friend.friend_id,
          name: friendUser?.name || friendUser?.email || 'Unknown User',
          email: friendUser?.email || '',
          permalink: friendUser?.permalink,
          avatar_url: friendAvatarUrl || null,
        },
        followersCount: followersCountMap.get(friendUserId) || 0,
        friendsCount: friendsCountMap.get(friendUserId) || 0,
        booksReadCount: booksReadCountMap.get(friendUserId) || 0,
      }
    })

    // Transform the data to get friend details
    const friendsList =
      friendsWithUserDetails?.map((friend) => {
        const isUserRequesting = friend.user_id === userId
        const friendData = isUserRequesting ? friend.friend : friend.user
        return {
          id: friend.id,
          friend: {
            ...friendData,
            avatar_url: friendData.avatar_url || null, // Include avatar_url in friend object
          },
          friendshipDate: friend.responded_at,
          mutualFriendsCount: 0, // Will be calculated separately
          followersCount: friend.followersCount || 0,
          friendsCount: friend.friendsCount || 0,
          booksReadCount: friend.booksReadCount || 0,
        }
      }) || []

    // Get total count for pagination - use admin client for speed
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('user_friends')
      .select('*', { count: 'exact', head: true })
      .or(
        `and(user_id.eq.${userId},status.eq.accepted),and(friend_id.eq.${userId},status.eq.accepted)`
      )

    if (countError) {
      console.error('Error counting friends:', countError)
    }

    // Get friend analytics - use admin client for speed
    const { data: analytics } = await supabaseAdmin
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
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
      analytics: analytics || null,
    })
  } catch (error) {
    console.error('Error in friends list:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

