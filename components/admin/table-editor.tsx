'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, Save, Trash, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// Update the TableItem interface to include description
interface TableItem {
  id: number
  name: string
  description?: string
  [key: string]: any
}

// Update the TableEditorProps interface to include description
interface TableEditorProps {
  title: string
  items: TableItem[]
  onAdd: (name: string, description?: string) => Promise<void>
  onUpdate: (id: number, name: string, description?: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
  extraColumns?: {
    key: string
    label: string
  }[]
  onUpdateExtra?: (id: number, key: string, value: string) => Promise<void>
  hasDescription?: boolean
}

// Update the component parameters to include hasDescription
export function TableEditor({
  title,
  items,
  onAdd,
  onUpdate,
  onDelete,
  extraColumns = [],
  onUpdateExtra,
  hasDescription = true,
}: TableEditorProps) {
  const router = useRouter()
  const [newItemName, setNewItemName] = useState('')
  // Add a new state for description
  const [newItemDescription, setNewItemDescription] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  // Add a new state for description
  const [editingDescription, setEditingDescription] = useState('')
  const [editingExtra, setEditingExtra] = useState<Record<string, string>>({})
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { toast } = useToast()

  // Update the handleAdd function to include description
  const handleAdd = async () => {
    if (!newItemName.trim()) {
      toast({
        title: 'Error',
        description: 'Name cannot be empty',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      await onAdd(newItemName, hasDescription ? newItemDescription : undefined)
      setNewItemName('')
      setNewItemDescription('')
      setIsAddDialogOpen(false)
      toast({
        title: 'Success',
        description: `${title} added successfully`,
      })
      router.refresh()
    } catch (error) {
      console.error('Error adding item:', error)
      toast({
        title: 'Error',
        description: `Failed to add ${title.toLowerCase()}`,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update the startEditing function to include description
  const startEditing = (item: TableItem) => {
    setEditingId(item.id)
    setEditingName(item.name)
    setEditingDescription(item.description || '')

    const extraValues: Record<string, string> = {}
    extraColumns.forEach((col) => {
      extraValues[col.key] = item[col.key]?.toString() || ''
    })
    setEditingExtra(extraValues)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingName('')
    setEditingExtra({})
    setEditingDescription('')
  }

  // Update the handleUpdate function to include description
  const handleUpdate = async (id: number) => {
    if (!editingName.trim()) {
      toast({
        title: 'Error',
        description: 'Name cannot be empty',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      await onUpdate(id, editingName, hasDescription ? editingDescription : undefined)

      // Update extra columns if provided
      if (onUpdateExtra && extraColumns.length > 0) {
        for (const col of extraColumns) {
          if (editingExtra[col.key] !== undefined) {
            await onUpdateExtra(id, col.key, editingExtra[col.key])
          }
        }
      }

      setEditingId(null)
      toast({
        title: 'Success',
        description: `${title} updated successfully`,
      })
      router.refresh()
    } catch (error) {
      console.error('Error updating item:', error)
      toast({
        title: 'Error',
        description: `Failed to update ${title.toLowerCase()}`,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(`Are you sure you want to delete this ${title.toLowerCase()}?`)) {
      return
    }

    setIsLoading(true)
    try {
      await onDelete(id)
      toast({
        title: 'Success',
        description: `${title} deleted successfully`,
      })
      router.refresh()
    } catch (error) {
      console.error('Error deleting item:', error)
      toast({
        title: 'Error',
        description: `Failed to delete ${title.toLowerCase()}`,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{title} Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add {title}
            </Button>
          </DialogTrigger>
          {/* Update the Dialog content to include description field */}
          {/* Replace the Dialog content with this updated version */}
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New {title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={`Enter ${title.toLowerCase()} name`}
                />
              </div>

              {hasDescription && (
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Input
                    id="description"
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    placeholder={`Enter ${title.toLowerCase()} description`}
                  />
                </div>
              )}

              {extraColumns.map((col) => (
                <div key={col.key} className="space-y-2">
                  <label htmlFor={col.key} className="text-sm font-medium">
                    {col.label}
                  </label>
                  <Input
                    id={col.key}
                    value={editingExtra[col.key] || ''}
                    onChange={(e) =>
                      setEditingExtra({ ...editingExtra, [col.key]: e.target.value })
                    }
                    placeholder={`Enter ${col.label.toLowerCase()}`}
                  />
                </div>
              ))}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        {/* Update the Table to include description column */}
        {/* Replace the TableHeader with this updated version */}
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            {hasDescription && <TableHead>Description</TableHead>}
            {extraColumns.map((col) => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        {/* Update the TableBody to include description column */}
        {/* Replace the TableBody with this updated version */}
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={hasDescription ? 4 + extraColumns.length : 3 + extraColumns.length}
                className="text-center py-8 text-muted-foreground"
              >
                No {title.toLowerCase()} found. Add one to get started.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>
                  {editingId === item.id ? (
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="max-w-xs"
                    />
                  ) : (
                    item.name
                  )}
                </TableCell>

                {hasDescription && (
                  <TableCell>
                    {editingId === item.id ? (
                      <Input
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        className="max-w-xs"
                      />
                    ) : (
                      item.description
                    )}
                  </TableCell>
                )}

                {extraColumns.map((col) => (
                  <TableCell key={col.key}>
                    {editingId === item.id ? (
                      <Input
                        value={editingExtra[col.key] || ''}
                        onChange={(e) =>
                          setEditingExtra({ ...editingExtra, [col.key]: e.target.value })
                        }
                        className="max-w-xs"
                      />
                    ) : (
                      item[col.key]
                    )}
                  </TableCell>
                ))}

                <TableCell className="text-right">
                  {editingId === item.id ? (
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={cancelEditing}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        onClick={() => handleUpdate(item.id)}
                        disabled={isLoading}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end space-x-2">
                      <Button size="icon" variant="outline" onClick={() => startEditing(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDelete(item.id)}
                        disabled={isLoading}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </div>
    </div>
  )
}
