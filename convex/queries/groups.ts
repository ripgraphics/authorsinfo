import { query } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Get a group by ID (Supabase UUID or Convex _id)
 */
export const getGroup = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query('groups')
      .filter(q => q.or(q.eq('supabaseId', args.id), q.eq('_id', args.id)))
      .take(1)
    return results[0] ?? null
  },
})

/**
 * Get user privacy settings
 */
export const getUserPrivacySettings = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query('userPrivacySettings')
      .filter(q => q.eq('userId', args.userId))
      .take(1)
    return results[0] ?? null
  },
})

/**
 * Get group members
 */
export const getGroupMembers = query({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    // Resolve group to Convex _id
    const groupResults = await ctx.db
      .query('groups')
      .filter(q => q.or(q.eq('supabaseId', args.groupId), q.eq('_id', args.groupId)))
      .take(1)
    const group = groupResults[0]
    if (!group) return []

    const memberResults = await ctx.db
      .query('groupMembers')
      .filter(q => q.and(q.eq('groupId', group.supabaseId ?? group._id), q.eq('status', 'active')))
      .take(500)

    const userIds = memberResults.map(m => m.userId)
    if (userIds.length === 0) return []

    const userResults = await ctx.db
      .query('users')
      .filter(q => q.or(...userIds.map(id => q.eq('supabaseId', id))))
      .take(500)

    const profileResults = await ctx.db
      .query('profiles')
      .filter(q => q.or(...userIds.map(id => q.eq('userId', id))))
      .take(500)

    const userMap = new Map(userResults.map(u => [u.supabaseId, u]))
    const profileMap = new Map(profileResults.map(p => [p.userId, p]))

    return memberResults.map(m => {
      const user = userMap.get(m.userId)
      const profile = profileMap.get(m.userId)
      return {
        userId: m.userId,
        status: m.status,
        joinedAt: m.joinedAt,
        user: user ? {
          id: user.supabaseId ?? user._id,
          name: user.name,
          email: user.email,
          avatarUrl: profile?.avatarImage ?? null,
        } : null,
      }
    }).sort((a, b) => (b.joinedAt ?? 0) - (a.joinedAt ?? 0))
  },
})

/**
 * Get books associated with a group
 */
export const getGroupBooks = query({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    const groupResults = await ctx.db
      .query('groups')
      .filter(q => q.or(q.eq('supabaseId', args.groupId), q.eq('_id', args.groupId)))
      .take(1)
    const group = groupResults[0]
    if (!group) return []

    const gbResults = await ctx.db
      .query('groupBooks')
      .filter(q => q.eq('groupId', group.supabaseId ?? group._id))
      .take(500)

    const bookIds = gbResults.map(gb => gb.bookId)
    if (bookIds.length === 0) return []

    const bookResults = await ctx.db
      .query('books')
      .filter(q => q.or(...bookIds.map(id => q.eq('_id', id))))
      .take(500)

    return bookResults
  },
})