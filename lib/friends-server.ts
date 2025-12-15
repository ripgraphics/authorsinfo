import { supabaseAdmin } from '@/lib/supabase-admin'
import { getFollowTargetType } from '@/lib/follows-server'

/**
 * Get friends list for a user with all stats (server-side only)
 * Similar to getFollowers but for friends
 */
export async function getFriends(userId: string, page = 1, limit = 100) {
  const start = (page - 1) * limit

  // Get accepted friends
  const { data: friends, error, count } = await supabaseAdmin
    .from('user_friends')
    .select(`
      id,
      user_id,
      friend_id,
      requested_at,
      responded_at
    `, { count: 'exact' })
    .or(`and(user_id.eq.${userId},status.eq.accepted),and(friend_id.eq.${userId},status.eq.accepted)`)
    .order('responded_at', { ascending: false })
    .range(start, start + limit - 1)

  if (error) {
    console.error('Error getting friends:', error)
    throw error
  }

  if (!friends || friends.length === 0) {
    return {
      friends: [],
      count: count || 0
    }
  }

  // Extract all friend user IDs (the ones that aren't the current user)
  const friendUserIds = friends.map((friend: any) => 
    (friend as any).user_id === userId ? (friend as any).friend_id : (friend as any).user_id
  )

  // Batch fetch all user data, profiles, and stats in parallel
  const [usersResult, profilesResult] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select('id, name, email, permalink')
      .in('id', friendUserIds),
    supabaseAdmin
      .from('profiles')
      .select('user_id, avatar_image_id')
      .in('user_id', friendUserIds)
  ])

  const users = usersResult.data || []
  const profiles = profilesResult.data || []

  // Get unique avatar_image_ids
  const avatarImageIds = Array.from(new Set(
    profiles.map((p: any) => (p as any).avatar_image_id).filter(Boolean)
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

  // Batch fetch followers counts
  const userTargetType = await getFollowTargetType('user')
  const followersCountMap = new Map<string, number>()
  
  if (userTargetType && friendUserIds.length > 0) {
    const { data: userFollowsData } = await supabaseAdmin
      .from('follows')
      .select('following_id')
      .eq('target_type_id', userTargetType.id)
      .in('following_id', friendUserIds)

    if (userFollowsData) {
      userFollowsData.forEach((follow: any) => {
        const currentCount = followersCountMap.get(follow.following_id) || 0
        followersCountMap.set(follow.following_id, currentCount + 1)
      })
    }
    
    friendUserIds.forEach(id => {
      if (!followersCountMap.has(id)) {
        followersCountMap.set(id, 0)
      }
    })
  }

  // Batch fetch friends counts
  const friendsCountMap = new Map<string, number>()
  if (friendUserIds.length > 0) {
    const [userFriendsData, reverseFriendsData] = await Promise.all([
      supabaseAdmin
        .from('user_friends')
        .select('user_id, friend_id')
        .eq('status', 'accepted')
        .in('user_id', friendUserIds),
      supabaseAdmin
        .from('user_friends')
        .select('user_id, friend_id')
        .eq('status', 'accepted')
        .in('friend_id', friendUserIds)
    ])

    if (userFriendsData.data) {
      userFriendsData.data.forEach((friendship: any) => {
        const currentCount = friendsCountMap.get(friendship.user_id) || 0
        friendsCountMap.set(friendship.user_id, currentCount + 1)
      })
    }
    if (reverseFriendsData.data) {
      reverseFriendsData.data.forEach((friendship: any) => {
        const currentCount = friendsCountMap.get(friendship.friend_id) || 0
        friendsCountMap.set(friendship.friend_id, currentCount + 1)
      })
    }

    friendUserIds.forEach(id => {
      if (!friendsCountMap.has(id)) {
        friendsCountMap.set(id, 0)
      }
    })
  }

  // Batch fetch books read counts
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

    friendUserIds.forEach(id => {
      if (!booksReadCountMap.has(id)) {
        booksReadCountMap.set(id, 0)
      }
    })
  }

  // Create maps for quick lookup
  const userMap = new Map(users.map((u: any) => [u.id, u]))
  const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]))

  const friendsList = friends.map((friend: any) => {
    const friendUserId = (friend as any).user_id === userId ? (friend as any).friend_id : (friend as any).user_id
    const friendUser = userMap.get(friendUserId)
    const profile = profileMap.get(friendUserId)
    const avatarImageId = (profile as any)?.avatar_image_id
    const avatarUrl = avatarImageId ? avatarImageMap.get(avatarImageId) : null

    return {
      id: (friend as any).id,
      friend: {
        id: (friendUser as any)?.id || friendUserId,
        name: (friendUser as any)?.name || (friendUser as any)?.email || 'Unknown User',
        email: (friendUser as any)?.email || '',
        permalink: (friendUser as any)?.permalink,
        avatar_url: avatarUrl
      },
      friendshipDate: (friend as any).responded_at,
      mutualFriendsCount: 0,
      followersCount: followersCountMap.get(friendUserId) || 0,
      friendsCount: friendsCountMap.get(friendUserId) || 0,
      booksReadCount: booksReadCountMap.get(friendUserId) || 0
    }
  })

  return {
    friends: friendsList,
    count: count || friendsList.length
  }
}

