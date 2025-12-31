import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Build a query to get groups with filters
 */
export function buildGroupsQuery(
  supabase: SupabaseClient,
  options: {
    search?: string
    isPrivate?: boolean
    createdBy?: string
    category?: string
    tags?: string[]
    limit?: number
    offset?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}
) {
  const {
    search,
    isPrivate,
    createdBy,
    category,
    tags,
    limit = 50,
    offset = 0,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = options

  let query = supabase.from('groups').select(`
      id,
      name,
      description,
      member_count,
      post_count,
      event_count,
      created_at,
      is_private,
      is_discoverable,
      created_by,
      cover_image_url,
      avatar_url,
      category,
      tags,
      status
    `)

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (isPrivate !== undefined) {
    query = query.eq('is_private', isPrivate)
  }

  if (createdBy) {
    query = query.eq('created_by', createdBy)
  }

  if (category) {
    query = query.eq('category', category)
  }

  if (tags && tags.length > 0) {
    query = query.contains('tags', tags)
  }

  query = query.eq('status', 'active')
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })
  query = query.range(offset, offset + limit - 1)

  return query
}

/**
 * Build a query to get group members with filters
 */
export function buildGroupMembersQuery(
  supabase: SupabaseClient,
  groupId: string,
  options: {
    status?: string
    roleId?: number
    search?: string
    limit?: number
    offset?: number
  } = {}
) {
  const { status, roleId, search, limit = 50, offset = 0 } = options

  let query = supabase
    .from('group_members')
    .select(
      `
      *,
      user:users(id, name, email),
      role:group_roles(id, name, description, permissions)
    `
    )
    .eq('group_id', groupId)

  if (status) {
    query = query.eq('status', status)
  }

  if (roleId) {
    query = query.eq('role_id', roleId)
  }

  if (search) {
    // Note: This would need a join or separate query in production
    // For now, we'll just filter by status
  }

  query = query.order('joined_at', { ascending: false })
  query = query.range(offset, offset + limit - 1)

  return query
}

/**
 * Build a query to get group content with filters
 */
export function buildGroupContentQuery(
  supabase: SupabaseClient,
  groupId: string,
  options: {
    contentType?: string
    isPinned?: boolean
    limit?: number
    offset?: number
  } = {}
) {
  const { contentType, isPinned, limit = 50, offset = 0 } = options

  let query = supabase
    .from('group_content')
    .select(
      `
      *,
      user:users(id, name, email),
      group:groups(id, name)
    `
    )
    .eq('group_id', groupId)

  if (contentType) {
    query = query.eq('content_type', contentType)
  }

  if (isPinned !== undefined) {
    query = query.eq('is_pinned', isPinned)
  }

  query = query.order('is_pinned', { ascending: false })
  query = query.order('created_at', { ascending: false })
  query = query.range(offset, offset + limit - 1)

  return query
}
