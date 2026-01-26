/**
 * Tag Page
 * Dedicated page for a tag with content filters
 */

import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TagContentFeed } from '@/components/tags/tag-content-feed'

interface TagPageProps {
  params: {
    slug: string
  }
  searchParams: {
    type?: string
    context?: string
  }
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const supabase = await createClient()
  const { data: tag } = await supabase
    .from('tags')
    .select('name, type, metadata')
    .eq('slug', params.slug)
    .eq('status', 'active')
    .is('deleted_at', null)
    .single()

  if (!tag) {
    return {
      title: 'Tag Not Found',
    }
  }

  return {
    title: `${tag.type === 'topic' ? '#' : '@'}${tag.name}`,
    description: `Content tagged with ${tag.name}`,
  }
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const supabase = await createClient()

  const { data: tag, error } = await supabase
    .from('tags')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'active')
    .is('deleted_at', null)
    .single()

  if (error || !tag) {
    notFound()
  }

  // Get taggings for this tag
  let taggingsQuery = supabase
    .from('taggings')
    .select(
      `
      id,
      entity_type,
      entity_id,
      context,
      created_at
    `
    )
    .eq('tag_id', tag.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (searchParams.context) {
    taggingsQuery = taggingsQuery.eq('context', searchParams.context)
  }

  const { data: taggings } = await taggingsQuery

  // Fetch associated content for each tagging
  const enrichedTaggings = []
  for (const tagging of taggings || []) {
    if (tagging.entity_type === 'post') {
      const { data: post } = await supabase
        .from('posts')
        .select('id, content, created_at, user_id')
        .eq('id', tagging.entity_id)
        .single()

      if (post) {
        // Get user info
        const { data: user } = await supabase
          .from('users')
          .select('id, name, permalink')
          .eq('id', post.user_id)
          .single()

        enrichedTaggings.push({
          ...tagging,
          posts: {
            ...post,
            users: user || { name: 'Unknown', permalink: null },
          },
          activities: null,
        })
      }
    } else if (tagging.entity_type === 'activity') {
      const { data: activity } = await supabase
        .from('activities')
        .select('id, text, created_at, user_id')
        .eq('id', tagging.entity_id)
        .single()

      if (activity) {
        // Get user info
        const { data: user } = await supabase
          .from('users')
          .select('id, name, permalink')
          .eq('id', activity.user_id)
          .single()

        enrichedTaggings.push({
          ...tagging,
          posts: null,
          activities: {
            ...activity,
            users: user || { name: 'Unknown', permalink: null },
          },
        })
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {tag.type === 'topic' ? '#' : '@'}
          {tag.name}
        </h1>
        {tag.metadata?.description && (
          <p className="text-muted-foreground mt-2">{tag.metadata.description}</p>
        )}
        <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
          <span>{tag.usage_count || 0} uses</span>
        </div>
      </div>

      <TagContentFeed taggings={enrichedTaggings} tag={tag} />
    </div>
  )
}
