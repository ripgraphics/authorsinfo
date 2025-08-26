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
    const action = body.action || 'create_group'
    
    switch (action) {
      case 'create_group':
        // Validate input
        const validatedData = createGroupSchema.parse(body)
        
        // Create group
        const { data: group, error } = await supabase
          .from('groups')
          .insert(validatedData)
          .select()
          .single()
        
        if (error) throw error
        
        return NextResponse.json({ group })
        
      case 'add_member':
        // Check permissions
        const hasPermission = await checkPermission(supabase, body.group_id, 'manage_members')
        if (!hasPermission) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        
        // Validate input
        const validatedMemberData = membershipSchema.parse(body)
        
        // Add member
        const { data: membership, error: memberError } = await supabase
          .from('group_memberships')
          .insert({
            group_id: body.group_id,
            ...validatedMemberData
          })
          .select()
          .single()
        
        if (memberError) throw memberError
        
        return NextResponse.json({ membership })
        
      case 'moderate_content':
        // Check permissions
        const hasModPermission = await checkPermission(supabase, body.group_id, 'moderate_content')
        if (!hasModPermission) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        
        // Validate input
        const validatedModData = moderationSchema.parse(body)
        
        // Create moderation entry
        const { data: moderation, error: modError } = await supabase
          .from('group_content_moderation')
          .insert({
            group_id: body.group_id,
            ...validatedModData
          })
          .select()
          .single()
        
        if (modError) throw modError
        
        return NextResponse.json({ moderation })
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in enterprise groups API:', error)
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  }
} 