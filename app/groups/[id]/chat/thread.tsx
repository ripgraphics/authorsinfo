'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function GroupChatThreadPage({
  params,
  thread,
}: {
  params: { id: string }
  thread: any
}) {
  const groupId = params.id
  const threadId = thread.id
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const user = { id: 'mock', name: 'Test User' }
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/groups/${groupId}/chat-thread-messages?thread_id=${threadId}`)
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .finally(() => setLoading(false))
  }, [groupId, threadId, success])

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const res = await fetch(`/api/groups/${groupId}/chat-thread-messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread_id: threadId, user_id: user.id, body }),
    })
    if (res.ok) {
      setSuccess('Message sent!')
      setBody('')
    } else {
      const err = await res.json()
      setError(err.error || 'Failed to send message')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col h-[70vh]">
      <h3 className="text-xl font-bold mb-2">Thread: {thread.title}</h3>
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-sm p-4 mb-4">
        {loading ? (
          <div>Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-gray-500">No messages yet.</div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.user_id === user.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-xs ${msg.user_id === user.id ? 'bg-blue-500 text-white' : 'bg-white border'}`}
                >
                  <div className="text-xs font-semibold mb-1">
                    {msg.user_id === user.id ? 'You' : msg.user_id}
                  </div>
                  <div>{msg.body}</div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {msg.created_at?.slice(0, 16).replace('T', ' ')}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
          required
        />
        <Button type="submit">Send</Button>
      </form>
      {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
      {success && <div className="text-green-600 text-xs mt-2">{success}</div>}
    </div>
  )
}
