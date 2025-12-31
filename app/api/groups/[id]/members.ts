import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET: List all members and their roles for a group
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const { data, error } = await supabase
    .from('group_members')
    .select('*, user:users(id, name, email), role:group_roles(id, name, description, permissions)')
    .eq('group_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// POST: Add a member to a group
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { addGroupMember } = await import('@/app/actions/groups/manage-members')
    const body = await req.json()

    const result = await addGroupMember({
      groupId: id,
      userId: body.user_id,
      roleId: body.role_id,
      status: body.status,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error, warnings: result.warnings }, { status: 400 })
    }

    return NextResponse.json({ member: result.member }, { status: 201 })
  } catch (error) {
    console.error('Error adding member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Update a member's role or status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { updateGroupMember } = await import('@/app/actions/groups/manage-members')
    const body = await req.json()

    const result = await updateGroupMember({
      groupId: id,
      userId: body.user_id,
      roleId: body.role_id,
      status: body.status,
      notificationPreferences: body.notification_preferences,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error, warnings: result.warnings }, { status: 400 })
    }

    return NextResponse.json({ member: result.member })
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Remove a member from a group
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { removeGroupMember } = await import('@/app/actions/groups/manage-members')
    const body = await req.json()

    if (!body.user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    const result = await removeGroupMember({
      groupId: id,
      userId: body.user_id,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
