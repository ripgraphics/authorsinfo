import { query } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Get follower information for an entity (author, book, user, group)
 */
export const getFollowers = query({
  args: {
    entityId: v.string(),
    entityType: v.string(), // 'author', 'book', 'user', 'group'
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const page = args.page ?? 1
    const limit = args.limit ?? 50
    const offset = (page - 1) * limit

    // Resolve entity to Convex _id
    let entityResults
    if (args.entityType === 'user') {
      entityResults = await ctx.db
        .query('users')
        .filter(q => q.or(q.eq('supabaseId', args.entityId), q.eq('_id', args.entityId)))
        .take(1)
    } else if (args.entityType === 'author') {
      entityResults = await ctx.db
        .query('authors')
        .filter(q => q.or(q.eq('supabaseId', args.entityId), q.eq('_id', args.entityId)))
        .take(1)
    } else if (args.entityType === 'book') {
      entityResults = await ctx.db
        .query('books')
        .filter(q => q.or(q.eq('supabaseId', args.entityId), q.eq('_id', args.entityId)))
        .take(1)
    } else if (args.entityType === 'group') {
      entityResults = await ctx.db
        .query('groups')
        .filter(q => q.or(q.eq('supabaseId', args.entityId), q.eq('_id', args.entityId)))
        .take(1)
    }

    const entity = entityResults?.[0]
    if (!entity) return { followers: [], count: 0, page, limit }

    const entitySupabaseId = entity.supabaseId ?? entity._id
    const followResults = await ctx.db
      .query('follows')
      .filter(q => q.eq('followingId', entitySupabaseId))
      .take(500)

    const total = followResults.length
    const followers = followResults.slice(offset, offset + limit)

    return { followers, count: total, page, limit }
  },
})

/**
 * Get follower count for an entity
 */
export const getFollowersCount = query({
  args: {
    entityId: v.string(),
    entityType: v.string(),
  },
  handler: async (ctx, args) => {
    let entityResults
    if (args.entityType === 'user') {
      entityResults = await ctx.db
        .query('users')
        .filter(q => q.or(q.eq('supabaseId', args.entityId), q.eq('_id', args.entityId)))
        .take(1)
    } else if (args.entityType === 'author') {
      entityResults = await ctx.db
        .query('authors')
        .filter(q => q.or(q.eq('supabaseId', args.entityId), q.eq('_id', args.entityId)))
        .take(1)
    } else if (args.entityType === 'book') {
      entityResults = await ctx.db
        .query('books')
        .filter(q => q.or(q.eq('supabaseId', args.entityId), q.eq('_id', args.entityId)))
        .take(1)
    } else if (args.entityType === 'group') {
      entityResults = await ctx.db
        .query('groups')
        .filter(q => q.or(q.eq('supabaseId', args.entityId), q.eq('_id', args.entityId)))
        .take(1)
    }

    const entity = entityResults?.[0]
    if (!entity) return { count: 0 }

    const entitySupabaseId = entity.supabaseId ?? entity._id
    const count = await ctx.db
      .query('follows')
      .filter(q => q.eq('followingId', entitySupabaseId))
      .take(500)
      .then(r => r.length)

    return { count }
  },
})

/**
 * Check if current user is following an entity
 */
export const checkFollowStatus = query({
  args: {
    entityId: v.string(),
    entityType: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Resolve both user and entity
    const [userResults, entityResults] = await Promise.all([
      ctx.db.query('users').filter(q => q.or(q.eq('supabaseId', args.userId), q.eq('_id', args.userId))).take(1),
      (() => {
        if (args.entityType === 'user') return ctx.db.query('users').filter(q => q.or(q.eq('supabaseId', args.entityId), q.eq('_id', args.entityId))).take(1)
        if (args.entityType === 'author') return ctx.db.query('authors').filter(q => q.or(q.eq('supabaseId', args.entityId), q.eq('_id', args.entityId))).take(1)
        if (args.entityType === 'book') return ctx.db.query('books').filter(q => q.or(q.eq('supabaseId', args.entityId), q.eq('_id', args.entityId))).take(1)
        if (args.entityType === 'group') return ctx.db.query('groups').filter(q => q.or(q.eq('supabaseId', args.entityId), q.eq('_id', args.entityId))).take(1)
        return Promise.resolve([])
      })(),
    ])

    const user = userResults[0]
    const entity = entityResults[0]
    if (!user || !entity) return { isFollowing: false }

    const userSupabaseId = user.supabaseId ?? user._id
    const entitySupabaseId = entity.supabaseId ?? entity._id
    const followResults = await ctx.db
      .query('follows')
      .filter(q => q.and(q.eq('followerId', userSupabaseId), q.eq('followingId', entitySupabaseId)))
      .take(1)

    return { isFollowing: followResults.length > 0 }
  },
})
