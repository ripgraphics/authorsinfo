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
    const { entity_type, entity_id, share_platform, share_message } = await request.json()

    if (!entity_type || !entity_id) {
      return NextResponse.json(
        { error: 'Missing required fields: entity_type, entity_id' },
        { status: 400 }
      )
    }

    console.log('🔍 Processing share:', {
      user_id: user.id,
      entity_type,
      entity_id,
      share_platform,
      share_message: share_message?.substring(0, 100) + '...',
    })

    // Check if user already shared this entity
    const { data: existingShare, error: checkError } = await supabaseAdmin
      .from('engagement_shares')
      .select('id')
      .eq('user_id', user.id)
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('❌ Error checking existing share:', checkError)
      return NextResponse.json({ error: 'Failed to check existing share' }, { status: 500 })
    }

    let action: 'added' | 'updated' = 'added'
    let share_id: string

    if (existingShare) {
      // Update existing share
      const { data: updatedShare, error: updateError } = await supabaseAdmin
        .from('engagement_shares')
        .update({
          share_platform,
          share_message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingShare.id)
        .select('id')
        .single()

      if (updateError) {
        console.error('❌ Error updating share:', updateError)
        return NextResponse.json({ error: 'Failed to update share' }, { status: 500 })
      }

      action = 'updated'
      share_id = updatedShare.id
    } else {
      // Insert new share
      const { data: newShare, error: insertError } = await supabaseAdmin
        .from('engagement_shares')
        .insert({
          user_id: user.id,
          entity_type,
          entity_id,
          share_platform: share_platform || 'internal',
          share_message: share_message || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('❌ Error inserting share:', insertError)
        return NextResponse.json({ error: 'Failed to add share' }, { status: 500 })
      }

      action = 'added'
      share_id = newShare.id
    }

    // Note: Engagement counts are no longer cached in activities table
    // They are calculated dynamically from engagement tables (engagement_shares, engagement_bookmarks, etc.)
    // which are the single source of truth

    console.log('✅ Share processed successfully:', {
      action,
      share_id,
      entity_type,
      entity_id,
    })

    return NextResponse.json({
      success: true,
      action,
      share_id,
      entity_type,
      entity_id,
      message: action === 'updated' ? 'Share updated successfully' : 'Share added successfully',
    })
  } catch (error) {
    console.error('❌ Unexpected error in share API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

