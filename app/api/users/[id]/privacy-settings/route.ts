import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const supabase = await createRouteHandlerClientAsync()
    
    // Get the current user
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    // Users can only view their own privacy settings
    if (!currentUser || currentUser.id !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch privacy settings
    const { data: privacySettings, error: privacyError } = await (supabase
      .from('user_privacy_settings') as any)
      .select('*')
      .eq('user_id', userId)
      .single()

    if (privacyError && privacyError.code !== 'PGRST116') {
      console.error('Error fetching privacy settings:', privacyError)
      return NextResponse.json({ error: 'Failed to fetch privacy settings' }, { status: 500 })
    }

    // If no privacy settings exist, return defaults
    if (!privacySettings) {
      const defaultSettings = {
        default_privacy_level: 'private',
        allow_friends_to_see_reading: false,
        allow_followers_to_see_reading: false,
        allow_public_reading_profile: false,
        show_reading_stats_publicly: false,
        show_currently_reading_publicly: false,
        show_reading_history_publicly: false,
        show_reading_goals_publicly: false
      }
      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json(privacySettings)

  } catch (error) {
    console.error('Error in privacy settings GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const supabase = await createRouteHandlerClientAsync()
    
    // Get the current user
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    // Users can only update their own privacy settings
    if (!currentUser || currentUser.id !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate privacy settings
    const validPrivacyLevels = ['private', 'friends', 'followers', 'public']
    if (body.default_privacy_level && !validPrivacyLevels.includes(body.default_privacy_level)) {
      return NextResponse.json({ error: 'Invalid privacy level' }, { status: 400 })
    }

    // Check if privacy settings exist
    const { data: existingSettings } = await (supabase
      .from('user_privacy_settings') as any)
      .select('id')
      .eq('user_id', userId)
      .single()

    let result
    if (existingSettings) {
      // Update existing settings
      const { data, error } = await (supabase
        .from('user_privacy_settings') as any)
        .update({
          default_privacy_level: body.default_privacy_level,
          allow_friends_to_see_reading: body.allow_friends_to_see_reading,
          allow_followers_to_see_reading: body.allow_followers_to_see_reading,
          allow_public_reading_profile: body.allow_public_reading_profile,
          show_reading_stats_publicly: body.show_reading_stats_publicly,
          show_currently_reading_publicly: body.show_currently_reading_publicly,
          show_reading_history_publicly: body.show_reading_history_publicly,
          show_reading_goals_publicly: body.show_reading_goals_publicly,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating privacy settings:', error)
        return NextResponse.json({ error: 'Failed to update privacy settings' }, { status: 500 })
      }
      result = data
    } else {
      // Create new privacy settings
      const { data, error } = await (supabase
        .from('user_privacy_settings') as any)
        .insert({
          user_id: userId,
          default_privacy_level: body.default_privacy_level || 'private',
          allow_friends_to_see_reading: body.allow_friends_to_see_reading || false,
          allow_followers_to_see_reading: body.allow_followers_to_see_reading || false,
          allow_public_reading_profile: body.allow_public_reading_profile || false,
          show_reading_stats_publicly: body.show_reading_stats_publicly || false,
          show_currently_reading_publicly: body.show_currently_reading_publicly || false,
          show_reading_history_publicly: body.show_reading_history_publicly || false,
          show_reading_goals_publicly: body.show_reading_goals_publicly || false
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating privacy settings:', error)
        return NextResponse.json({ error: 'Failed to create privacy settings' }, { status: 500 })
      }
      result = data
    }

    // Log privacy setting changes for audit
    await (supabase
      .from('privacy_audit_log') as any)
      .insert({
        user_id: userId,
        action_type: 'privacy_settings_updated',
        details: {
          previous_settings: existingSettings ? existingSettings : null,
          new_settings: result,
          changed_fields: Object.keys(body)
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in privacy settings PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const supabase = await createRouteHandlerClientAsync()
    
    // Get the current user
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    // Users can only manage their own privacy settings
    if (!currentUser || currentUser.id !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { action, target_user_id, permission_level } = body

    switch (action) {
      case 'grant_custom_permission':
        // Grant custom permission to another user
        if (!target_user_id || !permission_level) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const { data: customPermission, error: permissionError } = await (supabase
          .from('custom_permissions') as any)
          .insert({
            user_id: userId,
            target_user_id,
            permission_type: 'profile_view',
            permission_level,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          })
          .select()
          .single()

        if (permissionError) {
          console.error('Error creating custom permission:', permissionError)
          return NextResponse.json({ error: 'Failed to grant permission' }, { status: 500 })
        }

        return NextResponse.json(customPermission)

      case 'revoke_custom_permission':
        // Revoke custom permission
        if (!target_user_id) {
          return NextResponse.json({ error: 'Missing target user ID' }, { status: 400 })
        }

        const { error: revokeError } = await (supabase
          .from('custom_permissions') as any)
          .delete()
          .eq('user_id', userId)
          .eq('target_user_id', target_user_id)
          .eq('permission_type', 'profile_view')

        if (revokeError) {
          console.error('Error revoking custom permission:', revokeError)
          return NextResponse.json({ error: 'Failed to revoke permission' }, { status: 500 })
        }

        return NextResponse.json({ message: 'Permission revoked successfully' })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in privacy settings POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
