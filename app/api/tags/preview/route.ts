import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { z } from 'zod'
import { unauthorizedError, handleValidationError, nextErrorResponse } from '@/lib/error-handler'

const previewSchema = z.object({
  slug: z.string().min(1),
  type: z.enum(['user', 'entity', 'topic', 'collaborator', 'location', 'taxonomy']),
})

/**
 * GET /api/tags/preview
 * Get rich preview data for a tag
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const searchParams = request.nextUrl.searchParams
    const slug = searchParams.get('slug')
    const type = searchParams.get('type')

    const validation = previewSchema.safeParse({
      slug: slug || '',
      type: (type as any) || 'topic',
    })

    if (!validation.success) {
      return NextResponse.json(handleValidationError(validation.error.flatten()), { status: 400 })
    }

    const { slug: tagSlug, type: tagType } = validation.data

    // Get tag
    const { data: tag, error: tagError } = await supabase
      .from('tags')
      .select('*')
      .eq('slug', tagSlug)
      .eq('type', tagType)
      .eq('status', 'active')
      .is('deleted_at', null)
      .single()

    if (tagError || !tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    const tagData = tag as any
    const preview: any = {
      id: tagData.id,
      name: tagData.name,
      slug: tagData.slug,
      type: tagData.type,
      metadata: tagData.metadata || {},
      usageCount: tagData.usage_count || 0,
    }

    // Fetch additional data based on type
    if (tagType === 'user' && tagData.metadata?.entity_id) {
      const userId = tagData.metadata.entity_id

      // Get user and profile
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, email, permalink')
        .eq('id', userId)
        .single()

      const { data: profile } = await supabase
        .from('profiles')
        .select('bio, avatar_image_id')
        .eq('user_id', userId)
        .single()

      if (userData) {
        const user = userData as any
        preview.name = user.name || user.email
        preview.sublabel = `@${user.permalink || user.name}`
        preview.description = (profile as any)?.bio
        // Get avatar URL from images table
        if ((profile as any)?.avatar_image_id) {
          const { data: image } = await supabase
            .from('images')
            .select('url')
            .eq('id', (profile as any).avatar_image_id)
            .single()
          preview.avatarUrl = (image as any)?.url || null
        }
      }

      // Get follower count (if you have a follows table)
      const { count: followerCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)

      preview.metadata = {
        ...preview.metadata,
        followers: followerCount || 0,
      }
    } else if (tagType === 'entity' && tagData.metadata?.entity_id && tagData.metadata?.entity_type) {
      const entityId = tagData.metadata.entity_id
      const entityType = tagData.metadata.entity_type

      if (entityType === 'author') {
        const { data: author } = await supabase
          .from('authors')
          .select('id, name, bio, permalink')
          .eq('id', entityId)
          .single()

        if (author) {
          const authorData = author as any
          preview.name = authorData.name
          preview.description = authorData.bio
          preview.sublabel = 'Author'
        }
      } else if (entityType === 'book') {
        const { data: book } = await supabase
          .from('books')
          .select('id, title, synopsis, permalink')
          .eq('id', entityId)
          .single()

        if (book) {
          const bookData = book as any
          preview.name = bookData.title
          preview.description = bookData.synopsis
          preview.sublabel = 'Book'
        }
      } else if (entityType === 'group') {
        const { data: group } = await supabase
          .from('groups')
          .select('id, name, description, permalink, member_count')
          .eq('id', entityId)
          .single()

        if (group) {
          const groupData = group as any
          preview.name = groupData.name
          preview.description = groupData.description
          preview.sublabel = 'Group'
          preview.metadata = {
            ...preview.metadata,
            members: groupData.member_count || 0,
          }
        }
      } else if (entityType === 'event') {
        const { data: event } = await supabase
          .from('events')
          .select('id, title, description, permalink')
          .eq('id', entityId)
          .single()

        if (event) {
          const eventData = event as any
          preview.name = eventData.title
          preview.description = eventData.description
          preview.sublabel = 'Event'
        }
      }
    } else if (tagType === 'topic') {
      // For topics, we can add usage stats
      const { count: usageCount } = await supabase
        .from('taggings')
        .select('*', { count: 'exact', head: true })
        .eq('tag_id', tagData.id)

      preview.metadata = {
        ...preview.metadata,
        usageCount: usageCount || 0,
      }
    }

    return NextResponse.json({ preview })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to fetch tag preview')
  }
}
