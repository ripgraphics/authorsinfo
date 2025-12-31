'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function GroupEventsPage() {
  const params = useParams()
  const groupId = params.id as string
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '' })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      const res = await fetch(`/api/groups/${groupId}/events`)
      const data = await res.json()
      setEvents(data)
      setLoading(false)
    }
    fetchEvents()
  }, [groupId])

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const res = await fetch(`/api/groups/${groupId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      setError('Failed to create event')
      return
    }
    setSuccess('Event created!')
    setShowForm(false)
    setForm({ title: '', description: '', start_date: '', end_date: '' })
    // Refresh events
    const data = await res.json()
    setEvents((events) => [...events, { ...data.groupEvent, event: data.event }])
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Group Events</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <Button className="mb-4" onClick={() => setShowForm((f) => !f)}>
        {showForm ? 'Cancel' : 'Create New Event'}
      </Button>
      {showForm && (
        <form onSubmit={handleCreateEvent} className="mb-6 space-y-2 border p-4 rounded-sm">
          <Input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <Textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            required
          />
          <Input
            type="datetime-local"
            value={form.start_date}
            onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
            required
          />
          <Input
            type="datetime-local"
            value={form.end_date}
            onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
          />
          <Button type="submit">Create Event</Button>
        </form>
      )}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full border rounded-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Title</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-left">Start</th>
              <th className="p-2 text-left">End</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.event_id || ev.event?.id} className="border-t">
                <td className="p-2 font-medium">{ev.event?.title}</td>
                <td className="p-2">{ev.event?.description}</td>
                <td className="p-2">
                  {ev.event?.start_date ? new Date(ev.event.start_date).toLocaleString() : ''}
                </td>
                <td className="p-2">
                  {ev.event?.end_date ? new Date(ev.event.end_date).toLocaleString() : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
