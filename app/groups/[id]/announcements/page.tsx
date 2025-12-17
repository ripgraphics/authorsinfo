"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase-client"

export default function GroupAnnouncementsPage() {
  const params = useParams()
  const groupId = params.id as string
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: "", body: "", scheduled_at: "" })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const user = { id: "mock", name: "Test User", role: "admin" }
  const { toast } = useToast()

  useEffect(() => {
    fetch(`/api/groups/${groupId}/announcements`)
      .then((res) => res.json())
      .then((data) => setAnnouncements(data))
      .finally(() => setLoading(false))
  }, [groupId, success])

  // Real-time notifications for new announcements
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`group_announcements_${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_announcements', filter: `group_id=eq.${groupId}` }, (payload: any) => {
        toast({
          title: "New Announcement",
          description: payload.new.title,
          duration: 4000,
        })
        setAnnouncements((prev) => [payload.new, ...prev])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'group_announcements', filter: `group_id=eq.${groupId}` }, (payload: any) => {
        setAnnouncements((prev) => prev.map(a => a.id === payload.new.id ? payload.new : a))
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, toast])

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const res = await fetch(`/api/groups/${groupId}/announcements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, created_by: user.id }),
    })
    if (res.ok) {
      setSuccess("Announcement posted!")
      setForm({ title: "", body: "", scheduled_at: "" })
      setShowForm(false)
    } else {
      const err = await res.json()
      setError(err.error || "Failed to post announcement")
    }
  }

  const handlePin = async (id: string, pinned: boolean) => {
    await fetch(`/api/groups/${groupId}/announcements`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pinned }),
    })
    setSuccess("Announcement updated!")
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/groups/${groupId}/announcements?id=${id}&user_id=${user.id}`, { method: "DELETE" })
    if (res.ok) {
      setAnnouncements((prev) => prev.filter(a => a.id !== id))
      setSuccess("Announcement deleted!")
    } else {
      const err = await res.json()
      setError(err.error || "Failed to delete announcement")
    }
  }

  // Sort: pinned first, then by scheduled_at or created_at
  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    const aDate = a.scheduled_at ? new Date(a.scheduled_at) : new Date(a.created_at)
    const bDate = b.scheduled_at ? new Date(b.scheduled_at) : new Date(b.created_at)
    return bDate.getTime() - aDate.getTime()
  })

  // Editing logic
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: "", body: "", scheduled_at: "" })
  const handleEdit = (a: any) => {
    setEditingId(a.id)
    setEditForm({ title: a.title, body: a.body, scheduled_at: a.scheduled_at || "" })
  }
  const handleEditChange = (e: any) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value })
  }
  const handleEditSubmit = async (e: any) => {
    e.preventDefault()
    await fetch(`/api/groups/${groupId}/announcements`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, ...editForm }),
    })
    setEditingId(null)
    setSuccess("Announcement updated!")
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Group Announcements</h2>
      <Button onClick={() => setShowForm((v) => !v)} className="mb-4">
        {showForm ? "Cancel" : "Add Announcement"}
      </Button>
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-2">
          <Input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Title"
            required
          />
          <Textarea
            name="body"
            value={form.body}
            onChange={handleChange}
            placeholder="Announcement body"
            required
            className="h-24"
          />
          <div>
            <label className="block text-sm font-medium">Schedule for</label>
            <Input
              type="datetime-local"
              name="scheduled_at"
              value={form.scheduled_at}
              onChange={handleChange}
              className="w-full"
            />
          </div>
          <Button type="submit">Post</Button>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          {success && <div className="text-green-600 text-sm mt-2">{success}</div>}
        </form>
      )}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {sorted.length === 0 ? (
            <div className="text-gray-500">No announcements yet.</div>
          ) : (
            sorted.map((a) => (
              <div key={a.id} className={`border rounded-lg p-4 bg-white shadow-xs relative ${a.pinned ? 'border-yellow-400' : ''}`}>
                {a.pinned && <span className="absolute top-2 right-2 bg-yellow-400 text-xs px-2 py-0.5 rounded-sm">Pinned</span>}
                {a.scheduled_at && new Date(a.scheduled_at) > new Date() && (
                  <span className="absolute top-2 left-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-sm">Scheduled</span>
                )}
                {editingId === a.id ? (
                  <form onSubmit={handleEditSubmit} className="space-y-2 mb-2">
                    <Input
                      name="title"
                      value={editForm.title}
                      onChange={handleEditChange}
                      placeholder="Title"
                      required
                    />
                    <Textarea
                      name="body"
                      value={editForm.body}
                      onChange={handleEditChange}
                      placeholder="Announcement body"
                      required
                      className="h-24"
                    />
                    <div>
                      <label className="block text-sm font-medium">Schedule for</label>
                      <Input
                        type="datetime-local"
                        name="scheduled_at"
                        value={editForm.scheduled_at}
                        onChange={handleEditChange}
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" type="submit">Save</Button>     
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="font-semibold text-lg mb-1">{a.title}</div>
                    <div className="text-gray-700 mb-2 whitespace-pre-line">{a.body}</div>
                    <div className="text-xs text-gray-500">{a.scheduled_at ? `Scheduled: ${a.scheduled_at.replace('T', ' ').slice(0, 16)}` : a.created_at?.slice(0, 16).replace("T", " ")}</div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant={a.pinned ? "secondary" : "outline"} onClick={() => handlePin(a.id, !a.pinned)}>
                        {a.pinned ? "Unpin" : "Pin"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(a)}>Edit</Button>
                      {(a.created_by === user.id || user.role === "admin") && (
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(a.id)}>Delete</Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
} 