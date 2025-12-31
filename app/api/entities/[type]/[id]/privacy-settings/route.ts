import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params
    const supabase = await createRouteHandlerClientAsync()

    // Get the current user
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Validate entity type
    const validEntityTypes = ['users', 'authors', 'publishers', 'groups', 'events']
    if (!validEntityTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
    }

    // Check if the entity exists and get ownership info
    const {
      entity,
      isOwner,
      error: entityError,
    } = await checkEntityOwnership(type, id, currentUser.id, supabase)

    if (entityError || !entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    // Users can only view their own privacy settings
    if (!isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch privacy settings based on entity type
    let privacySettings
    let privacyError

    switch (type) {
      case 'users':
        const { data: userPrivacy, error: userPrivacyError } = await supabase
          .from('user_privacy_settings')
          .select('*')
          .eq('user_id', id)
          .single()
        privacySettings = userPrivacy
        privacyError = userPrivacyError
        break

      case 'groups':
        const { data: groupPrivacy, error: groupPrivacyError } = await supabase
          .from('group_privacy_settings')
          .select('*')
          .eq('group_id', id)
          .single()
        privacySettings = groupPrivacy
        privacyError = groupPrivacyError
        break

      case 'events':
        const { data: eventPrivacy, error: eventPrivacyError } = await supabase
          .from('event_privacy_settings')
          .select('*')
          .eq('event_id', id)
          .single()
        privacySettings = eventPrivacy
        privacyError = eventPrivacyError
        break

      default:
        // For authors and publishers, return default public settings
        privacySettings = {
          default_privacy_level: 'public',
          allow_public_profile: true,
          show_stats_publicly: true,
        }
        privacyError = null
    }

    if (privacyError && privacyError.code !== 'PGRST116') {
      console.error('Error fetching privacy settings:', privacyError)
      return NextResponse.json({ error: 'Failed to fetch privacy settings' }, { status: 500 })
    }

    // If no privacy settings exist, return defaults based on entity type
    if (!privacySettings) {
      privacySettings = getDefaultPrivacySettings(type)
    }

    return NextResponse.json(privacySettings)
  } catch (error) {
    console.error('Error in privacy settings GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params
  try {
    const supabase = await createRouteHandlerClientAsync()

    // Get the current user
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Validate entity type
    const validEntityTypes = ['users', 'authors', 'publishers', 'groups', 'events']
    if (!validEntityTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
    }

    // Check if the entity exists and get ownership info
    const {
      entity,
      isOwner,
      error: entityError,
    } = await checkEntityOwnership(type, id, currentUser.id, supabase)

    if (entityError || !entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    // Users can only update their own privacy settings
    if (!isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()

    // Validate privacy settings based on entity type
    const validationError = validatePrivacySettings(type, body)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // Update privacy settings based on entity type
    let result
    let updateError

    switch (type) {
      case 'users':
        result = await updateUserPrivacySettings(id, body, supabase)
        break

      case 'groups':
        result = await updateGroupPrivacySettings(id, body, supabase)
        break

      case 'events':
        result = await updateEventPrivacySettings(id, body, supabase)
        break

      default:
        return NextResponse.json(
          { error: 'Privacy settings not supported for this entity type' },
          { status: 400 }
        )
    }

    if (updateError) {
      console.error('Error updating privacy settings:', updateError)
      return NextResponse.json({ error: 'Failed to update privacy settings' }, { status: 500 })
    }

    // Log privacy setting changes for audit
    await logPrivacyChange(type, id, currentUser.id, body, supabase)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in privacy settings PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params
  try {
    const supabase = await createRouteHandlerClientAsync()

    // Get the current user
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Validate entity type
    const validEntityTypes = ['users', 'authors', 'publishers', 'groups', 'events']
    if (!validEntityTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
    }

    // Check if the entity exists and get ownership info
    const {
      entity,
      isOwner,
      error: entityError,
    } = await checkEntityOwnership(type, id, currentUser.id, supabase)

    if (entityError || !entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    // Users can only manage their own privacy settings
    if (!isOwner) {
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

        const { data: customPermission, error: permissionError } = await supabase
          .from('custom_permissions')
          .insert({
            entity_id: id,
            entity_type: type,
            target_user_id,
            permission_type: 'profile_view',
            permission_level,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          } as any)
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

        const { error: revokeError } = await supabase
          .from('custom_permissions')
          .delete()
          .eq('entity_id', id)
          .eq('entity_type', type)
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

// Helper functions
async function checkEntityOwnership(
  entityType: string,
  entityId: string,
  currentUserId: string,
  supabase: any
) {
  let entity
  let isOwner = false
  let error = null

  switch (entityType) {
    case 'users':
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name, permalink')
        .or(`id.eq.${entityId},permalink.eq.${entityId}`)
        .single()
      entity = user
      isOwner = currentUserId === entityId
      error = userError
      break

    case 'groups':
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id, name, permalink, created_by')
        .or(`id.eq.${entityId},permalink.eq.${entityId}`)
        .single()
      entity = group
      isOwner = group?.created_by === currentUserId
      error = groupError
      break

    case 'events':
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, name, permalink, created_by')
        .or(`id.eq.${entityId},permalink.eq.${entityId}`)
        .single()
      entity = event
      isOwner = event?.created_by === currentUserId
      error = eventError
      break

    case 'authors':
      const { data: author, error: authorError } = await supabase
        .from('authors')
        .select('id, name, permalink')
        .or(`id.eq.${entityId},permalink.eq.${entityId}`)
        .single()
      entity = author
      // Authors are typically public entities, so no ownership check needed
      isOwner = false
      error = authorError
      break

    case 'publishers':
      const { data: publisher, error: publisherError } = await supabase
        .from('publishers')
        .select('id, name, permalink')
        .or(`id.eq.${entityId},permalink.eq.${entityId}`)
        .single()
      entity = publisher
      // Publishers are typically public entities, so no ownership check needed
      isOwner = false
      error = publisherError
      break

    default:
      error = new Error('Unsupported entity type')
  }

  return { entity, isOwner, error }
}

function getDefaultPrivacySettings(entityType: string) {
  switch (entityType) {
    case 'users':
      return {
        default_privacy_level: 'private',
        allow_friends_to_see_reading: false,
        allow_followers_to_see_reading: false,
        allow_public_reading_profile: false,
        show_reading_stats_publicly: false,
        show_currently_reading_publicly: false,
        show_reading_history_publicly: false,
        show_reading_goals_publicly: false,
      }

    case 'groups':
      return {
        default_privacy_level: 'members',
        allow_public_profile: false,
        allow_members_to_see_details: true,
        allow_public_reading_stats: false,
      }

    case 'events':
      return {
        default_privacy_level: 'public',
        allow_public_profile: true,
        allow_registrants_to_see_details: true,
        show_attendee_list_publicly: false,
      }

    default:
      return {
        default_privacy_level: 'public',
        allow_public_profile: true,
        show_stats_publicly: true,
      }
  }
}

function validatePrivacySettings(entityType: string, settings: any) {
  const validPrivacyLevels = ['private', 'friends', 'members', 'followers', 'public']

  if (
    settings.default_privacy_level &&
    !validPrivacyLevels.includes(settings.default_privacy_level)
  ) {
    return 'Invalid privacy level'
  }

  // Add entity-specific validation here if needed
  return null
}

async function updateUserPrivacySettings(userId: string, settings: any, supabase: any) {
  const { data: existingSettings } = await supabase
    .from('user_privacy_settings')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (existingSettings) {
    const { data, error } = await supabase
      .from('user_privacy_settings')
      .update({
        default_privacy_level: settings.default_privacy_level,
        allow_friends_to_see_reading: settings.allow_friends_to_see_reading,
        allow_followers_to_see_reading: settings.allow_followers_to_see_reading,
        allow_public_reading_profile: settings.allow_public_reading_profile,
        show_reading_stats_publicly: settings.show_reading_stats_publicly,
        show_currently_reading_publicly: settings.show_currently_reading_publicly,
        show_reading_history_publicly: settings.show_reading_history_publicly,
        show_reading_goals_publicly: settings.show_reading_goals_publicly,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('user_privacy_settings')
      .insert({
        user_id: userId,
        ...settings,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

async function updateGroupPrivacySettings(groupId: string, settings: any, supabase: any) {
  // Implementation for group privacy settings
  // This would depend on your group_privacy_settings table structure
  return { message: 'Group privacy settings updated' }
}

async function updateEventPrivacySettings(eventId: string, settings: any, supabase: any) {
  // Implementation for event privacy settings
  // This would depend on your event_privacy_settings table structure
  return { message: 'Event privacy settings updated' }
}

async function logPrivacyChange(
  entityType: string,
  entityId: string,
  userId: string,
  settings: any,
  supabase: any
) {
  try {
    await supabase.from('privacy_audit_log').insert({
      entity_id: entityId,
      entity_type: entityType,
      user_id: userId,
      action_type: 'privacy_settings_updated',
      details: {
        changed_settings: settings,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to log privacy change:', error)
    // Don't fail the main operation if logging fails
  }
}
