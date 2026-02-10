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

    // Use likes table for all entity types (activity_likes doesn't exist)
    const { data: existingLike, error: checkError } = await supabaseAdmin
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .eq('like_type', reaction_type) // Check for specific reaction type
      .maybeSingle() // Use maybeSingle as we expect 0 or 1 result

    if (checkError && checkError.code !== 'PGRST116' && checkError.code !== 'PGRST117') {
      // PGRST116 = no rows returned, PGRST117 = multiple rows returned (shouldn't happen with unique constraint)
      console.error('❌ Error checking existing like:', checkError)
      return NextResponse.json({ error: 'Failed to check existing like' }, { status: 500 })
    }

    let action: 'added' | 'removed' = 'added'
    let like_id: string | null = null
    let total_count: number | undefined
    let user_reaction: string | null = null

    if (existingLike) {
      // User already has this specific reaction - remove it (toggle off)
      const { error: deleteError } = await supabaseAdmin
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('entity_type', entity_type)
        .eq('entity_id', entity_id)
        .eq('like_type', reaction_type)

      if (deleteError) {
        console.error('❌ Error removing like:', deleteError)
        return NextResponse.json({ error: 'Failed to remove like' }, { status: 500 })
      }

      action = 'removed'
      like_id = null
      user_reaction = null
    } else {
      // User doesn't have this specific reaction - add new one
      const { data: newLike, error: insertError } = await supabaseAdmin
        .from('likes')
        .insert({
          user_id: user.id,
          entity_type: entity_type,
          entity_id: entity_id,
          like_type: reaction_type, // Store the specific reaction type
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('❌ Error adding like:', insertError)
        return NextResponse.json({ error: 'Failed to add like' }, { status: 500 })
      }

      action = 'added'
      like_id = newLike.id
      user_reaction = reaction_type
    }

    // Update denormalized like count when config defines a count source for this entity type
    const countSource = getLikeCountSource(entity_type)
    if (countSource) {
      try {
        const { count, error: countError } = await supabaseAdmin
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('entity_type', entity_type)
          .eq('entity_id', entity_id)

        if (!countError && count !== null) {
          total_count = count
          if (countSource.table === 'posts' && countSource.column === 'like_count') {
            const { error: updateError } = await supabaseAdmin
              .from('posts')
              .update({
                like_count: count,
                updated_at: new Date().toISOString(),
              })
              .eq('id', entity_id)
            if (updateError) {
              console.warn('⚠️ Warning: Failed to update denormalized count:', updateError)
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Warning: Failed to update denormalized count:', error)
      }
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

