import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params
    const supabase = await createRouteHandlerClientAsync()

    // Get the current user to check permissions
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if the user exists
    const { data: user, error: userError } = await (supabase.from('users') as any)
      .select('id, name, permalink')
      .or(`id.eq.${userId},permalink.eq.${userId}`)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check privacy settings
    const { data: privacySettings } = await (supabase.from('user_privacy_settings') as any)
      .select('*')
      .eq('user_id', (user as any)?.id)
      .single()

    // Determine if current user can see reading progress
    const canViewProgress =
      currentUser?.id === user.id || // Own profile
      privacySettings?.allow_public_reading_profile === true || // Public profile
      (currentUser &&
        privacySettings?.allow_friends_to_see_reading === true &&
        (await checkIfFriends(currentUser.id, user.id, supabase))) || // Friends only
      (currentUser &&
        privacySettings?.allow_followers_to_see_reading === true &&
        (await checkIfFollowing(currentUser.id, user.id, supabase))) // Followers only

    if (!canViewProgress) {
      return NextResponse.json({ error: 'Reading progress is private' }, { status: 403 })
    }

    // Fetch currently reading books
    const { data: currentlyReading, error: currentError } = await (
      supabase.from('reading_progress') as any
    )
      .select(
        `
        id,
        book_id,
        status,
        progress_percentage,
        current_page,
        total_pages,
        started_at,
        updated_at,
        books (
          id,
          title,
          author,
          cover_image_url,
          average_rating,
          review_count,
          pages
        )
      `
      )
      .eq('user_id', (user as any)?.id)
      .eq('status', 'in_progress')
      .order('updated_at', { ascending: false })

    if (currentError) {
      console.error('Error fetching currently reading:', currentError)
      return NextResponse.json({ error: 'Failed to fetch reading progress' }, { status: 500 })
    }

    // Fetch recently completed books
    const { data: recentlyCompleted, error: completedError } = await (
      supabase.from('reading_progress') as any
    )
      .select(
        `
        id,
        book_id,
        progress_percentage,
        completed_at,
        rating,
        review_text,
        books (
          id,
          title,
          author,
          cover_image_url,
          average_rating,
          review_count,
          pages
        )
      `
      )
      .eq('user_id', (user as any)?.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(5)

    if (completedError) {
      console.error('Error fetching completed books:', completedError)
      return NextResponse.json({ error: 'Failed to fetch completed books' }, { status: 500 })
    }

    // Fetch reading statistics
    const { data: readingStats, error: statsError } = await (supabase.rpc as any)(
      'get_user_profile_stats',
      { user_uuid: (user as any)?.id }
    )

    if (statsError) {
      console.error('Error fetching reading stats:', statsError)
      // Continue without stats if they fail
    }

    // Fetch reading goals if they exist
    const { data: readingGoals, error: goalsError } = await (supabase.from('reading_goals') as any)
      .select('*')
      .eq('user_id', (user as any)?.id)
      .eq('year', new Date().getFullYear())
      .single()

    // Calculate additional statistics
    const totalPagesRead =
      currentlyReading?.reduce((sum: number, book: any) => sum + (book.current_page || 0), 0) || 0

    const averageRating =
      recentlyCompleted?.length > 0
        ? recentlyCompleted.reduce((sum: number, book: any) => sum + (book.rating || 0), 0) /
          recentlyCompleted.length
        : 0

    const response = {
      currentlyReading: currentlyReading || [],
      recentlyCompleted: recentlyCompleted || [],
      readingStats: readingStats?.[0] || {},
      readingGoals: readingGoals || null,
      additionalStats: {
        totalPagesRead,
        averageRating: Math.round(averageRating * 10) / 10,
        readingStreak: readingStats?.[0]?.reading_streak_days || 0,
        profileCompletion: readingStats?.[0]?.profile_completion || 0,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in reading progress API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to check if two users are friends
async function checkIfFriends(userId1: string, userId2: string, supabase: any): Promise<boolean> {
  const { data: friendship } = await (supabase.from('user_friends') as any)
    .select('id')
    .or(
      `and(user_id.eq.${userId1},friend_id.eq.${userId2}),and(user_id.eq.${userId2},friend_id.eq.${userId1})`
    )
    .eq('status', 'accepted')
    .single()

  return !!friendship
}

// Helper function to check if user1 is following user2
async function checkIfFollowing(
  followerId: string,
  targetId: string,
  supabase: any
): Promise<boolean> {
  const { data: follow } = await (supabase.from('follows') as any)
    .select('id')
    .eq('follower_id', followerId)
    .eq('target_id', targetId)
    .eq('target_type', 'user')
    .single()

  return !!follow
}
