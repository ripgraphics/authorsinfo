"use client"

import React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface GroupContentPageProps {
  params: { id: string }
}

export default function GroupContentPageClient({ params }: GroupContentPageProps) {
  const groupId = params.id
  const [content, setContent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: "post", title: "", body: "" })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/groups/${groupId}/content`)
      .then((res) => res.json())
      .then((data) => setContent(data))
      .finally(() => setLoading(false))
  }, [groupId, success])

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const res = await fetch(`/api/groups/${groupId}/content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setSuccess("Content created!")
      setForm({ type: "post", title: "", body: "" })
      setShowForm(false)
    } else {
      const err = await res.json()
      setError(err.error || "Failed to create content")
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Group Content & Collaboration</h2>
      <Button onClick={() => setShowForm((v) => !v)} className="mb-4">
        {showForm ? "Cancel" : "Add Content"}
      </Button>
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-2">
          <div>
            <label className="block text-sm font-medium">Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="border rounded px-2 py-1 w-full"
            >
              <option value="post">Post</option>
              <option value="document">Document</option>
              <option value="file">File</option>
            </select>
          </div>
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
            placeholder="Body or description"
            required
          />
          <Button type="submit">Create</Button>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          {success && <div className="text-green-600 text-sm mt-2">{success}</div>}
        </form>
      )}
      <div className="space-y-4">
        {content.length === 0 ? (
          <div className="text-gray-500">No content yet.</div>
        ) : (
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Title</th>
                <th className="p-2 text-left">Body</th>
                <th className="p-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {content.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-2">{item.type}</td>
                  <td className="p-2 font-semibold">{item.title}</td>
                  <td className="p-2 max-w-xs truncate">{item.body}</td>
                  <td className="p-2">{item.created_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
