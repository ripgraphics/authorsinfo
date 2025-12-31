import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET: List all roles for a group
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const { data, error } = await supabase.from('group_roles').select('*').eq('group_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// POST: Create a new role for a group
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { createGroupRole } = await import('@/app/actions/groups/manage-roles')
    const body = await req.json()

    const result = await createGroupRole({
      groupId: id,
      name: body.name,
      description: body.description,
      permissions: body.permissions || [],
      isDefault: body.is_default,
      displayOrder: body.display_order,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error, warnings: result.warnings }, { status: 400 })
    }

    return NextResponse.json({ role: result.role }, { status: 201 })
  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Update a role
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { updateGroupRole } = await import('@/app/actions/groups/manage-roles')
    const body = await req.json()

    if (!body.role_id) {
      return NextResponse.json({ error: 'role_id is required' }, { status: 400 })
    }

    const result = await updateGroupRole({
      groupId: id,
      roleId: body.role_id,
      name: body.name,
      description: body.description,
      permissions: body.permissions,
      isDefault: body.is_default,
      displayOrder: body.display_order,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error, warnings: result.warnings }, { status: 400 })
    }

    return NextResponse.json({ role: result.role })
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete a role
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { deleteGroupRole } = await import('@/app/actions/groups/manage-roles')
    const body = await req.json()

    if (!body.role_id) {
      return NextResponse.json({ error: 'role_id is required' }, { status: 400 })
    }

    const result = await deleteGroupRole({
      groupId: id,
      roleId: body.role_id,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
