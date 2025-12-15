import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const supabase = await createRouteHandlerClientAsync()

    // Get user profile data
    const { data: userProfile, error: profileError } = await (supabase
      .from('users') as any)
      .select('name, email, created_at, permalink, location, website')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get books read count
    const { data: booksRead, error: booksError } = await (supabase
      .from('reading_progress') as any)
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'completed')

    if (booksError) {
      console.error('Error fetching books read:', booksError)
    }

    // Get friends count
    const { data: friends, error: friendsError } = await (supabase
      .from('user_friends') as any)
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'accepted')

    if (friendsError) {
      console.error('Error fetching friends count:', friendsError)
    }

    // Get reverse friends count (where user is the friend)
    const { data: reverseFriends, error: reverseFriendsError } = await (supabase
      .from('user_friends') as any)
      .select('id', { count: 'exact' })
      .eq('friend_id', userId)
      .eq('status', 'accepted')

    if (reverseFriendsError) {
      console.error('Error fetching reverse friends count:', reverseFriendsError)
    }

    // Calculate total friends count
    const totalFriends = (friends?.length || 0) + (reverseFriends?.length || 0)

    // Get currently reading books
    const { data: currentlyReading, error: readingError } = await (supabase
      .from('reading_progress') as any)
      .select(`
        id,
        status,
        progress_percentage,
        books (
          id,
          title,
          authors (
            name
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'reading')
      .limit(3)

    if (readingError) {
      console.error('Error fetching currently reading:', readingError)
    }

    // Get recent photos
    const { data: recentPhotos, error: photosError } = await (supabase
      .from('images') as any)
      .select('id, image_url, thumbnail_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(6)

    if (photosError) {
      console.error('Error fetching recent photos:', photosError)
    }

    return NextResponse.json({
      user: userProfile,
      stats: {
        booksRead: booksRead?.length || 0,
        friendsCount: totalFriends,
        location: (userProfile as any)?.location || null,
        website: (userProfile as any)?.website || null,
        joinedDate: (userProfile as any)?.created_at
      },
      currentlyReading: currentlyReading || [],
      recentPhotos: recentPhotos || []
    })

  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 