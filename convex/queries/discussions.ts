import { query } from '../_generated/server'
import { v } from 'convex/values'

interface DiscussionResult {
  _id: string
  _creationTime: number
  supabaseId?: string
  title: string
  content?: string
  authorId?: string
  groupId?: string
  bookId?: string
  createdAt: number
  updatedAt: number
}

interface CommentResult {
  _id: string
  _creationTime: number
  supabaseId?: string
  discussionId?: string
  authorId?: string
  content?: string
  createdAt: number
  updatedAt: number
}

/**
 * List discussions with pagination and filters
 */
export const listDiscussions = query({
  args: {
    search: v.optional(v.string()),
    groupId: v.optional(v.string()),
    bookId: v.optional(v.string()),
    authorId: v.optional(v.string()),
    sortBy: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let discussions = await ctx.db.query('discussions').collect()

    // Apply filters
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      discussions = discussions.filter(d => 
        d.title?.toLowerCase().includes(searchLower) ||
        d.content?.toLowerCase().includes(searchLower)
      )
    }

    if (args.groupId) {
      discussions = discussions.filter(d => d.groupId === args.groupId)
    }

    if (args.bookId) {
      discussions = discussions.filter(d => d.bookId === args.bookId)
    }

    if (args.authorId) {
      discussions = discussions.filter(d => d.authorId === args.authorId)
    }

    // Sort
    const sortBy = args.sortBy ?? 'createdAt'
    discussions.sort((a, b) => {
      const aVal = a[sortBy as keyof DiscussionResult]
      const bVal = b[sortBy as keyof DiscussionResult]
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return bVal - aVal
      }
      return 0
    })

    // Pagination
    const limit = args.limit ?? 20
    const offset = args.offset ?? 0
    return discussions.slice(offset, offset + limit)
  },
})

/**
 * Get total count of discussions
 */
export const getTotalDiscussionsCount = query({
  args: {
    search: v.optional(v.string()),
    groupId: v.optional(v.string()),
    bookId: v.optional(v.string()),
    authorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let discussions = await ctx.db.query('discussions').collect()
    
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      discussions = discussions.filter(d => 
        d.title?.toLowerCase().includes(searchLower) ||
        d.content?.toLowerCase().includes(searchLower)
      )
    }
    if (args.groupId) {
      discussions = discussions.filter(d => d.groupId === args.groupId)
    }
    if (args.bookId) {
      discussions = discussions.filter(d => d.bookId === args.bookId)
    }
    if (args.authorId) {
      discussions = discussions.filter(d => d.authorId === args.authorId)
    }
    
    return discussions.length
  },
})

/**
 * Get a single discussion by ID
 */
export const getDiscussion = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query('discussions')
      .filter(q => q.or(q.eq('supabaseId', args.id), q.eq('_id', args.id)))
      .take(1)
    return results[0] ?? null
  },
})

/**
 * Get comments for a discussion
 */
export const getCommentsByDiscussion = query({
  args: { discussionId: v.string() },
  handler: async (ctx, args) => {
    const discussionResults = await ctx.db
      .query('discussions')
      .filter(q => q.or(q.eq('supabaseId', args.discussionId), q.eq('_id', args.discussionId)))
      .take(1)
    const discussion = discussionResults[0]
    if (!discussion) return []

    const discussionSupabaseId = discussion.supabaseId ?? discussion._id
    
    const comments = await ctx.db
      .query('comments')
      .filter(q => q.eq('discussionId', discussionSupabaseId))
      .take(500)
    
    // Sort by createdAt ascending (oldest first)
    return comments.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
  },
})