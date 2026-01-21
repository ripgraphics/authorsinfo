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
    // Track view based on entity type using unified views table
    let view_id: string | null = null
    let action: 'added' | 'updated' | 'skipped' = 'added'

    try {
      const viewMetadata = {
        ip_address: request.headers.get('x-forwarded-for'),
        user_agent: request.headers.get('user-agent'),
        referrer: request.headers.get('referer'),
      }

      if (targetTable) {
        const viewPayload = {
          user_id: userId,
          entity_type,
          entity_id,
          view_duration: view_duration || 0,
          view_source: view_source || 'direct',
          view_metadata: viewMetadata,
          is_completed: false,
          updated_at: new Date().toISOString(),
        }

        if (userId) {
          const { data: upsertedView, error: upsertError } = await supabaseAdmin
            .from('views')
            .upsert(viewPayload, { onConflict: 'user_id,entity_type,entity_id' })
            .select('id')
            .maybeSingle()

          if (!upsertError && upsertedView) {
            view_id = upsertedView.id
            action = 'updated'
          }
        } else {
          const { data: newView, error: insertError } = await supabaseAdmin
            .from('views')
            .insert({ ...viewPayload, user_id: null })
            .select('id')
            .single()

          if (!insertError && newView) {
            view_id = newView.id
            action = 'added'
          }
        }
      } else {
        // For unsupported entity types, skip view tracking
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

