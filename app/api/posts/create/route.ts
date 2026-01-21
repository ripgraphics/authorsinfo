import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { createPostSchema } from '@/lib/validations/post'
import { logger } from '@/lib/logger'
import {
  handleDatabaseError,
  handleValidationError,
  nextErrorResponse,
  unauthorizedError,
} from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const supabase = await createRouteHandlerClientAsync()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(unauthorizedError(), { status: 401 })
    }

    const userId = user.id

    // 2. Get request data
    const json = await request.json()

    // 3. Validate input with Zod
    const validationResult = createPostSchema.safeParse(json)

    if (!validationResult.success) {
      return NextResponse.json(handleValidationError(validationResult.error.flatten()), {
        status: 400,
      })
    }

    const { content, entity_type, entity_id, visibility } = validationResult.data

    // 4. Create post in posts table
    const postData = {
      user_id: userId,
      content: content.text.trim(),
      content_type: 'text',
      visibility: visibility,
      publish_status: 'published',
      entity_type: entity_type || 'user',
      entity_id: entity_id || userId,
      created_at: new Date().toISOString(),
    }

    // 5. Insert the post into posts table
    const { data: post, error: postError } = await (supabase.from('posts') as any)
      .insert(postData)
      .select()
      .single()

    if (postError) {
      const { message, statusCode } = handleDatabaseError(postError, 'Failed to create post')
      return NextResponse.json({ error: message }, { status: statusCode })
    }

    return NextResponse.json({
      success: true,
      post: { id: post.id, text: post.content },
      message: 'Post created successfully',
    })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to create post')
  }
}

