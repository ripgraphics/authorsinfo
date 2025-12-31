'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { supabaseClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface PermissionsManagerProps {
  groupId: string
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  is_custom: boolean
  created_at: string
  updated_at: string
}

const DEFAULT_PERMISSIONS = [
  'view_content',
  'create_content',
  'edit_content',
  'delete_content',
  'invite_members',
  'remove_members',
  'manage_roles',
  'manage_settings',
  'view_analytics',
  'moderate_content',
  'manage_integrations',
]

export function PermissionsManager({ groupId }: PermissionsManagerProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  })
  const [showNewRoleDialog, setShowNewRoleDialog] = useState(false)

  useEffect(() => {
    fetchRoles()
  }, [groupId])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabaseClient
        .from('group_roles')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setRoles(data)
    } catch (error) {
      console.error('Error fetching roles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRole = async () => {
    try {
      const { data, error } = await (supabaseClient.from('group_roles') as any)
        .insert({
          group_id: groupId,
          name: newRole.name,
          description: newRole.description,
          permissions: newRole.permissions,
          is_custom: true,
        })
        .select()
        .single()

      if (error) throw error

      setRoles([...roles, data])
      setShowNewRoleDialog(false)
      setNewRole({ name: '', description: '', permissions: [] })
    } catch (error) {
      console.error('Error creating role:', error)
    }
  }

  const handleUpdateRole = async () => {
    if (!editingRole) return

    try {
      const { error } = await (supabaseClient.from('group_roles') as any)
        .update({
          name: editingRole.name,
          description: editingRole.description,
          permissions: editingRole.permissions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingRole.id)

      if (error) throw error

      setRoles(roles.map((role) => (role.id === editingRole.id ? editingRole : role)))
      setEditingRole(null)
    } catch (error) {
      console.error('Error updating role:', error)
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    try {
      const { error } = await supabaseClient.from('group_roles').delete().eq('id', roleId)

      if (error) throw error

      setRoles(roles.filter((role) => role.id !== roleId))
    } catch (error) {
      console.error('Error deleting role:', error)
    }
  }

  const columns = [
    {
      header: 'Role Name',
      accessorKey: 'name',
      cell: ({ row }: { row: any }) => (
        <div>
          <div className="font-semibold">{row.original.name}</div>
          <div className="text-sm text-muted-foreground">{row.original.description}</div>
        </div>
      ),
    },
    {
      header: 'Permissions',
      cell: ({ row }: { row: any }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.permissions.map((permission: string) => (
            <Badge key={permission} variant="secondary">
              {permission}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: 'Type',
      cell: ({ row }: { row: any }) => (
        <Badge variant={row.original.is_custom ? 'outline' : 'default'}>
          {row.original.is_custom ? 'Custom' : 'Default'}
        </Badge>
      ),
    },
    {
      header: 'Last Updated',
      accessorKey: 'updated_at',
      cell: ({ row }: { row: any }) =>
        format(new Date(row.original.updated_at), 'MMM d, yyyy HH:mm'),
    },
    {
      header: 'Actions',
      cell: ({ row }: { row: any }) => (
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setEditingRole(row.original)}>
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Role</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={editingRole?.name || ''}
                    onChange={(e) =>
                      setEditingRole((prev) =>
                        prev
                          ? {
                              ...prev,
                              name: e.target.value,
                            }
                          : null
                      )
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={editingRole?.description || ''}
                    onChange={(e) =>
                      setEditingRole((prev) =>
                        prev
                          ? {
                              ...prev,
                              description: e.target.value,
                            }
                          : null
                      )
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Permissions</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {DEFAULT_PERMISSIONS.map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          checked={editingRole?.permissions.includes(permission)}
                          onCheckedChange={(checked) => {
                            if (!editingRole) return
                            setEditingRole({
                              ...editingRole,
                              permissions: checked
                                ? [...editingRole.permissions, permission]
                                : editingRole.permissions.filter((p) => p !== permission),
                            })
                          }}
                        />
                        <label className="text-sm">{permission}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingRole(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateRole}>Save Changes</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {row.original.is_custom && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteRole(row.original.id)}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Role Management</h2>
        <Dialog open={showNewRoleDialog} onOpenChange={setShowNewRoleDialog}>
          <DialogTrigger asChild>
            <Button>Create New Role</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="Enter role name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Enter role description"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Permissions</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {DEFAULT_PERMISSIONS.map((permission) => (
                    <div key={permission} className="flex items-center space-x-2">
                      <Checkbox
                        checked={newRole.permissions.includes(permission)}
                        onCheckedChange={(checked) => {
                          setNewRole({
                            ...newRole,
                            permissions: checked
                              ? [...newRole.permissions, permission]
                              : newRole.permissions.filter((p) => p !== permission),
                          })
                        }}
                      />
                      <label className="text-sm">{permission}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewRoleDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRole}>Create Role</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableHead key={index}>{column.header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No roles found.
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role, index) => (
                    <TableRow key={role.id || index}>
                      {columns.map((column, colIndex) => (
                        <TableCell key={colIndex}>
                          {column.cell
                            ? column.cell({ row: { original: role } })
                            : (role as any)[column.accessorKey || '']}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
