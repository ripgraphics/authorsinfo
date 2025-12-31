import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

interface Task {
  id: string
  task: string
  order_index: number
  completed?: boolean
}

interface Checklist {
  id: string
  title: string
  description: string
  tasks: Task[]
}

interface Props {
  groupId: string
  userId: string
  isAdmin: boolean
}

export default function OnboardingChecklists({ groupId, userId, isAdmin }: Props) {
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tasks: [''] as string[],
  })
  const supabase = createClient()

  useEffect(() => {
    fetchChecklists()
  }, [groupId])

  const fetchChecklists = async () => {
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
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })

    if (error) {
      toast.error('Failed to load checklists')
      return
    }

    // Get user's progress
    const { data: progress } = await supabase
      .from('group_onboarding_progress')
      .select('*')
      .eq('user_id', userId)

    // Combine the data
    const result = data.map((checklist: any) => ({
      ...checklist,
      tasks: checklist.group_onboarding_tasks.map((task: any) => ({
        ...task,
        completed: progress?.some((p: any) => p.task_id === task.id) || false,
      })),
    }))

    setChecklists(result)
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) {
      toast.error('Only admins can create checklists')
      return
    }

    const { data: checklistData, error } = await (
      supabase.from('group_onboarding_checklists') as any
    )
      .insert({
        group_id: groupId,
        title: formData.title,
        description: formData.description,
      })
      .select()
      .single()

    if (error || !checklistData) {
      toast.error('Failed to create checklist')
      return
    }

    // Create tasks
    const tasks = formData.tasks
      .filter((task) => task.trim())
      .map((task, index) => ({
        checklist_id: checklistData.id,
        task,
        order_index: index,
      }))

    if (tasks.length > 0) {
      const { error: tasksError } = await (supabase.from('group_onboarding_tasks') as any).insert(
        tasks
      )

      if (tasksError) {
        toast.error('Failed to create tasks')
        return
      }
    }

    toast.success('Checklist created')
    setShowForm(false)
    setFormData({ title: '', description: '', tasks: [''] })
    fetchChecklists()
  }

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    if (completed) {
      const { error } = await (supabase.from('group_onboarding_progress') as any).insert({
        checklist_id: checklists.find((c) => c.tasks.some((t) => t.id === taskId))?.id,
        user_id: userId,
        task_id: taskId,
        completed_at: new Date().toISOString(),
      })

      if (error) {
        toast.error('Failed to mark task as complete')
        return
      }
    } else {
      const { error } = await supabase
        .from('group_onboarding_progress')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', userId)

      if (error) {
        toast.error('Failed to mark task as incomplete')
        return
      }
    }

    fetchChecklists()
  }

  const handleDeleteChecklist = async (checklistId: string) => {
    if (!isAdmin) {
      toast.error('Only admins can delete checklists')
      return
    }

    const { error } = await supabase
      .from('group_onboarding_checklists')
      .delete()
      .eq('id', checklistId)
      .eq('group_id', groupId)

    if (error) {
      toast.error('Failed to delete checklist')
      return
    }

    toast.success('Checklist deleted')
    fetchChecklists()
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !isAdmin) return

    const checklistId = result.source.droppableId
    const tasks = checklists.find((c) => c.id === checklistId)?.tasks || []
    const [reorderedTask] = tasks.splice(result.source.index, 1)
    tasks.splice(result.destination.index, 0, reorderedTask)

    // Update order_index for all tasks
    const updates = tasks.map((task, index) => ({
      id: task.id,
      order_index: index,
    }))

    const { error } = await (supabase.from('group_onboarding_tasks') as any).upsert(updates)

    if (error) {
      toast.error('Failed to reorder tasks')
      return
    }

    fetchChecklists()
  }

  if (isLoading) {
    return <div>Loading checklists...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Onboarding Checklists</h3>
        {isAdmin && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Create Checklist'}
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tasks</label>
                {formData.tasks.map((task, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={task}
                      onChange={(e) => {
                        const newTasks = [...formData.tasks]
                        newTasks[index] = e.target.value
                        setFormData((prev) => ({ ...prev, tasks: newTasks }))
                      }}
                      placeholder={`Task ${index + 1}`}
                    />
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          const newTasks = formData.tasks.filter((_, i) => i !== index)
                          setFormData((prev) => ({ ...prev, tasks: newTasks }))
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData((prev) => ({ ...prev, tasks: [...prev.tasks, ''] }))}
                >
                  Add Task
                </Button>
              </div>
              <Button type="submit">Create Checklist</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {checklists.map((checklist) => (
          <Card key={checklist.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{checklist.title}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{checklist.description}</p>
                </div>
                {isAdmin && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteChecklist(checklist.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId={checklist.id}>
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {checklist.tasks.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                          isDragDisabled={!isAdmin}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="flex items-center gap-2 p-2 bg-gray-50 rounded-sm"
                            >
                              <Checkbox
                                checked={task.completed}
                                onCheckedChange={(checked) =>
                                  handleTaskToggle(task.id, checked as boolean)
                                }
                              />
                              <span className={task.completed ? 'line-through text-gray-500' : ''}>
                                {task.task}
                              </span>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
