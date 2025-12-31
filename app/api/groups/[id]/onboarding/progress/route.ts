import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET: Get user's progress for all checklists
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const userId = req.nextUrl.searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
  }

  // Get all checklists and their tasks
  const { data: checklists, error: checklistsError } = await supabase
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

  if (checklistsError) return NextResponse.json({ error: checklistsError.message }, { status: 400 })

  // Get user's progress
  const { data: progress, error: progressError } = await supabase
    .from('group_onboarding_progress')
    .select('*')
    .eq('user_id', userId)

  if (progressError) return NextResponse.json({ error: progressError.message }, { status: 400 })

  // Combine the data
  const result = checklists.map((checklist: any) => ({
    ...checklist,
    tasks: (checklist.group_onboarding_tasks || []).map((task: any) => ({
      ...task,
      completed: progress.some((p: any) => p.task_id === task.id),
    })),
  }))

  return NextResponse.json(result)
}

// POST: Mark a task as completed
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const body = await req.json()

  if (!body.user_id || !body.task_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify the task belongs to the group
  const { data: task, error: taskError } = await supabase
    .from('group_onboarding_tasks')
    .select('checklist_id')
    .eq('id', body.task_id)
    .single()

  if (taskError) return NextResponse.json({ error: taskError.message }, { status: 400 })

  const { data: checklist, error: checklistError } = await supabase
    .from('group_onboarding_checklists')
    .select('id')
    .eq('id', task.checklist_id)
    .eq('group_id', id)
    .single()

  if (checklistError)
    return NextResponse.json({ error: 'Task not found in group' }, { status: 400 })

  // Mark task as completed
  const { data, error } = await supabase
    .from('group_onboarding_progress')
    .insert({
      checklist_id: task.checklist_id,
      user_id: body.user_id,
      task_id: body.task_id,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// DELETE: Mark a task as incomplete
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const taskId = req.nextUrl.searchParams.get('task_id')
  const userId = req.nextUrl.searchParams.get('user_id')

  if (!taskId || !userId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify the task belongs to the group
  const { data: task, error: taskError } = await supabase
    .from('group_onboarding_tasks')
    .select('checklist_id')
    .eq('id', taskId)
    .single()

  if (taskError) return NextResponse.json({ error: taskError.message }, { status: 400 })

  const { data: checklist, error: checklistError } = await supabase
    .from('group_onboarding_checklists')
    .select('id')
    .eq('id', task.checklist_id)
    .eq('group_id', id)
    .single()

  if (checklistError)
    return NextResponse.json({ error: 'Task not found in group' }, { status: 400 })

  // Remove progress record
  const { error } = await supabase
    .from('group_onboarding_progress')
    .delete()
    .eq('task_id', taskId)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
