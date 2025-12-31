import { NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    // Get the current user (optional for view tracking)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    const userId = user?.id || null

    // Parse request body
    let { entity_type, entity_id, view_duration, view_source } = await request.json()

    if (!entity_type || !entity_id) {
      return NextResponse.json(
        { error: 'Missing required fields: entity_type, entity_id' },
        { status: 400 }
      )
    }

    // Resolve permalinks to UUIDs and validate entity existence (no-op if missing)
    const tableMap: Record<string, string> = {
      user: 'users',
      book: 'books',
      author: 'authors',
      publisher: 'publishers',
      group: 'groups',
      event: 'events',
      activity: 'activities',
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const targetTable = tableMap[entity_type]
    if (targetTable) {
      try {
        if (!uuidRegex.test(entity_id)) {
          const { data: resolved } = await supabaseAdmin
            .from(targetTable)
            .select('id, permalink')
            .or(`id.eq.${entity_id},permalink.eq.${entity_id}`)
            .maybeSingle()
          if (resolved?.id) {
            entity_id = resolved.id
          }
        }
        // Validate existence after resolution
        const { data: existsRow } = await supabaseAdmin
          .from(targetTable)
          .select('id')
          .eq('id', entity_id)
          .maybeSingle()
        if (!existsRow) {
          // No-op for non-existent entity to avoid hard failures
          return NextResponse.json({
            success: true,
            action: 'skipped',
            message: 'Entity not found; view not recorded',
            entity_type,
            entity_id,
          })
        }
      } catch (_) {
        // Continue without failing; we will attempt to record view, and DB constraints may enforce integrity
      }
    }
    // Track view based on entity type using appropriate table
    let view_id: string | null = null
    let action: 'added' | 'updated' | 'skipped' = 'added'

    try {
      if (entity_type === 'book') {
        // Use book_views table for books
        if (userId) {
          const { data: existingView } = await supabaseAdmin
            .from('book_views')
            .select('id')
            .eq('user_id', userId)
            .eq('book_id', entity_id)
            .maybeSingle()

          if (!existingView) {
            const { data: newView, error: insertError } = await supabaseAdmin
              .from('book_views')
              .insert({
                user_id: userId,
                book_id: entity_id,
                viewed_at: new Date().toISOString(),
              })
              .select('id')
              .single()

            if (!insertError && newView) {
              view_id = newView.id
              action = 'added'
            }
          } else {
            view_id = existingView.id
            action = 'updated'
          }
        }
      } else if (entity_type === 'event') {
        // Use event_views table for events
        if (userId) {
          const { data: existingView } = await supabaseAdmin
            .from('event_views')
            .select('id')
            .eq('user_id', userId)
            .eq('event_id', entity_id)
            .maybeSingle()

          if (!existingView) {
            const { data: newView, error: insertError } = await supabaseAdmin
              .from('event_views')
              .insert({
                user_id: userId,
                event_id: entity_id,
                viewed_at: new Date().toISOString(),
                ip_address: null,
                user_agent: null,
                referrer: null,
              })
              .select('id')
              .single()

            if (!insertError && newView) {
              view_id = newView.id
              action = 'added'
            }
          } else {
            view_id = existingView.id
            action = 'updated'
          }
        }
      } else if (entity_type === 'activity') {
        // For activities, update the view_count column directly
        const { data: activity } = await supabaseAdmin
          .from('activities')
          .select('view_count')
          .eq('id', entity_id)
          .single()

        if (activity) {
          const newViewCount = (activity.view_count || 0) + 1
          const { error: updateError } = await supabaseAdmin
            .from('activities')
            .update({
              view_count: newViewCount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', entity_id)

          if (!updateError) {
            action = 'updated'
          }
        }
      } else {
        // For other entity types (user, author, publisher, group), skip view tracking
        // or use activities table if applicable
        action = 'skipped'
      }
    } catch (viewError) {
      console.log('View tracking not available, skipping:', viewError)
      // If view tracking fails, just return success without recording
      action = 'skipped'
    }

    return NextResponse.json({
      success: true,
      action,
      view_id,
      entity_type,
      entity_id,
      user_id: userId,
      message: 'View tracked successfully',
    })
  } catch (error) {
    console.error('❌ Unexpected error in view API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
