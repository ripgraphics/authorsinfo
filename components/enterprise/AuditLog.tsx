"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { supabaseClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface AuditLogProps {
  groupId: string
}

interface AuditEntry {
  id: string
  actor_id: string
  action: string
  target_type: string
  target_id: string
  changes: any
  metadata: any
  created_at: string
  actor?: {
    name: string
    email: string
  }
}

export function AuditLog({ groupId }: AuditLogProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    action: '',
    targetType: '',
    search: '',
    dateRange: '7d'
  })
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null)

  useEffect(() => {
    fetchAuditLog()
  }, [groupId, filter])

  const fetchAuditLog = async () => {
    try {
      setLoading(true)
      let query = supabaseClient
        .from('group_audit_logs')
        .select(`
          *,
          actor:actor_id(
            name,
            email
          )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filter.action && filter.action !== 'all') {
        query = query.eq('action', filter.action)
      }
      if (filter.targetType && filter.targetType !== 'all') {
        query = query.eq('target_type', filter.targetType)
      }

      // Date range filter
      const now = new Date()
      let startDate: Date | undefined
      switch (filter.dateRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = undefined
      }
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      // Apply search filter client-side for more flexibility
      let filtered = data
      if (filter.search) {
        const searchLower = filter.search.toLowerCase()
        filtered = data.filter(entry =>
          entry.action.toLowerCase().includes(searchLower) ||
          entry.target_type.toLowerCase().includes(searchLower) ||
          entry.actor?.name?.toLowerCase().includes(searchLower) ||
          JSON.stringify(entry.changes).toLowerCase().includes(searchLower)
        )
      }

      setEntries(filtered)
    } catch (error) {
      console.error('Error fetching audit log:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatChanges = (changes: any) => {
    if (!changes) return null
    return (
      <div className="space-y-2">
        {Object.entries(changes).map(([key, value]: [string, any]) => (
          <div key={key} className="text-sm">
            <span className="font-semibold">{key}:</span>
            <br />
            {value.old && (
              <span className="text-red-500 line-through block">
                {JSON.stringify(value.old)}
              </span>
            )}
            {value.new && (
              <span className="text-green-500 block">
                {JSON.stringify(value.new)}
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }

  const columns = [
    {
      header: 'Time',
      accessorKey: 'created_at',
      cell: ({ row }: { row: any }) => format(new Date(row.original.created_at), 'MMM d, yyyy HH:mm:ss')
    },
    {
      header: 'Actor',
      cell: ({ row }: { row: any }) => (
        <div>
          <div>{row.original.actor?.name || 'Unknown'}</div>
          <div className="text-sm text-muted-foreground">{row.original.actor?.email}</div>
        </div>
      )
    },
    {
      header: 'Action',
      accessorKey: 'action',
      cell: ({ row }: { row: any }) => (
        <Badge variant="outline">{row.original.action}</Badge>
      )
    },
    {
      header: 'Target',
      cell: ({ row }: { row: any }) => (
        <div>
          <Badge variant="secondary">{row.original.target_type}</Badge>
          <div className="text-sm text-muted-foreground mt-1">{row.original.target_id}</div>
        </div>
      )
    },
    {
      header: 'Details',
      cell: ({ row }: { row: any }) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedEntry(row.original)}
            >
              View Changes
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Audit Entry Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Changes</h4>
                {formatChanges(row.original.changes)}
              </div>
              {row.original.metadata && (
                <div>
                  <h4 className="font-semibold mb-2">Additional Information</h4>
                  <pre className="text-sm bg-muted p-2 rounded">
                    {JSON.stringify(row.original.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Audit Log</h2>
        <div className="flex gap-4">
          <Input
            placeholder="Search..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="w-64"
          />
          <Select
            value={filter.action}
            onValueChange={(value) => setFilter({ ...filter, action: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filter.targetType}
            onValueChange={(value) => setFilter({ ...filter, targetType: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by target" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="content">Content</SelectItem>
              <SelectItem value="setting">Setting</SelectItem>
              <SelectItem value="role">Role</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filter.dateRange}
            onValueChange={(value) => setFilter({ ...filter, dateRange: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{format(new Date(entry.created_at), 'MMM d, yyyy HH:mm:ss')}</TableCell>
                      <TableCell>
                        <div>
                          <div>{entry.actor?.name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{entry.actor?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.action}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="secondary">{entry.target_type}</Badge>
                          <div className="text-sm text-muted-foreground mt-1">{entry.target_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedEntry(entry)}
                            >
                              View Changes
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Audit Entry Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <strong>Action:</strong> {entry.action}
                              </div>
                              <div>
                                <strong>Target:</strong> {entry.target_type} ({entry.target_id})
                              </div>
                              {entry.changes && (
                                <div>
                                  <strong>Changes:</strong>
                                  <pre className="mt-2 p-2 bg-muted rounded text-sm overflow-auto">
                                    {JSON.stringify(entry.changes, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {entry.metadata && (
                                <div>
                                  <strong>Metadata:</strong>
                                  <pre className="mt-2 p-2 bg-muted rounded text-sm overflow-auto">
                                    {JSON.stringify(entry.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 