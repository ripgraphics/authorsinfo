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
      bookmark_note: bookmark_note?.substring(0, 100) + '...'
    })

    // Check if user already bookmarked this entity
    const { data: existingBookmark, error: checkError } = await supabaseAdmin
      .from('engagement_bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error checking existing bookmark:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing bookmark' },
        { status: 500 }
      )
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
        return NextResponse.json(
          { error: 'Failed to remove bookmark' },
          { status: 500 }
        )
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
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('❌ Error inserting bookmark:', insertError)
        return NextResponse.json(
          { error: 'Failed to add bookmark' },
          { status: 500 }
        )
      }

      action = 'added'
      bookmark_id = newBookmark.id
    }

    // Update engagement counts in activities table if this is an activity
    if (entity_type === 'activity') {
      try {
        // Get current bookmark count for this activity
        const { data: bookmarkCount, error: countError } = await supabaseAdmin
          .from('engagement_bookmarks')
          .select('id', { count: 'exact' })
          .eq('entity_type', entity_type)
          .eq('entity_id', entity_id)

        if (!countError && bookmarkCount !== null) {
          // Update the activities table with new bookmark count
          const { error: updateError } = await supabaseAdmin
            .from('activities')
            .update({
              bookmark_count: bookmarkCount.length,
              updated_at: new Date().toISOString()
            })
            .eq('id', entity_id)

          if (updateError) {
            console.warn('⚠️ Warning: Failed to update activity bookmark count:', updateError)
            // Don't fail the request for this, just log it
          }
        }
      } catch (error) {
        console.warn('⚠️ Warning: Failed to update activity bookmark count:', error)
        // Don't fail the request for this, just log it
      }
    }

    console.log('✅ Bookmark processed successfully:', {
      action,
      bookmark_id,
      entity_type,
      entity_id
    })

    return NextResponse.json({
      success: true,
      action,
      bookmark_id,
      entity_type,
      entity_id,
      message: action === 'removed' 
        ? 'Bookmark removed successfully' 
        : 'Bookmark added successfully'
    })

  } catch (error) {
    console.error('❌ Unexpected error in bookmark API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
