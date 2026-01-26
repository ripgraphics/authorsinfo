import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { findOrCreateTag } from '@/lib/tags/tag-service'
import { z } from 'zod'
import { unauthorizedError, handleValidationError, nextErrorResponse } from '@/lib/error-handler'

const createTagSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['user', 'entity', 'topic', 'collaborator', 'location', 'taxonomy']),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * POST /api/tags/create
 * Create a new tag (typically for taxonomy or topic tags)
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
    const validation = createTagSchema.safeParse(json)

    if (!validation.success) {
      return NextResponse.json(handleValidationError(validation.error.flatten()), { status: 400 })
    }

    const { name, type, metadata } = validation.data

    // Only allow creating topic, taxonomy, and location tags via API
    // User and entity tags are created automatically from mentions
    if (!['topic', 'taxonomy', 'location'].includes(type)) {
      return NextResponse.json(
        { error: 'Cannot create user or entity tags via this endpoint' },
        { status: 400 }
      )
    }

    const tagId = await findOrCreateTag(name, type, metadata, user.id)

    if (!tagId) {
      return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      tag: { id: tagId, name, type },
    })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to create tag')
  }
}
