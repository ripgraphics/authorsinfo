import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET: List all checklists for a group
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()

  const { data, error } = await supabase
    .from('group_onboarding_checklists')
    .select(
      `
      *,
      group_onboarding_tasks (
        id,
        task,
        order_index
      )
    `
    )
    .eq('group_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// POST: Create a new checklist
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const body = await req.json()

  // Verify user is an admin
  const { data: member, error: memberError } = await supabase
    .from('group_members')
    .select('role_id, group_roles(name)')
    .eq('group_id', id)
    .eq('user_id', body.user_id)
    .single()

  const isOwner =
    Array.isArray(member?.group_roles) && member.group_roles.length > 0
      ? member.group_roles[0]?.name === 'Owner'
      : false
  if (memberError || !member || !isOwner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Create checklist
  const { data: checklist, error: checklistError } = await supabase
    .from('group_onboarding_checklists')
    .insert({
      group_id: id,
      title: body.title,
      description: body.description,
    })
    .select()
    .single()

  if (checklistError) return NextResponse.json({ error: checklistError.message }, { status: 400 })

  // Create tasks
  if (body.tasks && body.tasks.length > 0) {
    const tasks = body.tasks.map((task: string, index: number) => ({
      checklist_id: checklist.id,
      task,
      order_index: index,
    }))

    const { error: tasksError } = await supabase.from('group_onboarding_tasks').insert(tasks)

    if (tasksError) return NextResponse.json({ error: tasksError.message }, { status: 400 })
  }

  return NextResponse.json(checklist)
}

// PATCH: Update a checklist
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const body = await req.json()

  // Verify user is an admin
  const { data: member, error: memberError } = await supabase
    .from('group_members')
    .select('role_id, group_roles(name)')
    .eq('group_id', id)
    .eq('user_id', body.user_id)
    .single()

  const isOwner =
    Array.isArray(member?.group_roles) && member.group_roles.length > 0
      ? member.group_roles[0]?.name === 'Owner'
      : false
  if (memberError || !member || !isOwner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Update checklist
  const { data, error } = await supabase
    .from('group_onboarding_checklists')
    .update({
      title: body.title,
      description: body.description,
    })
    .eq('id', body.checklist_id)
    .eq('group_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// DELETE: Remove a checklist
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const checklistId = req.nextUrl.searchParams.get('checklist_id')

  if (!checklistId) {
    return NextResponse.json({ error: 'Missing checklist_id' }, { status: 400 })
  }

  // Verify user is an admin
  const userId = req.nextUrl.searchParams.get('user_id')
  if (!userId) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
  }

  const { data: member, error: memberError } = await supabase
    .from('group_members')
    .select('role_id, group_roles(name)')
    .eq('group_id', id)
    .eq('user_id', userId)
    .single()

  const isOwner =
    Array.isArray(member?.group_roles) && member.group_roles.length > 0
      ? member.group_roles[0]?.name === 'Owner'
      : false
  if (memberError || !member || !isOwner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Delete checklist and associated tasks
  const { error } = await supabase
    .from('group_onboarding_checklists')
    .delete()
    .eq('id', checklistId)
    .eq('group_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
