import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
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
      share_message: share_message?.substring(0, 100) + '...'
    })

    // Check if user already shared this entity
    const { data: existingShare, error: checkError } = await supabaseAdmin
      .from('engagement_shares')
      .select('id')
      .eq('user_id', user.id)
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error checking existing share:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing share' },
        { status: 500 }
      )
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
          updated_at: new Date().toISOString()
        })
        .eq('id', existingShare.id)
        .select('id')
        .single()

      if (updateError) {
        console.error('❌ Error updating share:', updateError)
        return NextResponse.json(
          { error: 'Failed to update share' },
          { status: 500 }
        )
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
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('❌ Error inserting share:', insertError)
        return NextResponse.json(
          { error: 'Failed to add share' },
          { status: 500 }
        )
      }

      action = 'added'
      share_id = newShare.id
    }

    // Update engagement counts in activities table if this is an activity
    if (entity_type === 'activity') {
      try {
        // Get current share count for this activity
        const { data: shareCount, error: countError } = await supabaseAdmin
          .from('engagement_shares')
          .select('id', { count: 'exact' })
          .eq('entity_type', entity_type)
          .eq('entity_id', entity_id)

        if (!countError && shareCount !== null) {
          // Update the activities table with new share count
          const { error: updateError } = await supabaseAdmin
            .from('activities')
            .update({
              share_count: shareCount.length,
              updated_at: new Date().toISOString()
            })
            .eq('id', entity_id)

          if (updateError) {
            console.warn('⚠️ Warning: Failed to update activity share count:', updateError)
            // Don't fail the request for this, just log it
          }
        }
      } catch (error) {
        console.warn('⚠️ Warning: Failed to update activity share count:', error)
        // Don't fail the request for this, just log it
      }
    }

    console.log('✅ Share processed successfully:', {
      action,
      share_id,
      entity_type,
      entity_id
    })

    return NextResponse.json({
      success: true,
      action,
      share_id,
      entity_type,
      entity_id,
      message: action === 'updated' 
        ? 'Share updated successfully' 
        : 'Share added successfully'
    })

  } catch (error) {
    console.error('❌ Unexpected error in share API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
