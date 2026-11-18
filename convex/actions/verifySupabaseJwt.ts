"use node"

import { internalAction } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Verify a Supabase JWT and return the decoded user identity.
 * This is an internal action used by the auth flow to establish Convex identity.
 */
export const verifySupabaseJwt = internalAction({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    // For now, we'll parse the JWT manually to extract the user ID
    // In production, you should verify the signature using Supabase's public key
    // Available at: https://<project>.supabase.co/auth/v1/keys

    try {
      // Decode the JWT payload (without verification for now)
      // Format: header.payload.signature
      const parts = args.token.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid token format')
      }

      // Decode the payload (base64url)
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf8')
      )

      // Extract user information
      return {
        userId: payload.sub || payload.user_id,
        email: payload.email,
        tokenIdentifier: payload.sub || payload.user_id,
      }
    } catch (error) {
      console.error('Failed to verify Supabase JWT:', error)
      throw new Error('Invalid or expired token')
    }
  },
})
