"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { supabaseClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface MemberManagementProps {
  groupId: string
}

interface Member {
  user_id: string
  roles: string[]
  joined_at: string
  invited_by: string
  status: 'active' | 'suspended' | 'muted'
  suspension_reason?: string
  suspension_ends_at?: string
  last_active_at: string
  user: {
    name: string
    email: string
    avatar_url?: string
  }
  inviter?: {
    name: string
  }
}

export function MemberManagement({ groupId }: MemberManagementProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    status: '',
    role: '',
    search: ''
  })
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [suspensionReason, setSuspensionReason] = useState('')
  const [suspensionDuration, setSuspensionDuration] = useState('24h')

  useEffect(() => {
    fetchMembers()
  }, [groupId, filter])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      let query = supabaseClient
        .from('group_members')
        .select(`
          *,
          user:user_id(
            name,
            email,
            avatar_url
          ),
          inviter:invited_by(
            name
          )
        `)
        .eq('group_id', groupId)

      if (filter.status && filter.status !== 'all') {
        query = query.eq('status', filter.status)
      }
      if (filter.role && filter.role !== 'all') {
        query = query.contains('roles', [filter.role])
      }

      const { data, error } = await query

      if (error) throw error

      // Apply search filter client-side
      let filtered = data
      if (filter.search) {
        const searchLower = filter.search.toLowerCase()
        filtered = data.filter((member: any) =>
          member.user.name.toLowerCase().includes(searchLower) ||
          member.user.email.toLowerCase().includes(searchLower)
        )
      }

      setMembers(filtered)
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMember = async () => {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await (supabaseClient
        .from('group_invitations') as any)
        .insert({
          group_id: groupId,
          email: inviteEmail,
          invited_by: user.id,
          role: inviteRole,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })

      if (error) throw error

      setInviteEmail('')
      setInviteRole('member')
    } catch (error) {
      console.error('Error inviting member:', error)
    }
  }

  const handleUpdateRole = async (userId: string, newRoles: string[]) => {
    try {
      const { error } = await (supabaseClient
        .from('group_members') as any)
        .update({ roles: newRoles })
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (error) throw error

      await fetchMembers()
    } catch (error) {
      console.error('Error updating role:', error)
    }
  }

  const handleSuspendMember = async (userId: string) => {
    try {
      let suspensionEndsAt
      switch (suspensionDuration) {
        case '24h':
          suspensionEndsAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
          break
        case '7d':
          suspensionEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          suspensionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          break
        case 'permanent':
          suspensionEndsAt = null
          break
      }

      const { error } = await (supabaseClient
        .from('group_members') as any)
        .update({
          status: 'suspended',
          suspension_reason: suspensionReason,
          suspension_ends_at: suspensionEndsAt?.toISOString()
        })
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (error) throw error

      await fetchMembers()
      setSelectedMember(null)
      setSuspensionReason('')
      setSuspensionDuration('24h')
    } catch (error) {
      console.error('Error suspending member:', error)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      const { error } = await supabaseClient
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (error) throw error

      await fetchMembers()
    } catch (error) {
      console.error('Error removing member:', error)
    }
  }

  const columns = [
    {
      header: 'Member',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          {row.original.user.avatar_url && (
            <img
              src={row.original.user.avatar_url}
              alt={row.original.user.name}
              className="w-8 h-8 rounded-full"
            />
          )}
          <div>
            <div className="font-medium">{row.original.user.name}</div>
            <div className="text-sm text-muted-foreground">{row.original.user.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Roles',
      cell: ({ row }: { row: any }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.roles.map((role: string) => (
            <Badge key={role} variant="secondary">
              {role}
            </Badge>
          ))}
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }: { row: any }) => (
        <Badge variant={
          row.original.status === 'active' ? 'secondary' :
          row.original.status === 'suspended' ? 'destructive' :
          'outline'
        }>
          {row.original.status}
        </Badge>
      )
    },
    {
      header: 'Joined',
      accessorKey: 'joined_at',
      cell: ({ row }: { row: any }) => format(new Date(row.original.joined_at), 'MMM d, yyyy')
    },
    {
      header: 'Last Active',
      accessorKey: 'last_active_at',
      cell: ({ row }: { row: any }) => format(new Date(row.original.last_active_at), 'MMM d, yyyy HH:mm')
    },
    {
      header: 'Actions',
      cell: ({ row }: { row: any }) => (
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMember(row.original)}
              >
                Manage
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manage Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Roles</label>
                  <Select
                    value={row.original.roles[0]}
                    onValueChange={(value) => handleUpdateRole(row.original.user_id, [value])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Suspension</label>
                  <div className="space-y-2">
                    <Select
                      value={suspensionDuration}
                      onValueChange={setSuspensionDuration}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24 Hours</SelectItem>
                        <SelectItem value="7d">7 Days</SelectItem>
                        <SelectItem value="30d">30 Days</SelectItem>
                        <SelectItem value="permanent">Permanent</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Reason for suspension"
                      value={suspensionReason}
                      onChange={(e) => setSuspensionReason(e.target.value)}
                    />
                    <Button
                      variant="destructive"
                      onClick={() => handleSuspendMember(row.original.user_id)}
                    >
                      Suspend Member
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    onClick={() => handleRemoveMember(row.original.user_id)}
                  >
                    Remove from Group
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Member Management</h2>
        <div className="flex gap-4">
          <Input
            placeholder="Search members..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="w-64"
          />
          <Select
            value={filter.status}
            onValueChange={(value) => setFilter({ ...filter, status: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="muted">Muted</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filter.role}
            onValueChange={(value) => setFilter({ ...filter, role: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Invite Member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleInviteMember}>
                    Send Invitation
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
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
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No members found.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member, index) => (
                    <TableRow key={member.user_id || index}>
                      {columns.map((column, colIndex) => (
                        <TableCell key={colIndex}>
                          {column.cell ? column.cell({ row: { original: member } }) : (member as any)[column.accessorKey || '']}
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