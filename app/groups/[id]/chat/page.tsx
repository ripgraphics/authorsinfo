"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase-client"
import dynamic from "next/dynamic"

const EMOJIS = ["👍", "😂", "🔥", "❤️", "😮", "🎉"];
const GroupChatThreadsPage = dynamic(() => import("./threads"), { ssr: false })
const GroupChatThreadPage = dynamic(() => import("./thread"), { ssr: false })

export default function GroupChatPage() {
  const params = useParams()
  const groupId = params.id as string
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const user = { id: "mock", name: "Test User" } // Replace with real user
  const bottomRef = useRef<HTMLDivElement>(null)
  const [typingUsers, setTypingUsers] = useState<any[]>([])
  const [reactions, setReactions] = useState<{ [msgId: string]: string[] }>({})
  const [selectedThread, setSelectedThread] = useState<any | null>(null)
  const [threadParticipants, setThreadParticipants] = useState<{ [threadId: string]: string[] }>({})
  const [threadReactions, setThreadReactions] = useState<{ [threadId: string]: string[] }>({})
  const [threads, setThreads] = useState<any[]>([])
  const channelRef = useRef<any>(null)

  useEffect(() => {
    fetch(`/api/groups/${groupId}/chat`)
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .finally(() => setLoading(false))

    // Subscribe to real-time chat messages
    const supabase = createClient()
    const channel = supabase.channel(`group_chat_${groupId}`)
    channelRef.current = channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_chat_messages', filter: `group_id=eq.${groupId}` }, (payload: any) => {
        setMessages((prev: any[]) => [...prev, payload.new])
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const typing = Object.values(state).flat().filter((u: any) => u.typing && u.user_id !== user.id)
        setTypingUsers(typing)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setTypingUsers((prev: any[]) => [...prev, ...newPresences.filter((u: any) => u.typing && u.user_id !== user.id)])
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setTypingUsers((prev: any[]) => prev.filter((u: any) => u.user_id !== key))
      })
      .subscribe(async () => {
        await channel.track({ user_id: user.id, name: user.name, typing: false })
      })
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [groupId])

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const res = await fetch(`/api/groups/${groupId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, body }),
    })
    if (res.ok) {
      setBody("")
    } else {
      const err = await res.json()
      setError(err.error || "Failed to send message")
    }
  }

  // Typing indicator logic
  const typingTimeout = useRef<any>(null)
  const handleTyping = (e: any) => {
    setBody(e.target.value)
    if (channelRef.current) {
      channelRef.current.track({ user_id: user.id, name: user.name, typing: true })
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      if (channelRef.current) {
        channelRef.current.track({ user_id: user.id, name: user.name, typing: false })
      }
    }, 2000)
  }

  // Message reactions (local only)
  const handleReaction = (msgId: string, emoji: string) => {
    setReactions((prev) => {
      const arr = prev[msgId] || []
      return { ...prev, [msgId]: arr.includes(emoji) ? arr : [...arr, emoji] }
    })
  }

  // Real-time updates for threads
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`group_chat_threads_${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_chat_threads', filter: `group_id=eq.${groupId}` }, (payload: any) => {
        setThreads((prev: any[]) => [payload.new, ...prev])
      })
      .subscribe()
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [groupId])

  // Thread participants (local, for now)
  const handleJoinThread = (thread: any) => {
    setSelectedThread(thread)
    setThreadParticipants((prev) => {
      const arr = prev[thread.id] || []
      return { ...prev, [thread.id]: arr.includes(user.id) ? arr : [...arr, user.id] }
    })
  }

  // Thread reactions (local, for now)
  const handleThreadReaction = (threadId: string, emoji: string) => {
    setThreadReactions((prev) => {
      const arr = prev[threadId] || []
      return { ...prev, [threadId]: arr.includes(emoji) ? arr : [...arr, emoji] }
    })
  }

  return (
    <div className="flex h-[80vh]">
      {/* Sidebar: Threads */}
      <div className="w-1/3 border-r bg-gray-50 overflow-y-auto">
        <GroupChatThreadsPage params={{ id: groupId }} onSelectThread={handleJoinThread} />
        {/* Show thread reactions */}
        {selectedThread && (
          <div className="p-2 border-t flex gap-1">
            {["👍", "😂", "🔥", "❤️", "😮", "🎉"].map((emoji) => (
              <button key={emoji} type="button" className="text-lg hover:scale-110" onClick={() => handleThreadReaction(selectedThread.id, emoji)}>{emoji}</button>
            ))}
            <div className="flex gap-1 ml-2">
              {(threadReactions[selectedThread.id] || []).map((emoji) => (
                <span key={emoji} className="text-lg">{emoji}</span>
              ))}
            </div>
          </div>
        )}
        {/* Show thread participants */}
        {selectedThread && (
          <div className="p-2 text-xs text-gray-500">Participants: {(threadParticipants[selectedThread.id] || []).join(", ")}</div>
        )}
      </div>
      {/* Main: Chat or Thread */}
      <div className="flex-1">
        {selectedThread ? (
          <GroupChatThreadPage params={{ id: groupId }} thread={selectedThread} />
        ) : (
          <div className="max-w-2xl mx-auto p-6 flex flex-col h-[80vh]">
            <h2 className="text-2xl font-bold mb-4">Group Chat</h2>
            <div className="flex-1 overflow-y-auto bg-gray-50 rounded p-4 mb-4">
              {loading ? (
                <div>Loading...</div>
              ) : messages.length === 0 ? (
                <div className="text-gray-500">No messages yet.</div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.user_id === user.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`rounded-lg px-4 py-2 max-w-xs ${msg.user_id === user.id ? 'bg-blue-500 text-white' : 'bg-white border'}`}>
                        <div className="text-xs font-semibold mb-1">{msg.user_id === user.id ? 'You' : msg.user_id}</div>
                        <div>{msg.body}</div>
                        <div className="flex gap-1 mt-1">
                          {EMOJIS.map((emoji) => (
                            <button key={emoji} type="button" className="text-lg hover:scale-110 transition-transform" onClick={() => handleReaction(msg.id, emoji)}>{emoji}</button>
                          ))}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {(reactions[msg.id] || []).map((emoji) => (
                            <span key={emoji} className="text-lg">{emoji}</span>
                          ))}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">{msg.created_at?.slice(0, 16).replace("T", " ")}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              )}
              {typingUsers.length > 0 && (
                <div className="text-xs text-blue-500 mt-2 animate-pulse">
                  {typingUsers.map((u) => u.name || u.user_id).join(", ")} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </div>
              )}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={body}
                onChange={handleTyping}
                placeholder="Type a message..."
                className="flex-1"
                required
              />
              <Button type="submit">Send</Button>
            </form>
            {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
            {success && <div className="text-green-600 text-xs mt-2">{success}</div>}
          </div>
        )}
      </div>
    </div>
  )
} 