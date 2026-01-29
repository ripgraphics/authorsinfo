'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ReusableModal } from '@/components/ui/reusable-modal'
import { supabaseClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface ContentModerationProps {
  groupId: string
}

interface ModerationItem {
  id: string
  content_type: string
  content_id: string
  reported_by: string
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'flagged'
  created_at: string
  metadata?: {
    content_preview?: string
    reporter_name?: string
    ai_analysis?: {
      toxicity_score?: number
      spam_score?: number
      sentiment?: string
      flagged_keywords?: string[]
    }
  }
}

export function ContentModeration({ groupId }: ContentModerationProps) {
  const [items, setItems] = useState<ModerationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'flagged'>('all')

  const fetchModerationItems = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabaseClient
        .from('group_moderation_queue')
        .select('id, group_id, content_type, content_id, status, flagged_by, created_at, reason, priority')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error

      setItems(data)
    } catch (error) {
      console.error('Error fetching moderation items:', error)
    } finally {
      setLoading(false)
    }
  }, [groupId, filter])

  useEffect(() => {
    fetchModerationItems()
  }, [fetchModerationItems])

  const handleModerate = async (itemId: string, decision: 'approve' | 'reject' | 'flag') => {
    try {
      const { error } = await (supabaseClient.from('group_moderation_queue') as any)
        .update({
          status: decision,
          handled_at: new Date().toISOString(),
          handled_by: (await supabaseClient.auth.getUser()).data.user?.id,
        })
        .eq('id', itemId)

      if (error) throw error

      await fetchModerationItems()
    } catch (error) {
      console.error('Error moderating item:', error)
    }
  }

  const columns = [
    {
      header: 'Type',
      accessorKey: 'content_type',
      cell: ({ row }: { row: any }) => <Badge variant="outline">{row.original.content_type}</Badge>,
    },
    {
      header: 'Reported',
      accessorKey: 'created_at',
      cell: ({ row }: { row: any }) =>
        format(new Date(row.original.created_at), 'MMM d, yyyy HH:mm'),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }: { row: any }) => (
        <Badge
          variant={
            row.original.status === 'pending'
              ? 'default'
              : row.original.status === 'approved'
                ? 'secondary'
                : row.original.status === 'rejected'
                  ? 'destructive'
                  : 'outline'
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: 'AI Risk Score',
      cell: ({ row }: { row: any }) => {
        const toxicity = row.original.metadata?.ai_analysis?.toxicity_score || 0
        return (
          <Badge
            variant={toxicity > 0.8 ? 'destructive' : toxicity > 0.5 ? 'outline' : 'secondary'}
          >
            {(toxicity * 100).toFixed(0)}%
          </Badge>
        )
      },
    },
    {
      header: 'Actions',
      cell: ({ row }: { row: any }) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSelectedItem(row.original)}>
            Review
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Content Moderation</h2>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={filter === 'flagged' ? 'default' : 'outline'}
            onClick={() => setFilter('flagged')}
          >
            Flagged
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Moderation Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>AI Risk Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="outline">{item.content_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.created_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === 'pending'
                              ? 'default'
                              : item.status === 'approved'
                                ? 'secondary'
                                : item.status === 'rejected'
                                  ? 'destructive'
                                  : 'outline'
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const toxicity = item.metadata?.ai_analysis?.toxicity_score || 0
                          return (
                            <Badge
                              variant={
                                toxicity > 0.8
                                  ? 'destructive'
                                  : toxicity > 0.5
                                    ? 'outline'
                                    : 'secondary'
                              }
                            >
                              {(toxicity * 100).toFixed(0)}%
                            </Badge>
                          )
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedItem(item)}
                          >
                            Review
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ReusableModal
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
        title="Content Review"
        contentClassName="max-w-2xl"
        footer={
          selectedItem ? (
            <div className="flex justify-end gap-2 w-full">
              <Button
                variant="destructive"
                onClick={() => handleModerate(selectedItem.id, 'reject')}
              >
                Reject
              </Button>
              <Button variant="outline" onClick={() => handleModerate(selectedItem.id, 'flag')}>
                Flag for Review
              </Button>
              <Button
                variant="default"
                onClick={() => handleModerate(selectedItem.id, 'approve')}
              >
                Approve
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedItem && (
          <div className="space-y-4">
            <div>
              <strong>Type:</strong> {selectedItem.content_type}
            </div>
            <div>
              <strong>Content:</strong>
              <p className="mt-1 p-2 bg-muted rounded-sm">
                {selectedItem.metadata?.content_preview || 'No preview available'}
              </p>
            </div>
            {selectedItem.metadata?.ai_analysis && (
              <div>
                <h5 className="font-semibold mb-2">AI Analysis</h5>
                <div className="space-y-2">
                  <div>
                    <strong>Toxicity Score:</strong>{' '}
                    {(
                      (selectedItem.metadata.ai_analysis.toxicity_score ?? 0) * 100
                    ).toFixed(0)}
                    %
                  </div>
                  {selectedItem.metadata.ai_analysis.flagged_keywords && (
                    <div>
                      <h5 className="font-semibold mb-2">Flagged Keywords</h5>
                      <div className="flex gap-2 flex-wrap">
                        {selectedItem.metadata.ai_analysis.flagged_keywords.map(
                          (keyword: string, i: number) => (
                            <Badge key={i} variant="outline">
                              {keyword}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </ReusableModal>
    </div>
  )
}
