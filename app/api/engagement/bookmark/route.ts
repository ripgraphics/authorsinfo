import { NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Parse request body
    const { entity_type, entity_id, bookmark_note } = await request.json()

    if (!entity_type || !entity_id) {
      return NextResponse.json(
        { error: 'Missing required fields: entity_type, entity_id' },
        { status: 400 }
      )
    }

    console.log('🔍 Processing bookmark:', {
      user_id: user.id,
      entity_type,
      entity_id,
      bookmark_note: bookmark_note?.substring(0, 100) + '...',
    })

    // Check if user already bookmarked this entity
    const { data: existingBookmark, error: checkError } = await supabaseAdmin
      .from('engagement_bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('❌ Error checking existing bookmark:', checkError)
      return NextResponse.json({ error: 'Failed to check existing bookmark' }, { status: 500 })
    }

    let action: 'added' | 'removed' = 'added'
    let bookmark_id: string | null = null

    if (existingBookmark) {
      // Remove existing bookmark (toggle off)
      const { error: deleteError } = await supabaseAdmin
        .from('engagement_bookmarks')
        .delete()
        .eq('id', existingBookmark.id)

      if (deleteError) {
        console.error('❌ Error removing bookmark:', deleteError)
        return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 })
      }

      action = 'removed'
      bookmark_id = null
    } else {
      // Insert new bookmark
      const { data: newBookmark, error: insertError } = await supabaseAdmin
        .from('engagement_bookmarks')
        .insert({
          user_id: user.id,
          entity_type,
          entity_id,
          bookmark_note: bookmark_note || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('❌ Error inserting bookmark:', insertError)
        return NextResponse.json({ error: 'Failed to add bookmark' }, { status: 500 })
      }

      action = 'added'
      bookmark_id = newBookmark.id
    }

    // Note: Engagement counts are no longer cached in activities table
    // They are calculated dynamically from engagement tables (engagement_bookmarks, engagement_shares, etc.)
    // which are the single source of truth

    console.log('✅ Bookmark processed successfully:', {
      action,
      bookmark_id,
      entity_type,
      entity_id,
    })

    return NextResponse.json({
      success: true,
      action,
      bookmark_id,
      entity_type,
      entity_id,
      message:
        action === 'removed' ? 'Bookmark removed successfully' : 'Bookmark added successfully',
    })
  } catch (error) {
    console.error('❌ Unexpected error in bookmark API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

