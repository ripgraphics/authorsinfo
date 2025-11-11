"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function GroupResourcesPage() {
  const params = useParams()
  const groupId = params.id as string
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: "link", title: "", url: "", description: "" })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/groups/${groupId}/resources`)
      .then((res) => res.json())
      .then((data) => setResources(data))
      .finally(() => setLoading(false))
  }, [groupId, success])

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const res = await fetch(`/api/groups/${groupId}/resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setSuccess("Resource added!")
      setForm({ type: "link", title: "", url: "", description: "" })
      setShowForm(false)
    } else {
      const err = await res.json()
      setError(err.error || "Failed to add resource")
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Group Resources</h2>
      <Button onClick={() => setShowForm((v) => !v)} className="mb-4">
        {showForm ? "Cancel" : "Add Resource"}
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
              <option value="link">Link</option>
              <option value="file">File</option>
              <option value="document">Document</option>
            </select>
          </div>
          <Input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Title"
            required
          />
          <Input
            name="url"
            value={form.url}
            onChange={handleChange}
            placeholder="URL or file/document path"
            required
          />
          <Input
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description (optional)"
          />
          <Button type="submit">Add</Button>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          {success && <div className="text-green-600 text-sm mt-2">{success}</div>}
        </form>
      )}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {resources.length === 0 ? (
            <div className="text-gray-500">No resources yet.</div>
          ) : (
            <table className="w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Title</th>
                  <th className="p-2 text-left">URL</th>
                  <th className="p-2 text-left">Description</th>
                  <th className="p-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-2">{item.type}</td>
                    <td className="p-2 font-semibold">{item.title}</td>
                    <td className="p-2"><a href={item.url} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{item.url}</a></td>
                    <td className="p-2">{item.description}</td>
                    <td className="p-2">{item.created_at?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
} 