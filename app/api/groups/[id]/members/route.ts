import { NextRequest, NextResponse } from 'next/server'

type GroupMembersContext = { params: Promise<{ id: string }> }

async function resolveParams(context: GroupMembersContext) {
  const { id } = await context.params
  return id
}

export async function GET(_request: NextRequest, context: GroupMembersContext) {
  const id = await resolveParams(context)
  return NextResponse.json(
    { error: 'Use the canonical Messenger group members endpoint', canonical_route: `/api/messages/group/${id}/members` },
    { status: 308, headers: { Location: `/api/messages/group/${id}/members` } }
  )
}

export async function POST(_request: NextRequest, context: GroupMembersContext) {
  const id = await resolveParams(context)
  return NextResponse.json(
    { error: 'Use the canonical Messenger group members endpoint', canonical_route: `/api/messages/group/${id}/members` },
    { status: 308, headers: { Location: `/api/messages/group/${id}/members` } }
  )
}