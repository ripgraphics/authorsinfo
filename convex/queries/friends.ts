import { query } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Check if two users are friends
 */
export const checkFriendship = query({
  args: { userId1: v.string(), userId2: v.string() },
  handler: async (ctx, args) => {
    const [user1Results, user2Results] = await Promise.all([
      ctx.db.query('users').filter(q => q.or(q.eq('supabaseId', args.userId1), q.eq('_id', args.userId1))).take(1),
      ctx.db.query('users').filter(q => q.or(q.eq('supabaseId', args.userId2), q.eq('_id', args.userId2))).take(1),
    ])
    const user1 = user1Results[0]
    const user2 = user2Results[0]
    if (!user1 || !user2) return false

    const friendResults = await ctx.db
      .query('userFriends')
      .filter(q => q.or(
        q.and(q.eq('userId', user1.supabaseId ?? user1._id), q.eq('friendId', user2.supabaseId ?? user2._id)),
        q.and(q.eq('userId', user2.supabaseId ?? user2._id), q.eq('friendId', user1.supabaseId ?? user1._id))
      ))
      .take(1)

    return friendResults.length > 0 && friendResults[0].status === 'accepted'
  },
})

/**
 * Check if a user is following another entity
 */
export const checkFollowing = query({
  args: { followerId: v.string(), targetId: v.string(), entityType: v.string() },
  handler: async (ctx, args) => {
    const followerResults = await ctx.db
      .query('users')
      .filter(q => q.or(q.eq('supabaseId', args.followerId), q.eq('_id', args.followerId)))
      .take(1)
    const follower = followerResults[0]
    if (!follower) return false

    let targetResults
    if (args.entityType === 'user') {
      targetResults = await ctx.db
        .query('users')
        .filter(q => q.or(q.eq('supabaseId', args.targetId), q.eq('_id', args.targetId)))
        .take(1)
    } else if (args.entityType === 'author') {
      targetResults = await ctx.db
        .query('authors')
        .filter(q => q.or(q.eq('supabaseId', args.targetId), q.eq('_id', args.targetId)))
        .take(1)
    } else if (args.entityType === 'book') {
      targetResults = await ctx.db
        .query('books')
        .filter(q => q.or(q.eq('supabaseId', args.targetId), q.eq('_id', args.targetId)))
        .take(1)
    } else if (args.entityType === 'group') {
      targetResults = await ctx.db
        .query('groups')
        .filter(q => q.or(q.eq('supabaseId', args.targetId), q.eq('_id', args.targetId)))
        .take(1)
    }

    const target = targetResults?.[0]
    if (!target) return false

    const followResults = await ctx.db
      .query('follows')
      .filter(q => q.and(q.eq('followerId', follower.supabaseId ?? follower._id), q.eq('followingId', target.supabaseId ?? target._id)))
      .take(1)

    return followResults.length > 0
  },
})

/**
 * Get friends list for a user
 */
export const getFriends = query({
  args: { userId: v.string(), page: v.optional(v.number()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userResults = await ctx.db
      .query('users')
      .filter(q => q.or(q.eq('supabaseId', args.userId), q.eq('_id', args.userId)))
      .take(1)
    const user = userResults[0]
    if (!user) return { friends: [], count: 0 }

    const friendResults = await ctx.db
      .query('userFriends')
      .filter(q => q.or(q.eq('userId', user.supabaseId ?? user._id), q.eq('friendId', user.supabaseId ?? user._id)))
      .take(500)

    const friendIds = new Set<string>()
    friendResults.forEach(f => {
      if (f.status !== 'accepted') return
      if (f.userId === user._id) friendIds.add(f.friendId)
      if (f.friendId === user._id) friendIds.add(f.userId)
    })

    if (friendIds.size === 0) return { friends: [], count: 0 }

    const allUsers = await ctx.db.query('users').take(1000)
    const userMap = new Map<string, any>()
    for (const u of allUsers) {
      if (u.supabaseId) userMap.set(u.supabaseId, u)
      if (u._id) userMap.set(u._id, u)
    }

    const friendsList = Array.from(friendIds).map(id => {
      const u = userMap.get(id)
      return u ? { id: u.supabaseId ?? u._id, name: u.name, email: u.email } : null
    }).filter(Boolean)

    const page = args.page ?? 1
    const limit = args.limit ?? 50
    const offset = (page - 1) * limit

    return {
      friends: friendsList.slice(offset, offset + limit),
      count: friendsList.length,
    }
  },
})

/**
 * Get mutual friends between two users
 */
export const getMutualFriendsCount = query({
  args: { userId1: v.string(), userId2: v.string() },
  handler: async (ctx, args) => {
    const [user1Results, user2Results] = await Promise.all([
      ctx.db.query('users').filter(q => q.or(q.eq('supabaseId', args.userId1), q.eq('_id', args.userId1))).take(1),
      ctx.db.query('users').filter(q => q.or(q.eq('supabaseId', args.userId2), q.eq('_id', args.userId2))).take(1),
    ])
    const user1 = user1Results[0]
    const user2 = user2Results[0]
    if (!user1 || !user2) return { count: 0 }

    const [friends1Results, friends2Results] = await Promise.all([
      ctx.db.query('userFriends').filter(q => q.or(q.eq('userId', user1.supabaseId ?? user1._id), q.eq('friendId', user1.supabaseId ?? user1._id))).take(500),
      ctx.db.query('userFriends').filter(q => q.or(q.eq('userId', user2.supabaseId ?? user2._id), q.eq('friendId', user2.supabaseId ?? user2._id))).take(500),
    ])

    const friends1 = new Set(friends1Results
      .filter(f => f.status === 'accepted')
      .map(f => f.userId === (user1.supabaseId ?? user1._id) ? f.friendId : f.userId))
    const friends2 = new Set(friends2Results
      .filter(f => f.status === 'accepted')
      .map(f => f.userId === user2._id ? f.friendId : f.userId))

    let mutual = 0
    for (const id of friends1) {
      if (friends2.has(id)) mutual++
    }

    return { count: mutual }
  },
})