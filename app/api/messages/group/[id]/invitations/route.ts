import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createGroupInvitation } from '@/app/actions/groups/manage-invitations'
import {
  acceptGroupInvitation,
  cancelGroupInvitation,
  declineGroupInvitation,
} from '@/app/actions/groups/manage-invitations'

const identifier = z.string().uuid()
const invitationSchema = z
  .object({
    invitee_email: z.string().trim().email().max(320).optional(),
    invitee_user_id: identifier.optional(),
    role_id: z.number().int().positive().nullable().optional(),
    message: z.string().trim().max(1000).nullable().optional(),
    expires_at: z.string().datetime().nullable().optional(),
  })
  .strict()
  .refine((value) => Boolean(value.invitee_email || value.invitee_user_id), {
    message: 'An invitee email or user ID is required',
  })

type InvitationContext = { params: Promise<{ id: string }> }
const lifecycleSchema = z
  .object({
    action: z.enum(['accept', 'decline', 'cancel']),
    invitation_id: identifier,
  })
  .strict()

async function handleLifecycle(request: NextRequest, context: InvitationContext) {
  const { id } = await context.params
  if (!identifier.safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid group invitation request' }, { status: 400 })
  }
  const parsed = lifecycleSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid invitation lifecycle request' }, { status: 400 })
  }
  const { action, invitation_id: invitationId } = parsed.data
  const result =
    action === 'accept'
      ? await acceptGroupInvitation({ invitationId })
      : action === 'decline'
        ? await declineGroupInvitation({ invitationId })
        : await cancelGroupInvitation({ invitationId })
  if (!result.success) {
    const status = result.error?.includes('permission') ? 403 : 400
    return NextResponse.json({ error: result.error ?? 'Unable to update invitation' }, { status })
  }
  return NextResponse.json(result.invitation, { status: 200 })
}

export async function POST(request: NextRequest, { params }: InvitationContext) {
  const { id } = await params
  if (!identifier.safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid group invitation request' }, { status: 400 })
  }

  const origin = request.headers.get('origin')
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
  }

  const parsed = invitationSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid group invitation request' }, { status: 400 })
  }

  const result = await createGroupInvitation({
    groupId: id,
    inviteeEmail: parsed.data.invitee_email,
    inviteeUserId: parsed.data.invitee_user_id,
    roleId: parsed.data.role_id,
    message: parsed.data.message,
    expiresAt: parsed.data.expires_at,
  })
  if (!result.success) {
    const status = result.error?.includes('permission') ? 403 : 400
    return NextResponse.json({ error: result.error ?? 'Unable to create invitation' }, { status })
  }

  return NextResponse.json(result.invitation, { status: 201 })
}

export async function PATCH(request: NextRequest, context: InvitationContext) {
  return handleLifecycle(request, context)
}

export async function DELETE(request: NextRequest, context: InvitationContext) {
  const body = await request.json().catch(() => null)
  return handleLifecycle(
    new NextRequest(request.url, {
      method: 'PATCH',
      headers: request.headers,
      body: JSON.stringify({ action: 'cancel', ...(body ?? {}) }),
    }),
    context
  )
}
