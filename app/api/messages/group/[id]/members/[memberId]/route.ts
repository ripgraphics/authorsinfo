import { NextResponse } from 'next/server'
import { z } from 'zod'
import { removeGroupMember } from '@/app/actions/groups/manage-members'

const identifier = z.string().uuid()
type MemberActionContext = { params: Promise<{ id: string; memberId: string }> }

export async function DELETE(_request: Request, { params }: MemberActionContext) {
  const { id, memberId } = await params
  if (!identifier.safeParse(id).success || !identifier.safeParse(memberId).success) {
    return NextResponse.json({ error: 'Invalid group member request' }, { status: 400 })
  }

  const result = await removeGroupMember({ groupId: id, userId: memberId })
  if (!result.success) {
    const status = result.error?.includes('permission') ? 403 : 400
    return NextResponse.json({ error: result.error ?? 'Unable to update group membership' }, { status })
  }

  return new NextResponse(null, { status: 204 })
}
