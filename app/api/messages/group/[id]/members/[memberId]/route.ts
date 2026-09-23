import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { removeGroupMember } from '@/app/actions/groups/manage-members'
import { requireUser } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'
import { supabaseAdmin } from '@/lib/supabase/server'

const identifier = z.string().uuid()
const roleUpdateSchema = z.object({ role_id: identifier }).strict()
type MemberActionContext = { params: Promise<{ id: string; memberId: string }> }

export async function DELETE(request: Request, { params }: MemberActionContext) {
  const { id, memberId } = await params
  if (!identifier.safeParse(id).success || !identifier.safeParse(memberId).success) {
    return NextResponse.json({ error: 'Invalid group member request' }, { status: 400 })
  }
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
  }

  const result = await removeGroupMember({ groupId: id, userId: memberId })
  if (!result.success) {
    const status = result.error?.includes('permission') ? 403 : 400
    return NextResponse.json({ error: result.error ?? 'Unable to update group membership' }, { status })
  }

  return new NextResponse(null, { status: 204 })
}

export async function PATCH(request: NextRequest, { params }: MemberActionContext) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const { id, memberId } = await params
    const input = roleUpdateSchema.safeParse(await request.json().catch(() => null))
    if (!identifier.safeParse(id).success || !identifier.safeParse(memberId).success || !input.success) {
      return NextResponse.json({ error: 'Invalid group role request' }, { status: 400 })
    }
    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }
    if (memberId === authentication.context.user.id) {
      return NextResponse.json({ error: 'You cannot change your own role' }, { status: 403 })
    }

    const [{ data: group, error: groupError }, { data: actor, error: actorError }, { data: target, error: targetError }, { data: role, error: roleError }] = await Promise.all([
      supabaseAdmin.from('groups').select('created_by').eq('id', id).maybeSingle(),
      supabaseAdmin.from('group_members').select('role_id, role:group_roles(permissions, name)').eq('group_id', id).eq('user_id', authentication.context.user.id).eq('status', 'active').maybeSingle(),
      supabaseAdmin.from('group_members').select('user_id, role_id, role:group_roles(name)').eq('group_id', id).eq('user_id', memberId).eq('status', 'active').maybeSingle(),
      supabaseAdmin.from('group_roles').select('id, name').eq('group_id', id).eq('id', input.data.role_id).maybeSingle(),
    ])
    if (groupError || actorError || targetError || roleError) throw groupError ?? actorError ?? targetError ?? roleError
    if (!group || !actor || !target || !role) return NextResponse.json({ error: 'Group role update denied' }, { status: 403 })

    const actorRole = Array.isArray(actor.role) ? actor.role[0] : actor.role
    const targetRole = Array.isArray(target.role) ? target.role[0] : target.role
    const permissions = Array.isArray(actorRole?.permissions) ? actorRole.permissions : []
    const isOwner = group.created_by === authentication.context.user.id
    const canManageRoles = isOwner || permissions.includes('*') || permissions.includes('manage_roles')
    if (!canManageRoles) {
      return NextResponse.json({ error: 'You do not have permission to change this role' }, { status: 403 })
    }
    if (targetRole?.name === 'Owner' && !isOwner) {
      return NextResponse.json({ error: 'Only the group owner can change the owner role' }, { status: 403 })
    }
    if (role.name === 'Owner' && !isOwner) {
      return NextResponse.json({ error: 'Only the group owner can assign the owner role' }, { status: 403 })
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('group_members')
      .update({ role_id: input.data.role_id })
      .eq('group_id', id)
      .eq('user_id', memberId)
      .select('user_id, role_id, role:group_roles(id, name, description, permissions)')
      .single()
    if (updateError) throw updateError
    return NextResponse.json(updated, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to update Messenger group role', 500, false)
  }
}
