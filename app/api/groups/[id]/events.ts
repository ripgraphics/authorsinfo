import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { supabaseAdmin } from '@/lib/supabase/server'

// Helper function to check group event creation permission
async function canCreateGroupEvent(
  groupId: string,
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Check if user is group owner
    const { data: group } = await supabaseAdmin
      .from('groups')
      .select('created_by')
      .eq('id', groupId)
      .single()

    if (group?.created_by === userId) {
      return { allowed: true } // Owner can always create events
    }

    // Get group settings for event creation permission
    const { data: settings } = await supabaseAdmin
      .from('group_settings')
      .select('event_creation_permission')
      .eq('group_id', groupId)
      .single()

    const permission = settings?.event_creation_permission || 'owner'

    // Get user's role in the group
    const { data: member } = await supabaseAdmin
      .from('group_members')
      .select(`
        role_id,
        group_roles!inner(name, permissions)
      `)
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (!member || !member.group_roles) {
      return { allowed: false, reason: 'You must be a member of this group' }
    }

    const role = Array.isArray(member.group_roles) ? member.group_roles[0] : member.group_roles
    const roleName = role.name?.toLowerCase() || ''
    const permissions = (role.permissions as string[]) || []

    // Check permission based on group settings
    switch (permission) {
      case 'owner':
        return { allowed: false, reason: 'Only the group owner can create events' }
      
      case 'admin':
        if (roleName === 'admin' || roleName === 'owner' || permissions.includes('*') || permissions.includes('create_events')) {
          return { allowed: true }
        }
        return { allowed: false, reason: 'Only group owners and admins can create events' }
      
      case 'list':
        // List level typically means moderators and above
        if (roleName === 'admin' || roleName === 'owner' || roleName === 'moderator' || 
            permissions.includes('*') || permissions.includes('create_events') || permissions.includes('manage_content')) {
          return { allowed: true }
        }
        return { allowed: false, reason: 'You need list-level permissions to create events' }
      
      case 'member':
        // All members can create events
        return { allowed: true }
      
      default:
        return { allowed: false, reason: 'Invalid permission setting' }
    }
  } catch (error) {
    console.error('Error checking group event permission:', error)
    return { allowed: false, reason: 'Error checking permissions' }
  }
}

// GET: List all events for a group
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const { data, error } = await supabase
    .from('group_events')
    .select('*, event:events(*)')
    .eq('group_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// POST: Create a new event for a group
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: groupId } = await params
    const supabase = await createRouteHandlerClientAsync()
    
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has permission to create events in this group
    const permissionCheck = await canCreateGroupEvent(groupId, user.id)
    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.reason || 'You do not have permission to create events in this group' },
        { status: 403 }
      )
    }

    const body = await req.json()
    
    // Validate required fields
    if (!body.title || !body.start_date || !body.end_date || !body.format) {
      return NextResponse.json({ error: 'Missing required fields: title, start_date, end_date, format' }, { status: 400 })
    }

    // Add created_by field (the current user)
    body.created_by = user.id

    // Generate a slug if not provided
    if (!body.slug) {
      const slug = body.title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-')
      body.slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`
    }

    // 1. Create the event
    const { data: event, error: eventError } = await (supabase
      .from('events') as any)
      .insert([body])
      .select()
      .single()
    
    if (eventError) {
      console.error('Error creating event:', eventError)
      return NextResponse.json({ error: eventError.message }, { status: 400 })
    }

    // 2. Link the event to the group
    const { data: groupEvent, error: groupEventError } = await (supabase
      .from('group_events') as any)
      .insert([{ group_id: groupId, event_id: event.id }])
      .select()
      .single()
    
    if (groupEventError) {
      console.error('Error linking event to group:', groupEventError)
      // Try to clean up the event if linking fails
      await supabase.from('events').delete().eq('id', event.id)
      return NextResponse.json({ error: groupEventError.message }, { status: 400 })
    }

    return NextResponse.json({ event, groupEvent }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/groups/[id]/events:', error)
    return NextResponse.json({ error: error.message || 'Failed to create group event' }, { status: 500 })
  }
}
