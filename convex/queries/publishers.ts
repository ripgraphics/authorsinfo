import { query } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Get a single publisher by ID
 */
export const getPublisher = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const publishers = await ctx.db.query('publishers').collect()
    return publishers.find((p: any) => p.supabaseId === args.id || p._id === args.id) ?? null
  },
})

/**
 * List all publishers
 */
export const listPublishers = query({
  args: {},
  handler: async (ctx, _args) => {
    const publishers = await ctx.db.query('publishers').collect()
    // Sort by name in JavaScript since we don't have typed indexes yet
    return publishers.sort((a: any, b: any) => 
      (a.name ?? '').localeCompare(b.name ?? '')
    )
  },
})
