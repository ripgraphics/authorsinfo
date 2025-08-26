import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
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
      return NextResponse.json(
        { error: 'Invalid reaction type' },
        { status: 400 }
      )
    }

    console.log('🔍 Processing reaction:', {
      user_id: user.id,
      entity_type,
      entity_id,
      reaction_type
    })

    // Check if user already has a reaction for this entity
    const { data: existingReaction, error: checkError } = await supabaseAdmin
      .from('engagement_likes')
      .select('id, reaction_type')
      .eq('user_id', user.id)
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error checking existing reaction:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing reaction' },
        { status: 500 }
      )
    }

    let action: 'added' | 'updated' | 'removed' = 'added'
    let comment_id: string | null = null

    if (existingReaction) {
      // User already has a reaction
      if (existingReaction.reaction_type === reaction_type) {
        // Same reaction type - remove it (toggle off)
        const { error: deleteError } = await supabaseAdmin
          .from('engagement_likes')
          .delete()
          .eq('id', existingReaction.id)

        if (deleteError) {
          console.error('❌ Error removing reaction:', deleteError)
          return NextResponse.json(
            { error: 'Failed to remove reaction' },
            { status: 500 }
          )
        }

        action = 'removed'
        comment_id = null
      } else {
        // Different reaction type - update it
        const { error: updateError } = await supabaseAdmin
          .from('engagement_likes')
          .update({ 
            reaction_type,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingReaction.id)

        if (updateError) {
          console.error('❌ Error updating reaction:', updateError)
          return NextResponse.json(
            { error: 'Failed to update reaction' },
            { status: 500 }
          )
        }

        action = 'updated'
        comment_id = existingReaction.id
      }
    } else {
      // User doesn't have a reaction - add new one
      const { data: newReaction, error: insertError } = await supabaseAdmin
        .from('engagement_likes')
        .insert({
          user_id: user.id,
          entity_type,
          entity_id,
          reaction_type,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('❌ Error adding reaction:', insertError)
        return NextResponse.json(
          { error: 'Failed to add reaction' },
          { status: 500 }
        )
      }

      action = 'added'
      comment_id = newReaction.id
    }

    // Update engagement counts in activities table if this is an activity
    if (entity_type === 'activity') {
      try {
        // Get current reaction counts for this activity
        const { data: reactionCounts, error: countError } = await supabaseAdmin
          .from('engagement_likes')
          .select('reaction_type')
          .eq('entity_type', entity_type)
          .eq('entity_id', entity_id)

        if (!countError && reactionCounts) {
          // Count reactions by type
          const counts = reactionCounts.reduce((acc, reaction) => {
            acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1
            return acc
          }, {} as Record<string, number>)

          // Update the activities table with new counts
          const { error: updateError } = await supabaseAdmin
            .from('activities')
            .update({
              like_count: counts.like || 0,
              // You could add separate columns for each reaction type if needed
              updated_at: new Date().toISOString()
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

    console.log('✅ Reaction processed successfully:', {
      action,
      reaction_type,
      comment_id
    })

    return NextResponse.json({
      success: true,
      action,
      reaction_type,
      comment_id,
      message: action === 'removed' 
        ? 'Reaction removed successfully' 
        : action === 'updated'
        ? 'Reaction updated successfully'
        : 'Reaction added successfully'
    })

  } catch (error) {
    console.error('❌ Unexpected error in reaction API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
