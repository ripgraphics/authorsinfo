import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { createTaggings, findOrCreateTag } from '@/lib/tags/tag-service'
import { extractMentions, extractHashtags } from '@/lib/tags/tag-parser'
import { checkTagPolicy } from '@/lib/tags/tag-policy-service'
import { checkTagRateLimit } from '@/lib/tags/tag-rate-limit'
import { createPendingTagging } from '@/lib/tags/tag-approval-service'
import { z } from 'zod'
import { unauthorizedError, handleValidationError, nextErrorResponse } from '@/lib/error-handler'

const createTaggingsSchema = z.object({
  content: z.string().optional(), // Text content to parse tags from
  tags: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum(['user', 'entity', 'topic', 'collaborator', 'location', 'taxonomy']),
        entityId: z.string().uuid().optional(),
        entityType: z.string().optional(),
        position: z
          .object({
            start: z.number().int(),
            end: z.number().int(),
          })
          .optional(),
      })
    )
    .optional(), // Explicit tags array
  entityType: z.string(),
  entityId: z.string().uuid(),
  context: z.enum(['post', 'comment', 'profile', 'message', 'photo', 'activity']),
})

/**
 * POST /api/tags/taggings
 * Create taggings for an entity (can parse from content or use explicit tags)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(unauthorizedError(), { status: 401 })
    }

    const json = await request.json()
    const validation = createTaggingsSchema.safeParse(json)

    if (!validation.success) {
      return NextResponse.json(handleValidationError(validation.error.flatten()), { status: 400 })
    }

    const { content, tags: explicitTags, entityType, entityId, context } = validation.data

    let tagsToCreate: Array<{
      name: string
      type: string
      entityId?: string
      entityType?: string
      position?: { start: number; end: number }
    }> = []

    // If content is provided, parse tags from it
    if (content) {
      const mentions = extractMentions(content)
      const hashtags = extractHashtags(content)

      // Convert mentions to tag format
      for (const mention of mentions) {
        tagsToCreate.push({
          name: mention.name,
          type: mention.type,
          position: mention.position,
          entityId: mention.entityId,
          entityType: mention.entityType,
        })
      }

      // Convert hashtags to tag format
      for (const hashtag of hashtags) {
        tagsToCreate.push({
          name: hashtag.name,
          type: 'topic',
          position: hashtag.position,
        })
      }
    }

    // Add explicit tags if provided
    if (explicitTags && explicitTags.length > 0) {
      tagsToCreate = [...tagsToCreate, ...explicitTags]
    }

    if (tagsToCreate.length === 0) {
      return NextResponse.json({ success: true, message: 'No tags to create' })
    }

    // Check rate limits for each tag type
    const mentions = tagsToCreate.filter((t) => t.type === 'user' || t.type === 'entity')
    const hashtags = tagsToCreate.filter((t) => t.type === 'topic')

    if (mentions.length > 0) {
      const mentionRateLimit = await checkTagRateLimit(user.id, 'user', mentions.length)
      if (!mentionRateLimit.allowed) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: mentionRateLimit.reason,
            remaining: mentionRateLimit.remaining,
            resetAt: mentionRateLimit.resetAt.toISOString(),
          },
          { status: 429 }
        )
      }
    }

    if (hashtags.length > 0) {
      const hashtagRateLimit = await checkTagRateLimit(user.id, 'topic', hashtags.length)
      if (!hashtagRateLimit.allowed) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: hashtagRateLimit.reason,
            remaining: hashtagRateLimit.remaining,
            resetAt: hashtagRateLimit.resetAt.toISOString(),
          },
          { status: 429 }
        )
      }
    }

    // Find or create tags and collect tag IDs
    const tagIds: string[] = []
    const positions: Array<{ start: number; end: number }> = []
    const pendingTaggings: Array<{ tagId: string; position: { start: number; end: number } }> = []

    for (const tagData of tagsToCreate) {
      // Check policy for this tag
      const policyCheck = await checkTagPolicy(
        entityType,
        entityId,
        tagData.type as any,
        undefined // tagId not available yet
      )

      if (!policyCheck.allowed) {
        // Skip this tag
        continue
      }

      const metadata: Record<string, any> = {}
      
      // For user tags, look up the user to get permalink
      if (tagData.type === 'user') {
        if (tagData.entityId) {
          metadata.entity_id = tagData.entityId
          // Fetch user's permalink
          const { data: userData } = await supabase
            .from('users')
            .select('id, permalink')
            .eq('id', tagData.entityId)
            .single()
          
          if (userData) {
            const user = userData as any
            metadata.permalink = user.permalink || user.id
          }
        } else {
          // Try to find user by name
          const { data: userData } = await supabase
            .from('users')
            .select('id, permalink')
            .or(`name.ilike.%${tagData.name}%,permalink.ilike.%${tagData.name}%`)
            .is('deleted_at', null)
            .limit(1)
            .single()
          
          if (userData) {
            const user = userData as any
            metadata.entity_id = user.id
            metadata.permalink = user.permalink || user.id
          }
        }
        metadata.entity_type = 'user'
      } else if (tagData.entityId) {
        metadata.entity_id = tagData.entityId
      }
      
      if (tagData.entityType) {
        metadata.entity_type = tagData.entityType
      }

      const tagId = await findOrCreateTag(
        tagData.name,
        tagData.type as any,
        Object.keys(metadata).length > 0 ? metadata : undefined,
        user.id
      )

      if (tagId) {
        // Re-check policy with actual tagId
        const finalPolicyCheck = await checkTagPolicy(entityType, entityId, tagData.type as any, tagId)
        if (!finalPolicyCheck.allowed) {
          continue
        }

        const position = tagData.position || { start: 0, end: 0 }

        if (finalPolicyCheck.requiresApproval) {
          // Create pending tagging
          await createPendingTagging(tagId, entityType, entityId, context, user.id, position)
          pendingTaggings.push({ tagId, position })
        } else {
          tagIds.push(tagId)
          positions.push(position)
        }
      }
    }

    // Create approved taggings
    let success = true
    if (tagIds.length > 0) {
      success = await createTaggings(tagIds, entityType, entityId, context, user.id, positions)
    }

    if (!success) {
      return NextResponse.json({ error: 'Failed to create taggings' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      taggingsCreated: tagIds.length,
      pendingTaggings: pendingTaggings.length,
      message:
        pendingTaggings.length > 0
          ? `${tagIds.length} taggings created, ${pendingTaggings.length} pending approval`
          : `${tagIds.length} taggings created`,
    })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to create taggings')
  }
}

/**
 * GET /api/tags/taggings
 * Get taggings for an entity
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const context = searchParams.get('context')

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType and entityId are required' }, { status: 400 })
    }

    const { data: taggings, error } = await supabase
      .from('taggings')
      .select(
        `
        id,
        tag_id,
        context,
        position_start,
        position_end,
        created_at,
        tags (
          id,
          name,
          slug,
          type,
          metadata,
          usage_count
        )
      `
      )
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    if (context) {
      // Filter by context if provided
      const filtered = (taggings || []).filter((t: any) => t.context === context)
      return NextResponse.json({ taggings: filtered })
    }

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch taggings' }, { status: 500 })
    }

    return NextResponse.json({ taggings: taggings || [] })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to fetch taggings')
  }
}
