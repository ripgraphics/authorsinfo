import { NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  isValidLikeReactionType,
  getLikeCountSource,
} from '@/lib/engagement/config'

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

    // Validate reaction type (config-driven)
    if (!isValidLikeReactionType(reaction_type)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 })
    }

    console.log('🔍 Processing reaction:', {
      user_id: user.id,
      entity_type,
      entity_id,
      reaction_type,
    })

    // Use likes table for all entity types
    const { data: existingLike, error: checkError } = await supabaseAdmin
      .from('likes')
      .select('id, like_type')
      .eq('user_id', user.id)
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .maybeSingle()

    if (checkError) {
      console.error('❌ Error checking existing like:', checkError)
      return NextResponse.json({ error: `Failed to check existing like: ${checkError.message}` }, { status: 500 })
    }

    let action: 'added' | 'removed' = 'added'
    let like_id: string | null = null
    let total_count: number | undefined
    let user_reaction: string | null = null

    if (existingLike) {
      // If user has a reaction, toggle it
      // Case 1: Same reaction type - remove it
      if (existingLike.like_type === reaction_type) {
        const { error: deleteError } = await supabaseAdmin
          .from('likes')
          .delete()
          .eq('id', existingLike.id)

        if (deleteError) {
          console.error('❌ Error removing like:', deleteError)
          return NextResponse.json({ error: `Failed to remove like: ${deleteError.message}` }, { status: 500 })
        }

        action = 'removed'
        like_id = null
        user_reaction = null
      } 
      // Case 2: Different reaction type - update it
      else {
        const { data: updatedLike, error: updateError } = await supabaseAdmin
          .from('likes')
          .update({
            like_type: reaction_type,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLike.id)
          .select('id')
          .single()

        if (updateError) {
          console.error('❌ Error updating like type:', updateError)
          return NextResponse.json({ error: `Failed to update like type: ${updateError.message}` }, { status: 500 })
        }

        action = 'added'
        like_id = updatedLike.id
        user_reaction = reaction_type
      }
    } else {
      // User doesn't have any reaction yet - add new one
      const { data: newLike, error: insertError } = await supabaseAdmin
        .from('likes')
        .insert({
          user_id: user.id,
          entity_type: entity_type,
          entity_id: entity_id,
          like_type: reaction_type,
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('❌ Error adding like:', insertError)
        return NextResponse.json({ error: `Failed to add like: ${insertError.message}` }, { status: 500 })
      }

      action = 'added'
      like_id = newLike.id
      user_reaction = reaction_type
    }

    // Fetch the updated total count
    try {
      const { count, error: countError } = await supabaseAdmin
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', entity_type)
        .eq('entity_id', entity_id)

      if (!countError && count !== null) {
        total_count = count
      } else if (countError) {
        console.warn('⚠️ Warning: Failed to fetch updated total count:', countError)
      }
    } catch (countErr) {
      console.warn('⚠️ Warning: Unexpected error fetching total count:', countErr)
    }

    // For non-activity entities, return total count so client can update without refetch
    if (total_count === undefined) {
      try {
        const { count, error: countError } = await supabaseAdmin
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('entity_type', entity_type)
          .eq('entity_id', entity_id)
        if (!countError && count !== null) total_count = count
      } catch {
        // ignore
      }
    }

    console.log('✅ Reaction processed successfully:', {
      action,
      reaction_type,
      like_id,
      total_count,
      user_reaction,
    })

    return NextResponse.json({
      success: true,
      action,
      reaction_type,
      like_id,
      total_count,
      user_reaction,
      message: action === 'removed' ? 'Reaction removed successfully' : 'Reaction added successfully',
    })

  } catch (error) {
    console.error('❌ Unexpected error in reaction API:', error)
    return NextResponse.json({ 
      error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 })
  }
}

