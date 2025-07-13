import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schemas
const createGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  visibility: z.enum(['public', 'private', 'secret', 'organization']),
  parent_group_id: z.string().uuid().optional(),
  organization_id: z.string().uuid().optional(),
  max_members: z.number().optional(),
  requires_approval: z.boolean().optional(),
  auto_approve_members: z.boolean().optional(),
  content_moderation_enabled: z.boolean().optional(),
  analytics_enabled: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
})

const updateGroupSchema = createGroupSchema.partial()

const membershipSchema = z.object({
  user_id: z.string().uuid(),
  role: z.string(),
  status: z.enum(['pending', 'active', 'suspended', 'banned']).optional(),
  expires_at: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional()
})

const moderationSchema = z.object({
  content_id: z.string().uuid(),
  content_type: z.enum(['post', 'comment', 'book', 'event', 'resource']),
  status: z.enum(['pending', 'approved', 'rejected', 'flagged']),
  reason: z.string().optional()
})

// Helper function to check permissions
async function checkPermission(supabase: any, groupId: string, permission: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_group_permission', {
    group_id: groupId,
    permission: permission
  })
  
  if (error) throw error
  return data
}

// API Routes

// GET /api/groups/enterprise
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get query parameters
    const visibility = searchParams.get('visibility')
    const parentId = searchParams.get('parent_id')
    const organizationId = searchParams.get('organization_id')
    const includeAnalytics = searchParams.get('include_analytics') === 'true'
    const includeMembers = searchParams.get('include_members') === 'true'
    
    // Build query
    let query = supabase.from('groups').select(`
      *,
      parent_group:groups!parent_group_id(name)
      ${includeMembers ? ',members:group_memberships(user_id, role_id, status)' : ''}
      ${includeAnalytics ? ',analytics:group_analytics(metric_name, metric_value)' : ''}
    `)
    
    // Apply filters
    if (visibility) query = query.eq('visibility', visibility)
    if (parentId) query = query.eq('parent_group_id', parentId)
    if (organizationId) query = query.eq('organization_id', organizationId)
    
    const { data: groups, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({ groups })
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
  }
}

// POST /api/groups/enterprise
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Validate input
    const validatedData = createGroupSchema.parse(body)
    
    // Create group
    const { data: group, error } = await supabase
      .from('groups')
      .insert(validatedData)
      .select()
      .single()
    
    if (error) throw error
    
    // Create owner role for creator
    const { data: user } = await supabase.auth.getUser()
    if (!user?.user?.id) throw new Error('User not authenticated')
    
    await supabase.from('group_memberships').insert({
      group_id: group.id,
      user_id: user.user.id,
      role: 'owner',
      status: 'active'
    })
    
    return NextResponse.json({ group })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}

// PUT /api/groups/enterprise/:id
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Check permissions
    const hasPermission = await checkPermission(supabase, params.id, 'manage_group')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Validate input
    const validatedData = updateGroupSchema.parse(body)
    
    // Update group
    const { data: group, error } = await supabase
      .from('groups')
      .update(validatedData)
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ group })
  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 })
  }
}

// POST /api/groups/enterprise/:id/members
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Check permissions
    const hasPermission = await checkPermission(supabase, params.id, 'manage_members')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Validate input
    const validatedData = membershipSchema.parse(body)
    
    // Add member
    const { data: membership, error } = await supabase
      .from('group_memberships')
      .insert({
        group_id: params.id,
        ...validatedData
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ membership })
  } catch (error) {
    console.error('Error adding member:', error)
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
  }
}

// POST /api/groups/enterprise/:id/moderation
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Check permissions
    const hasPermission = await checkPermission(supabase, params.id, 'moderate_content')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Validate input
    const validatedData = moderationSchema.parse(body)
    
    // Create moderation entry
    const { data: moderation, error } = await supabase
      .from('group_content_moderation')
      .insert({
        group_id: params.id,
        ...validatedData
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ moderation })
  } catch (error) {
    console.error('Error moderating content:', error)
    return NextResponse.json({ error: 'Failed to moderate content' }, { status: 500 })
  }
}

// GET /api/groups/enterprise/:id/analytics
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    // Check permissions
    const hasPermission = await checkPermission(supabase, params.id, 'view_analytics')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Get query parameters
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const metrics = searchParams.get('metrics')?.split(',')
    
    // Build query
    let query = supabase
      .from('group_analytics')
      .select('*')
      .eq('group_id', params.id)
    
    if (startDate) query = query.gte('timestamp', startDate)
    if (endDate) query = query.lte('timestamp', endDate)
    if (metrics) query = query.in('metric_name', metrics)
    
    const { data: analytics, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

// GET /api/groups/enterprise/:id/audit
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    // Check permissions
    const hasPermission = await checkPermission(supabase, params.id, 'view_audit_logs')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Get query parameters
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const actions = searchParams.get('actions')?.split(',')
    
    // Build query
    let query = supabase
      .from('group_audit_log')
      .select('*')
      .eq('group_id', params.id)
    
    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)
    if (actions) query = query.in('action', actions)
    
    const { data: auditLogs, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({ auditLogs })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
} 