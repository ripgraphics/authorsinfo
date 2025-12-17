"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function ContentComments({ groupId, contentId, user }: { groupId: string, contentId: string, user?: any }) {
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/groups/${groupId}/content-comments?content_id=${contentId}`)
      .then((res) => res.json())
      .then((data) => setComments(data))
      .finally(() => setLoading(false))
  }, [groupId, contentId, success])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const res = await fetch(`/api/groups/${groupId}/content-comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content_id: contentId, body }),
    })
    if (res.ok) {
      setSuccess("Comment posted!")
      setBody("")
    } else {
      const err = await res.json()
      setError(err.error || "Failed to post comment")
    }
  }

  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-2">Comments</h3>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-2 mb-4">
          {comments.length === 0 ? (
            <div className="text-gray-500">No comments yet.</div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border rounded-sm p-2 bg-gray-50">
                <div className="text-xs text-gray-500 mb-1">{comment.created_at?.slice(0, 16).replace("T", " ")}</div>
                <div>{comment.body}</div>
              </div>
            ))
          )}
        </div>
      )}
      {user && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <Textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write a comment..."
            required
          />
          <Button type="submit" size="sm">Post</Button>
          {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
          {success && <div className="text-green-600 text-xs mt-1">{success}</div>}
        </form>
      )}
    </div>
  )
} 