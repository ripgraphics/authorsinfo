import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params
    const supabase = await createRouteHandlerClientAsync()

    // Use Promise.all for parallel queries to speed up the response
    const [userData, booksRead, friends, reverseFriends, profileData] = await Promise.all([
      // Get user data from the users table (this is the main table)
      (supabase.from('users') as any)
        .select('id, name, email, created_at, permalink, location, website')
        .eq('id', userId)
        .single(),

      // Get books read count from reading_progress where status indicates completion
      (supabase.from('reading_progress') as any)
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'completed'),

      // Get friends count from user_friends where status is 'accepted'
      (supabase.from('user_friends') as any)
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'accepted'),

      // Get reverse friends count (where this user is the friend)
      (supabase.from('user_friends') as any)
        .select('id', { count: 'exact' })
        .eq('friend_id', userId)
        .eq('status', 'accepted'),

      // Get profile bio if available
      (supabase.from('profiles') as any).select('bio').eq('user_id', userId).single(),
    ])

    // Check for user data error first
    if (userData.error) {
      console.error('Error fetching user data:', userData.error)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Log errors for other queries but don't fail the request
    if (booksRead.error) {
      console.error('Error fetching books read:', booksRead.error)
    }
    if (friends.error) {
      console.error('Error fetching friends count:', friends.error)
    }
    if (reverseFriends.error) {
      console.error('Error fetching reverse friends count:', reverseFriends.error)
    }
    if (profileData.error) {
      console.error('Error fetching profile data:', profileData.error)
    }

    // Calculate total friends count
    const totalFriends = (friends?.data?.length || 0) + (reverseFriends?.data?.length || 0)

    const response = NextResponse.json({
      user: {
        ...(userData.data || {}),
        bio: profileData?.data?.bio || null,
      },
      stats: {
        booksRead: booksRead?.data?.length || 0,
        friendsCount: totalFriends,
        location: userData.data?.location || null,
        website: userData.data?.website || null,
        joinedDate: userData.data?.created_at,
      },
    })

    // Add caching headers for better performance in feeds
    response.headers.set('Cache-Control', 'public, max-age=300') // Cache for 5 minutes
    response.headers.set('ETag', `"${userId}-${Date.now()}"`)

    return response
  } catch (error) {
    console.error('Error fetching user hover data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
