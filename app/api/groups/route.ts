import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'


export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const limit = parseInt(searchParams.get('limit') || '50')
    const is_private = searchParams.get('is_private') === 'true'
    const created_by = searchParams.get('created_by')
    const search = searchParams.get('search')
    const sort_by = searchParams.get('sort_by') || 'created_at'
    const sort_order = searchParams.get('sort_order') || 'desc'

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query
    let query = supabase
      .from('groups')
      .select(`
        id,
        name,
        description,
        member_count,
        created_at,
        is_private,
        created_by,
        cover_image_url
      `)

    // Apply filters
    if (is_private !== undefined) {
      query = query.eq('is_private', is_private)
    }

    if (created_by) {
      query = query.eq('created_by', created_by)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply sorting
    const ascending = sort_order === 'asc'
    query = query.order(sort_by, { ascending })

    // Apply limit
    query = query.limit(limit)

    const { data: groups, error } = await query

    if (error) {
      console.error('Groups query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ groups: groups || [] })

  } catch (error) {
    console.error('Groups API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, is_private = false, cover_image_url } = body

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    if (name.length > 255) {
      return NextResponse.json({ error: 'Group name must be 255 characters or less' }, { status: 400 })
    }

    // Create the group
    const { data: group, error } = await (supabase
      .from('groups') as any)
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        is_private,
        cover_image_url: cover_image_url || null,
        created_by: user.id,
        member_count: 1 // Creator is automatically a member
      })
      .select()
      .single()

    if (error) {
      console.error('Group creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // TODO: Add creator as first member to group_members table when it exists

    return NextResponse.json({ group }, { status: 201 })

  } catch (error) {
    console.error('Group creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 