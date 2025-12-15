import { supabaseAdmin } from '@/lib/supabase-admin'
import { Database } from '@/types/database'

export type FollowTargetType = 'user' | 'book' | 'author' | 'publisher' | 'group'

interface FollowTargetTypeData {
  id: number
  name: string
  description: string
}

// Get all available target types
export async function getFollowTargetTypes(): Promise<FollowTargetTypeData[]> {
  const { data, error } = await supabaseAdmin
    .from('follow_target_types')
    .select('*')
    .order('id')

  if (error) {
    console.error('Error fetching follow target types:', error)
    return []
  }

  return data || []
}

// Get a specific target type by name
export async function getFollowTargetType(name: FollowTargetType): Promise<FollowTargetTypeData | null> {
  const { data, error } = await supabaseAdmin
    .from('follow_target_types')
    .select('*')
    .eq('name', name)
    .single()

  if (error) {
    console.error(`Error fetching follow target type ${name}:`, error)
    return null
  }

  return data
}

// Get followers count for an entity
export async function getFollowersCount(followingId: string | number, targetType: FollowTargetType) {
  const targetTypeData = await getFollowTargetType(targetType)
  if (!targetTypeData) {
    throw new Error(`Invalid target type: ${targetType}`)
  }

  const { count, error } = await supabaseAdmin
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', followingId)
    .eq('target_type_id', targetTypeData.id)

  if (error) {
    console.error('Error getting followers count:', error)
    throw error
  }

  return count || 0
}

// Get followers for an entity with pagination
export async function getFollowers(followingId: string | number, targetType: FollowTargetType, page = 1, limit = 10) {
  const targetTypeData = await getFollowTargetType(targetType)
  if (!targetTypeData) {
    throw new Error(`Invalid target type: ${targetType}`)
  }
  
  const start = (page - 1) * limit

  // First get the follows data
  const { data: followsData, error: followsError, count } = await supabaseAdmin
    .from('follows')
    .select('follower_id, created_at', { count: 'exact' })
    .eq('following_id', followingId)
    .eq('target_type_id', targetTypeData.id)
    .order('created_at', { ascending: false })
    .range(start, start + limit - 1)

  if (followsError) {
    console.error('Error getting follows:', followsError)
    throw followsError
  }

  if (!followsData || followsData.length === 0) {
    return {
      followers: [],
      count: count || 0
    }
  }

  // Get user IDs from follows
  const followerIds = followsData.map((follow: any) => (follow as any).follower_id)

  // Fetch user details from users table and profiles
  const [usersResult, profilesResult] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select('id, name, email, permalink')
      .in('id', followerIds),
    supabaseAdmin
      .from('profiles')
      .select('user_id, avatar_image_id')
      .in('user_id', followerIds)
  ])

  const users = usersResult.data || []
  const profiles = profilesResult.data || []

  // Create profile map by user_id
  const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]))

  // Get unique avatar_image_ids
  const avatarImageIds = Array.from(new Set(
    profiles
      .map((p: any) => p.avatar_image_id)
      .filter(Boolean)
  ))

  // Fetch avatar URLs from images table
  let avatarImageMap = new Map()
  if (avatarImageIds.length > 0) {
    const { data: images } = await supabaseAdmin
      .from('images')
      .select('id, url')
      .in('id', avatarImageIds)

    if (images) {
      avatarImageMap = new Map(images.map((img: any) => [img.id, img.url]))
    }
  }

  // Get followers count for each user (users who follow this user)
  const userTargetType = await getFollowTargetType('user')
  const followersCountMap = new Map<string, number>()
  
  if (userTargetType && followerIds.length > 0) {
    // For each user, get their followers count
    // We'll batch this by querying all follows where following_id is in our list
    const { data: userFollowsData } = await supabaseAdmin
      .from('follows')
      .select('following_id')
      .eq('target_type_id', userTargetType.id)
      .in('following_id', followerIds)

    if (userFollowsData) {
      // Count followers for each user
      userFollowsData.forEach((follow: any) => {
        const currentCount = followersCountMap.get(follow.following_id) || 0
        followersCountMap.set(follow.following_id, currentCount + 1)
      })
    }
    
    // Initialize all users with 0 followers if they don't have any
    followerIds.forEach(id => {
      if (!followersCountMap.has(id)) {
        followersCountMap.set(id, 0)
      }
    })
  }

  // Get friends count for each user
  const friendsCountMap = new Map<string, number>()
  if (followerIds.length > 0) {
    // Get friends where user_id is in our list
    const { data: userFriendsData } = await supabaseAdmin
      .from('user_friends')
      .select('user_id, friend_id')
      .eq('status', 'accepted')
      .in('user_id', followerIds)

    const { data: reverseFriendsData } = await supabaseAdmin
      .from('user_friends')
      .select('user_id, friend_id')
      .eq('status', 'accepted')
      .in('friend_id', followerIds)

    // Count friends for each user
    if (userFriendsData) {
      userFriendsData.forEach((friendship: any) => {
        const currentCount = friendsCountMap.get(friendship.user_id) || 0
        friendsCountMap.set(friendship.user_id, currentCount + 1)
      })
    }
    if (reverseFriendsData) {
      reverseFriendsData.forEach((friendship: any) => {
        const currentCount = friendsCountMap.get(friendship.friend_id) || 0
        friendsCountMap.set(friendship.friend_id, currentCount + 1)
      })
    }

    // Initialize all users with 0 friends if they don't have any
    followerIds.forEach(id => {
      if (!friendsCountMap.has(id)) {
        friendsCountMap.set(id, 0)
      }
    })
  }

  // Get books read count for each user
  const booksReadCountMap = new Map<string, number>()
  if (followerIds.length > 0) {
    const { data: booksReadData } = await supabaseAdmin
      .from('reading_progress')
      .select('user_id')
      .eq('status', 'completed')
      .in('user_id', followerIds)

    if (booksReadData) {
      booksReadData.forEach((progress: any) => {
        const currentCount = booksReadCountMap.get(progress.user_id) || 0
        booksReadCountMap.set(progress.user_id, currentCount + 1)
      })
    }

    // Initialize all users with 0 books read if they don't have any
    followerIds.forEach(id => {
      if (!booksReadCountMap.has(id)) {
        booksReadCountMap.set(id, 0)
      }
    })
  }

  // Create a map of user data for quick lookup
  const userMap = new Map()
  users.forEach((user: any) => {
    const profile = profileMap.get((user as any).id)
    const avatarImageId = (profile as any)?.avatar_image_id
    const avatarUrl = avatarImageId ? avatarImageMap.get(avatarImageId) : null
    const followersCount = followersCountMap.get((user as any).id) || 0
    const friendsCount = friendsCountMap.get((user as any).id) || 0
    const booksReadCount = booksReadCountMap.get((user as any).id) || 0

    userMap.set((user as any).id, {
      id: (user as any).id,
      name: (user as any).name || 'Unknown User',
      email: (user as any).email || 'unknown@email.com',
      permalink: (user as any).permalink,
      avatar_url: avatarUrl,
      followers_count: followersCount,
      friends_count: friendsCount,
      books_read_count: booksReadCount
    })
  })

  return {
    followers: followsData.map((follow: any) => {
      const userData = userMap.get((follow as any).follower_id) || {
        id: (follow as any).follower_id,
        name: 'Unknown User',
        email: 'unknown@email.com',
        permalink: null,
        avatar_url: null,
        followers_count: 0,
        friends_count: 0,
        books_read_count: 0
      }
      return {
        ...userData,
        followSince: (follow as any).created_at
      }
    }),
    count: count || 0
  }
} 