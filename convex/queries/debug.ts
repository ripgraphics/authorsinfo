import { query } from '../_generated/server';
import { v } from 'convex/values';

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('follows').take(10);
  },
});

export const countByFollowingId = query({
  args: { followingId: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query('follows').collect();
    const matching = all.filter(r => r.followingId === args.followingId);
    return { totalInTable: all.length, matchingCount: matching.length, matches: matching };
  },
});

export const debugUserResolve = query({
  args: { supabaseId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .filter(q => q.eq('supabaseId', args.supabaseId))
      .first();
    return user ? { found: true, _id: user._id, supabaseId: user.supabaseId } : null;
  },
});

export const debugGetPhoto = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    console.log('DEBUG getPhoto: input id =', args.id);
    
    // Try by _id field (Convex internal ID)
    const byId = await ctx.db
      .query('images')
      .filter(q => q.eq(q.field('_id'), args.id))
      .first();
    console.log('DEBUG getPhoto: found by _id =', byId ? byId._id : 'null');
    
    // Try by id field (Supabase UUID)
    const bySupabaseId = await ctx.db
      .query('images')
          .filter(q => q.eq(q.field('_id'), args.id))
      .first();
        console.log('DEBUG getPhoto: found by id field =', bySupabaseId ? bySupabaseId._id : 'null');
    
    // Also check if any images have this as supabaseId
    const bySupabaseIdField = await ctx.db
      .query('images')
      .filter(q => q.eq(q.field('supabaseId'), args.id))
      .first();
    console.log('DEBUG getPhoto: found by supabaseId field =', bySupabaseIdField ? bySupabaseIdField.supabaseId : 'null');

    return {
      _id: byId?._id,
          id_field: bySupabaseId?._id,
      supabaseId: bySupabaseIdField?.supabaseId,
      url: bySupabaseId?.url || byId?.url,
    };
  },
});
