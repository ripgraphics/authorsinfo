import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get the current user (optional for view tracking)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const userId = user?.id || null

    // Parse request body
    const { entity_type, entity_id, view_duration, view_source } = await request.json()
    
    if (!entity_type || !entity_id) {
      return NextResponse.json(
        { error: 'Missing required fields: entity_type, entity_id' },
        { status: 400 }
      )
    }

    console.log('🔍 Processing view:', {
      user_id: userId,
      entity_type,
      entity_id,
      view_duration,
      view_source
    })

    // Check if user already viewed this entity recently (within last hour)
    let view_id: string | null = null
    let action: 'added' | 'updated' = 'added'

    if (userId) {
      // For authenticated users, check recent views
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      
      const { data: existingView, error: checkError } = await supabaseAdmin
        .from('engagement_views')
        .select('id, view_count')
        .eq('user_id', userId)
        .eq('entity_type', entity_type)
        .eq('entity_id', entity_id)
        .gte('updated_at', oneHourAgo)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error checking existing view:', checkError)
        return NextResponse.json(
          { error: 'Failed to check existing view' },
          { status: 500 }
        )
      }

      if (existingView) {
        // Update existing view count
        const { data: updatedView, error: updateError } = await supabaseAdmin
          .from('engagement_views')
          .update({
            view_count: (existingView.view_count || 1) + 1,
            view_duration: view_duration || null,
            view_source: view_source || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingView.id)
          .select('id')
          .single()

        if (updateError) {
          console.error('❌ Error updating view:', updateError)
          return NextResponse.json(
            { error: 'Failed to update view' },
            { status: 500 }
          )
        }

        action = 'updated'
        view_id = updatedView.id
      } else {
        // Insert new view
        const { data: newView, error: insertError } = await supabaseAdmin
          .from('engagement_views')
          .insert({
            user_id: userId,
            entity_type,
            entity_id,
            view_count: 1,
            view_duration: view_duration || null,
            view_source: view_source || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single()

        if (insertError) {
          console.error('❌ Error inserting view:', insertError)
          return NextResponse.json(
            { error: 'Failed to add view' },
            { status: 500 }
          )
        }

        action = 'added'
        view_id = newView.id
      }
    } else {
      // For anonymous users, just track the view without storing user-specific data
      // This could be stored in a separate anonymous views table or just counted
      console.log('📊 Anonymous view tracked for:', { entity_type, entity_id })
    }

    // Update engagement counts in activities table if this is an activity
    if (entity_type === 'activity') {
      try {
        // Get current view count for this activity
        const { data: viewCount, error: countError } = await supabaseAdmin
          .from('engagement_views')
          .select('view_count', { count: 'exact' })
          .eq('entity_type', entity_type)
          .eq('entity_id', entity_id)

        if (!countError && viewCount !== null) {
          // Sum up all view counts
          const totalViews = viewCount.reduce((sum, view) => sum + (view.view_count || 1), 0)
          
          // Update the activities table with new view count
          const { error: updateError } = await supabaseAdmin
            .from('activities')
            .update({
              view_count: totalViews,
              updated_at: new Date().toISOString()
            })
            .eq('id', entity_id)

          if (updateError) {
            console.warn('⚠️ Warning: Failed to update activity view count:', updateError)
            // Don't fail the request for this, just log it
          }
        }
      } catch (error) {
        console.warn('⚠️ Warning: Failed to update activity view count:', error)
        // Don't fail the request for this, just log it
      }
    }

    console.log('✅ View processed successfully:', {
      action,
      view_id,
      entity_type,
      entity_id,
      user_id: userId
    })

    return NextResponse.json({
      success: true,
      action,
      view_id,
      entity_type,
      entity_id,
      user_id: userId,
      message: 'View tracked successfully'
    })

  } catch (error) {
    console.error('❌ Unexpected error in view API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
