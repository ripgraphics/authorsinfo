import { query } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Get event registrations for an event
 */
export const getEventRegistrations = query({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    // Use collect and filter since we don't have typed indexes yet
    const allRegistrations = await ctx.db.query('event_registrations').collect()
    return allRegistrations.filter((r: any) => 
      r.eventId === args.eventId || r.event_id === args.eventId
    )
  },
})

/**
 * Get events by type and date range
 */
export const listEvents = query({
  args: {
    eventType: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let events = await ctx.db.query('events').collect()

    if (args.eventType) {
      events = events.filter((e: any) => e.eventType === args.eventType)
    }

    if (args.startDate) {
      events = events.filter((e: any) => (e.startAt ?? 0) >= args.startDate!)
    }

    if (args.endDate) {
      events = events.filter((e: any) => (e.startAt ?? 0) <= args.endDate!)
    }

    const limit = args.limit ?? 20
    return events.slice(0, limit)
  },
})
