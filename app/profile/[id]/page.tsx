import { supabaseAdmin } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ClientProfilePage } from "./client"

export const dynamic = "force-dynamic"

interface ProfilePageProps {
  params: { id: string }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params

  try {
    // First, try to find user by permalink
    let user = null
    let error = null

    // Check if the ID looks like a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)

    if (isUUID) {
      // Try to find by UUID first
      const { data: uuidUser, error: uuidError } = await supabaseAdmin
        .from('users')
        .select('id, name, email, created_at, permalink, location, website')
        .eq('id', id)
        .single()

      if (!uuidError && uuidUser) {
        user = uuidUser
      } else {
        // If not found by UUID, try by permalink
        const { data: permalinkUser, error: permalinkError } = await supabaseAdmin
          .from('users')
          .select('id, name, email, created_at, permalink, location, website')
          .eq('permalink', id)
          .single()

        if (!permalinkError && permalinkUser) {
          user = permalinkUser
        } else {
          error = permalinkError
        }
      }
    } else {
      // Try to find by permalink
      const { data: permalinkUser, error: permalinkError } = await supabaseAdmin
        .from('users')
        .select('id, name, email, created_at, permalink, location, website')
        .eq('permalink', id)
        .single()

      if (!permalinkError && permalinkUser) {
        user = permalinkUser
      } else {
        error = permalinkError
      }
    }

    if (error || !user) {
      console.error("User not found:", error)
      notFound()
    }

    // Fetch user statistics
    let userStats = {
      booksRead: 0,
      friendsCount: 0,
      followersCount: 0, // Added missing followersCount
      location: user.location, // Now available from the users table
      website: user.website, // Now available from the users table
      joinedDate: user.created_at
    }

    try {
      // Get books read count
      const { data: booksRead, error: booksError } = await supabaseAdmin
        .from('reading_progress')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'completed')

      if (!booksError) {
        userStats.booksRead = booksRead?.length || 0
        console.log('📚 Books Read Query:', { booksRead: booksRead?.length, error: booksError })
      }

      // Get friends count
      const { data: friends, error: friendsError } = await supabaseAdmin
        .from('user_friends')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      const { data: reverseFriends, error: reverseFriendsError } = await supabaseAdmin
        .from('user_friends')
        .select('id', { count: 'exact' })
        .eq('friend_id', user.id)
        .eq('status', 'accepted')

      if (!friendsError && !reverseFriendsError) {
        userStats.friendsCount = (friends?.length || 0) + (reverseFriends?.length || 0)
        // Calculate followers count (users who have this user as a friend)
        userStats.followersCount = reverseFriends?.length || 0
        
        console.log('👥 Friends Query:', { 
          friends: friends?.length, 
          reverseFriends: reverseFriends?.length,
          totalFriends: userStats.friendsCount,
          followers: userStats.followersCount
        })
      }
    } catch (statsError) {
      console.error("Error fetching user stats:", statsError)
      // Continue with default values if stats fail
    }

    // Use placeholders for avatar/cover since we're mocking most of the data
    const avatarUrl = "/placeholder.svg?height=200&width=200"
    const coverImageUrl = "/placeholder.svg?height=400&width=1200"

    // Temporary debug logging
    console.log('🔍 Profile Page Debug:', {
      user: user,
      userStats: userStats,
      booksRead: userStats.booksRead,
      friendsCount: userStats.friendsCount,
      followersCount: userStats.followersCount
    })

    return (
      <ClientProfilePage
        user={user}
        userStats={userStats}
        avatarUrl={avatarUrl}
        coverImageUrl={coverImageUrl}
        params={{ id }}
      />
    )
  } catch (error) {
    console.error("Error loading user profile:", error)
    notFound()
  }
}