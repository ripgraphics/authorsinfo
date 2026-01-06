'use client'

import Link from 'next/link'
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { UserHoverCard } from '@/components/entity-hover-cards'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ReusableSearch } from '@/components/ui/reusable-search'
import { useState, useRef } from 'react'

export default function AdminEventsBulkUI({
  events,
  creators,
  status,
  search,
  creator,
  page,
  limit,
  totalCount,
  userMap,
}: any) {
  const [selected, setSelected] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<string>('')
  const [showDialog, setShowDialog] = useState(false)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const totalPages = Math.ceil(totalCount / limit)

  function handleSelectAll(e: any) {
    if (e.target.checked) {
      setSelected(events.map((ev: any) => ev.id))
    } else {
      setSelected([])
    }
  }
  function handleSelect(id: string, checked: boolean) {
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))
  }
  function openDialog(action: string) {
    setBulkAction(action)
    setShowDialog(true)
  }
  async function handleBulkAction() {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/events/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selected,
          status: bulkAction,
          reason: note,
          reviewer_id: null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Bulk action failed')
      setMessage(data.message)
      setShowDialog(false)
      setSelected([])
      if (formRef.current) formRef.current.submit() // refresh page
    } catch (err: any) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
          Admin: Events Management
        </h1>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-sm ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
        >
          {message}
        </div>
      )}

      <form ref={formRef} method="get" className="mb-6 space-y-4">
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select name="status" defaultValue={status} className="border rounded-sm px-3 py-2">
              <option value="">All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending Approval</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <ReusableSearch
              paramName="search"
              placeholder="Search events..."
              debounceMs={300}
              basePath="/admin/events"
              preserveParams={['status', 'creator']}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Creator</label>
            <select name="creator" defaultValue={creator} className="border rounded-sm px-3 py-2">
              <option value="">All Creators</option>
              {creators.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {userMap[c.id]?.name || c.id}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit">Filter</Button>
          </div>
        </div>
      </form>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="select-all"
              className="mr-2"
              checked={selected.length === events.length && events.length > 0}
              onChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm">
              Select All ({selected.length} selected)
            </label>
            <Button
              type="button"
              size="sm"
              variant="default"
              className="ml-2"
              disabled={selected.length === 0}
              onClick={() => openDialog('published')}
            >
              Bulk Approve
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="ml-2"
              disabled={selected.length === 0}
              onClick={() => openDialog('cancelled')}
            >
              Bulk Cancel
            </Button>
          </div>
          <div className="text-sm text-gray-600">Total: {totalCount} events</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-2 text-left border">Select</th>
                <th className="px-2 py-2 text-left border">Title</th>
                <th className="px-2 py-2 text-left border">Status</th>
                <th className="px-2 py-2 text-left border">Creator</th>
                <th className="px-2 py-2 text-left border">Start Date</th>
                <th className="px-2 py-2 text-left border">Category</th>
                <th className="px-2 py-2 text-left border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event: any) => (
                <tr key={event.id} className="border-t">
                  <td className="px-2 py-2 border">
                    <input
                      type="checkbox"
                      checked={selected.includes(event.id)}
                      onChange={(e) => handleSelect(event.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-2 py-2 border font-semibold">{event.title}</td>
                  <td className="px-2 py-2 border">
                    {event.status === 'published' && (
                      <span className="inline-flex items-center text-green-700">
                        <CheckCircleIcon className="h-4 w-4 mr-1" /> Published
                      </span>
                    )}
                    {event.status === 'draft' && (
                      <span className="inline-flex items-center text-gray-700">
                        <EyeIcon className="h-4 w-4 mr-1" /> Draft
                      </span>
                    )}
                    {event.status === 'pending' && (
                      <span className="inline-flex items-center text-yellow-700">
                        <EyeIcon className="h-4 w-4 mr-1" /> Pending
                      </span>
                    )}
                    {event.status === 'cancelled' && (
                      <span className="inline-flex items-center text-red-700">
                        <XCircleIcon className="h-4 w-4 mr-1" /> Cancelled
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 border">
                    <UserHoverCard
                      user={{
                        id: event.created_by,
                        name: userMap[event.created_by]?.name || event.created_by,
                      }}
                    >
                      <span>{userMap[event.created_by]?.name || event.created_by}</span>
                    </UserHoverCard>
                  </td>
                  <td className="px-2 py-2 border">
                    {event.start_date ? new Date(event.start_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-2 py-2 border">{event.category?.name || '-'}</td>
                  <td className="px-2 py-2 border">
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`?page=${p}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}${creator ? `&creator=${creator}` : ''}`}
                className={`px-3 py-1 rounded-sm ${p === page ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm Bulk {bulkAction.charAt(0).toUpperCase() + bulkAction.slice(1)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">
              Are you sure you want to set {selected.length} event(s) to <b>{bulkAction}</b>?
            </p>
            <Textarea
              placeholder="Add a note (optional) for this action..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={loading}
              rows={2}
            />
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant={
                  bulkAction === 'published'
                    ? 'default'
                    : bulkAction === 'cancelled'
                      ? 'destructive'
                      : 'outline'
                }
                onClick={handleBulkAction}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
