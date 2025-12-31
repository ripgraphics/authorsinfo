import { NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

import { supabaseAdmin } from '@/lib/supabase/server'

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
    const { entity_type, entity_id, reaction_type } = await request.json()

    if (!entity_type || !entity_id || !reaction_type) {
      return NextResponse.json(
        { error: 'Missing required fields: entity_type, entity_id, reaction_type' },
        { status: 400 }
      )
    }

    // Validate reaction type
    const validReactionTypes = ['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry']
    if (!validReactionTypes.includes(reaction_type)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 })
    }

    console.log('🔍 Processing reaction:', {
      user_id: user.id,
      entity_type,
      entity_id,
      reaction_type,
    })

    // Use likes table for all entity types (activity_likes doesn't exist)
    const { data: existingLike, error: checkError } = await supabaseAdmin
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('❌ Error checking existing like:', checkError)
      return NextResponse.json({ error: 'Failed to check existing like' }, { status: 500 })
    }

    let action: 'added' | 'removed' = 'added'
    let like_id: string | null = null

    if (existingLike) {
      // User already has a like - remove it (toggle off)
      const { error: deleteError } = await supabaseAdmin
        .from('likes')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        console.error('❌ Error removing like:', deleteError)
        return NextResponse.json({ error: 'Failed to remove like' }, { status: 500 })
      }

      action = 'removed'
      like_id = null
    } else {
      // User doesn't have a like - add new one
      const { data: newLike, error: insertError } = await supabaseAdmin
        .from('likes')
        .insert({
          user_id: user.id,
          entity_type: entity_type,
          entity_id: entity_id,
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('❌ Error adding like:', insertError)
        return NextResponse.json({ error: 'Failed to add like' }, { status: 500 })
      }

      action = 'added'
      like_id = newLike.id
    }

    // Update engagement counts in activities table if this is an activity
    if (entity_type === 'activity') {
      try {
        // Get current like count for this activity using likes table
        const { count, error: countError } = await supabaseAdmin
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('entity_type', entity_type)
          .eq('entity_id', entity_id)

        if (!countError && count !== null) {
          // Update the activities table with new count
          const { error: updateError } = await supabaseAdmin
            .from('activities')
            .update({
              like_count: count,
              updated_at: new Date().toISOString(),
            })
            .eq('id', entity_id)

          if (updateError) {
            console.warn('⚠️ Warning: Failed to update activity counts:', updateError)
            // Don't fail the request for this, just log it
          }
        }
      } catch (error) {
        console.warn('⚠️ Warning: Failed to update activity counts:', error)
        // Don't fail the request for this, just log it
      }
    }

    console.log('✅ Like processed successfully:', {
      action,
      reaction_type,
      like_id,
    })

    return NextResponse.json({
      success: true,
      action,
      reaction_type: 'like', // Always 'like' since table doesn't support reaction types
      like_id,
      message: action === 'removed' ? 'Like removed successfully' : 'Like added successfully',
    })
  } catch (error) {
    console.error('❌ Unexpected error in reaction API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

