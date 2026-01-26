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
import { createTaggings, findOrCreateTag } from '@/lib/tags/tag-service'
import { extractMentions, extractHashtags } from '@/lib/tags/tag-parser'

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
    const entityType = entity_type || 'user'
    const entityId = entity_id || userId
    const shouldCrossPostToUser = !(entityType === 'user' && entityId === userId)

    // 4. Create post data
    const basePostData = {
      user_id: userId,
      content: content.text.trim(),
      content_type: 'text',
      visibility: visibility,
      publish_status: 'published',
      created_at: new Date().toISOString(),
    }

    const entityPostData = {
      ...basePostData,
      entity_type: entityType,
      entity_id: entityId,
    }

    const postsToInsert: Array<Record<string, any>> = [entityPostData]

    if (shouldCrossPostToUser) {
      postsToInsert.push({
        ...basePostData,
        entity_type: 'user',
        entity_id: userId,
        metadata: {
          cross_post: {
            origin_entity_type: entityType,
            origin_entity_id: entityId,
          },
        },
      })
      logger.info({
        userId,
        originEntityType: entityType,
        originEntityId: entityId,
      }, 'Cross-posting to user timeline')
    }

    // 5. Insert post(s) into posts table
    logger.info({ count: postsToInsert.length, shouldCrossPostToUser }, 'Inserting posts')
    const { data: posts, error: postError } = await (supabase.from('posts') as any)
      .insert(postsToInsert)
      .select()

    if (postError) {
      logger.error({ error: postError, postsToInsert }, 'Post insert error')
      const { message, statusCode } = handleDatabaseError(postError, 'Failed to create post')
      return NextResponse.json({ error: message }, { status: statusCode })
    }

    if (!posts || posts.length === 0) {
      logger.error({ postsToInsert }, 'No posts returned from insert')
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    logger.info({ 
      count: posts.length, 
      postIds: posts.map((p: any) => ({ id: p.id, entity_type: p.entity_type, entity_id: p.entity_id, hasMetadata: !!p.metadata }))
    }, 'Posts created successfully')

    const entityPost = posts.find(
      (p: any) => p.entity_type === entityType && p.entity_id === entityId
    )
    const userPost = shouldCrossPostToUser
      ? posts.find((p: any) => p.entity_type === 'user' && p.entity_id === userId)
      : undefined

    if (!entityPost) {
      logger.error({ posts, entityType, entityId }, 'Entity post not found in results')
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    if (shouldCrossPostToUser && !userPost) {
      logger.warn({ 
        posts, 
        userId, 
        expectedEntityType: 'user',
        expectedEntityId: userId,
        allPosts: posts.map((p: any) => ({ id: p.id, entity_type: p.entity_type, entity_id: p.entity_id, metadata: p.metadata }))
      }, 'Cross-post expected but not found in results')
    } else if (shouldCrossPostToUser && userPost) {
      logger.info({
        userPostId: userPost.id,
        metadata: userPost.metadata,
        originEntityType: entityType,
        originEntityId: entityId,
      }, 'Cross-post created successfully')
    }

    // 6. Process tags from content (mentions and hashtags)
    if (content.text) {
      const mentions = extractMentions(content.text)
      const hashtags = extractHashtags(content.text)

      const tagIds: string[] = []
      const positions: Array<{ start: number; end: number }> = []

      // Process mentions
      for (const mention of mentions) {
        const metadata: Record<string, any> = {}
        
        // For user mentions, look up the user to get UUID
        if (mention.type === 'user') {
          const { data: users } = await supabase
            .from('users')
            .select('id, name')
            .or(`name.ilike.%${mention.name}%,permalink.ilike.%${mention.name}%`)
            .is('deleted_at', null)
            .limit(1)
            .single()
          
          if (users) {
            const user = users as any
            metadata.entity_id = user.id
            metadata.entity_type = 'user'
          }
        } else if (mention.entityId) {
          metadata.entity_id = mention.entityId
        }
        
        if (mention.entityType) {
          metadata.entity_type = mention.entityType
        }

        const tagId = await findOrCreateTag(
          mention.name,
          mention.type === 'user' ? 'user' : 'entity',
          Object.keys(metadata).length > 0 ? metadata : undefined,
          userId
        )

        if (tagId) {
          tagIds.push(tagId)
          positions.push(mention.position)
        }
      }

      // Process hashtags
      for (const hashtag of hashtags) {
        const tagId = await findOrCreateTag(hashtag.name, 'topic', undefined, userId)
        if (tagId) {
          tagIds.push(tagId)
          positions.push(hashtag.position)
        }
      }

      // Create taggings
      if (tagIds.length > 0) {
        const postIds = [entityPost.id]
        if (userPost?.id) {
          postIds.push(userPost.id)
        }

        for (const postId of postIds) {
          await createTaggings(tagIds, 'post', postId, 'post', userId, positions)
        }
        
        // Notifications will be handled by database trigger
        // But we can also call the notification service for additional logic if needed
      }
    }

    return NextResponse.json({
      success: true,
      post: { id: entityPost.id, text: entityPost.content },
      user_post_id: userPost?.id,
      message: 'Post created successfully',
    })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to create post')
  }
}

