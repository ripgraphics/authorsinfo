import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'


export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()
    const { userIds } = await request.json()

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs array is required' }, { status: 400 })
    }

    // Limit to prevent abuse
    if (userIds.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 users per request' }, { status: 400 })
    }

    // Fetch all user data in parallel
    const [usersData, readingProgress, userFriends, profiles] = await Promise.all([
      // Get basic user data
      (supabase
        .from('users') as any)
        .select('id, name, email, created_at, permalink, location, website')
        .in('id', userIds),

      // Get reading progress for all users
      (supabase
        .from('reading_progress') as any)
        .select('user_id, status')
        .in('user_id', userIds)
        .eq('status', 'completed'),

      // Get friends data for all users
      (supabase
        .from('user_friends') as any)
        .select('user_id, friend_id, status')
        .in('user_id', userIds)
        .eq('status', 'accepted'),

      // Get profile data for all users
      (supabase
        .from('profiles') as any)
        .select('user_id, bio')
        .in('user_id', userIds)
    ])

    // Check for errors
    if (usersData.error) {
      console.error('Error fetching users:', usersData.error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Process the data
    const userStatsMap: Record<string, any> = {}

    // Initialize all users
    usersData.data?.forEach((user: any) => {
      userStatsMap[user.id] = {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        permalink: user.permalink,
        location: user.location,
        website: user.website,
        booksRead: 0,
        friendsCount: 0,
        followersCount: 0,
        bio: null
      }
    })

    // Count books read
    readingProgress.data?.forEach((progress: any) => {
      if (userStatsMap[progress.user_id]) {
        userStatsMap[progress.user_id].booksRead++
      }
    })

    // Count friends and followers
    userFriends.data?.forEach((friendship: any) => {
      if (userStatsMap[friendship.user_id]) {
        userStatsMap[friendship.user_id].friendsCount++
      }
      if (userStatsMap[friendship.friend_id]) {
        userStatsMap[friendship.friend_id].followersCount++
      }
    })

    // Add profile bio
    profiles.data?.forEach((profile: any) => {
      if (userStatsMap[profile.user_id]) {
        userStatsMap[profile.user_id].bio = profile.bio
      }
    })

    // Convert to array format
    const results = Object.values(userStatsMap).map(user => ({
      id: user.id,
      stats: {
        booksRead: user.booksRead,
        friendsCount: user.friendsCount,
        followersCount: user.followersCount,
        location: user.location,
        website: user.website,
        joinedDate: user.created_at,
        bio: user.bio
      }
    }))

    const response = NextResponse.json({ users: results })
    
    // Add caching headers
    response.headers.set('Cache-Control', 'public, max-age=300') // Cache for 5 minutes
    response.headers.set('ETag', `"bulk-${userIds.length}-${Date.now()}"`)

    return response

  } catch (error) {
    console.error('Error fetching bulk user hover data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
