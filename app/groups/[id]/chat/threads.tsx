'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase-client'
import { useToast } from '@/components/ui/use-toast'
// Audio files - using public paths instead of imports
const notificationSound = '/notification.mp3'
const messageSound = '/message.mp3'
const reactionSound = '/reaction.mp3'

const EMOJIS = ['👍', '😂', '🔥', '❤️', '😮', '🎉']

export default function GroupChatThreadsPage({
  params,
  onSelectThread,
}: {
  params: { id: string }
  onSelectThread?: (thread: any) => void
}) {
  const groupId = params.id
  const [threads, setThreads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', body: '' })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [participants, setParticipants] = useState<{ [threadId: string]: any[] }>({})
  const [reactions, setReactions] = useState<{ [threadId: string]: any[] }>({})
  const [notifications, setNotifications] = useState<{ [threadId: string]: any[] }>({})
  const [muted, setMuted] = useState<{ [threadId: string]: boolean }>({})
  const [snoozed, setSnoozed] = useState<{ [threadId: string]: number }>({})
  const [lastRead, setLastRead] = useState<{ [threadId: string]: number }>({})
  const user = { id: 'mock', name: 'Test User' }
  const supabase = useRef<any>(null)
  const participantsChannels = useRef<{ [threadId: string]: any }>({})
  const reactionsChannels = useRef<{ [threadId: string]: any }>({})
  const { toast } = useToast()
  const audioRef = useRef<HTMLAudioElement>(null)
  const messageAudioRef = useRef<HTMLAudioElement>(null)
  const reactionAudioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    fetch(`/api/groups/${groupId}/chat-threads`)
      .then((res) => res.json())
      .then((data) => setThreads(data))
      .finally(() => setLoading(false))
  }, [groupId, success])

  // Fetch participants, reactions, notifications, mute state for each thread
  useEffect(() => {
    threads.forEach((thread) => {
      fetch(`/api/groups/${groupId}/chat-thread-participants?thread_id=${thread.id}`)
        .then((res) => res.json())
        .then((data) => setParticipants((prev) => ({ ...prev, [thread.id]: data })))
      fetch(`/api/groups/${groupId}/chat-thread-reactions?thread_id=${thread.id}`)
        .then((res) => res.json())
        .then((data) => setReactions((prev) => ({ ...prev, [thread.id]: data })))
      fetch(`/api/groups/${groupId}/chat-thread-notifications?user_id=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          const threadNotifs = data.filter((n: any) => n.thread_id === thread.id)
          setNotifications((prev) => ({ ...prev, [thread.id]: threadNotifs }))
        })
      fetch(`/api/groups/${groupId}/chat-thread-mute?user_id=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          setMuted((prev) => ({
            ...prev,
            [thread.id]: !!data.find((m: any) => m.thread_id === thread.id),
          }))
        })
    })
  }, [threads, groupId, user.id])

  // Real-time updates for participants and reactions
  useEffect(() => {
    supabase.current = createClient()
    threads.forEach((thread) => {
      // Participants
      if (participantsChannels.current[thread.id])
        supabase.current.removeChannel(participantsChannels.current[thread.id])
      participantsChannels.current[thread.id] = supabase.current
        .channel(`thread_participants_${thread.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'group_chat_thread_participants',
            filter: `thread_id=eq.${thread.id}`,
          },
          () => {
            fetch(`/api/groups/${groupId}/chat-thread-participants?thread_id=${thread.id}`)
              .then((res) => res.json())
              .then((data) => setParticipants((prev) => ({ ...prev, [thread.id]: data })))
          }
        )
        .subscribe()
      // Reactions
      if (reactionsChannels.current[thread.id])
        supabase.current.removeChannel(reactionsChannels.current[thread.id])
      reactionsChannels.current[thread.id] = supabase.current
        .channel(`thread_reactions_${thread.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'group_chat_thread_reactions',
            filter: `thread_id=eq.${thread.id}`,
          },
          () => {
            fetch(`/api/groups/${groupId}/chat-thread-reactions?thread_id=${thread.id}`)
              .then((res) => res.json())
              .then((data) => setReactions((prev) => ({ ...prev, [thread.id]: data })))
          }
        )
        .subscribe()
    })
    return () => {
      Object.values(participantsChannels.current).forEach((ch) =>
        supabase.current.removeChannel(ch)
      )
      Object.values(reactionsChannels.current).forEach((ch) => supabase.current.removeChannel(ch))
    }
  }, [threads, groupId])

  // Fetch persistent snooze and last read from DB
  useEffect(() => {
    threads.forEach((thread) => {
      // Snooze
      fetch(`/api/groups/${groupId}/chat-thread-snooze?user_id=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          const snooze = data.find((s: any) => s.thread_id === thread.id)
          setSnoozed((prev) => ({
            ...prev,
            [thread.id]: snooze ? new Date(snooze.until).getTime() : undefined,
          }))
        })
      // Last read
      fetch(
        `/api/groups/${groupId}/chat-thread-last-read?thread_id=${thread.id}&user_id=${user.id}`
      )
        .then((res) => res.json())
        .then((data) => {
          setLastRead((prev) => ({
            ...prev,
            [thread.id]: data?.last_read ? new Date(data.last_read).getTime() : 0,
          }))
        })
    })
  }, [threads, groupId, user.id])

  // Notification popups for new notifications (unmuted, not snoozed threads only)
  useEffect(() => {
    if (!threads.length) return
    const notifIds = new Set<string>()
    Object.entries(notifications).forEach(([threadId, notifs]) => {
      const now = Date.now()
      if (!muted[threadId] && !snoozed[threadId] && notifs) {
        notifs.forEach((n: any) => {
          if (!notifIds.has(n.id)) {
            notifIds.add(n.id)
            toast({
              title: 'New Thread Notification',
              description: `Thread: ${threads.find((t) => t.id === threadId)?.title || threadId}`,
              duration: 4000,
            })
            if (audioRef.current) {
              audioRef.current.currentTime = 0
              audioRef.current.play()
            }
          }
        })
      }
    })
    // eslint-disable-next-line
  }, [notifications, muted, snoozed, threads])

  // Notification sounds for new messages and reactions
  useEffect(() => {
    threads.forEach((thread) => {
      // Listen for new messages
      const supabase = createClient()
      const msgChannel = supabase
        .channel(`thread_messages_${thread.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'group_chat_thread_messages',
            filter: `thread_id=eq.${thread.id}`,
          },
          () => {
            if (messageAudioRef.current) {
              messageAudioRef.current.currentTime = 0
              messageAudioRef.current.play()
            }
          }
        )
        .subscribe()
      // Listen for new reactions
      const reactChannel = supabase
        .channel(`thread_reactions_sound_${thread.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'group_chat_thread_reactions',
            filter: `thread_id=eq.${thread.id}`,
          },
          () => {
            if (reactionAudioRef.current) {
              reactionAudioRef.current.currentTime = 0
              reactionAudioRef.current.play()
            }
          }
        )
        .subscribe()
      return () => {
        supabase.removeChannel(msgChannel)
        supabase.removeChannel(reactChannel)
      }
    })
  }, [threads])

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const res = await fetch(`/api/groups/${groupId}/chat-threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, user_id: user.id }),
    })
    if (res.ok) {
      setSuccess('Thread created!')
      setForm({ title: '', body: '' })
      setShowForm(false)
    } else {
      const err = await res.json()
      setError(err.error || 'Failed to create thread')
    }
  }

  // Add/remove participant
  const handleAddParticipant = async (threadId: string) => {
    await fetch(`/api/groups/${groupId}/chat-thread-participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread_id: threadId, user_id: user.id }),
    })
  }
  const handleRemoveParticipant = async (threadId: string) => {
    await fetch(
      `/api/groups/${groupId}/chat-thread-participants?thread_id=${threadId}&user_id=${user.id}`,
      { method: 'DELETE' }
    )
  }

  // Add/remove reaction
  const handleAddReaction = async (threadId: string, emoji: string) => {
    await fetch(`/api/groups/${groupId}/chat-thread-reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread_id: threadId, user_id: user.id, emoji }),
    })
  }
  const handleRemoveReaction = async (threadId: string, emoji: string) => {
    await fetch(
      `/api/groups/${groupId}/chat-thread-reactions?thread_id=${threadId}&user_id=${user.id}&emoji=${encodeURIComponent(emoji)}`,
      { method: 'DELETE' }
    )
  }

  // Mute/unmute thread
  const handleToggleMute = async (threadId: string) => {
    if (muted[threadId]) {
      await fetch(
        `/api/groups/${groupId}/chat-thread-mute?thread_id=${threadId}&user_id=${user.id}`,
        { method: 'DELETE' }
      )
    } else {
      await fetch(`/api/groups/${groupId}/chat-thread-mute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: threadId, user_id: user.id }),
      })
    }
    // Refetch mute state
    const res = await fetch(`/api/groups/${groupId}/chat-thread-mute?user_id=${user.id}`)
    const muteData = await res.json()
    setMuted((prev) => ({
      ...prev,
      [threadId]: !!muteData.find((m: any) => m.thread_id === threadId),
    }))
  }

  // Snooze logic (persisted)
  const handleSnooze = async (threadId: string) => {
    const until = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    await fetch(`/api/groups/${groupId}/chat-thread-snooze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread_id: threadId, user_id: user.id, until }),
    })
    setSnoozed((prev) => ({ ...prev, [threadId]: new Date(until).getTime() }))
    setTimeout(
      async () => {
        await fetch(
          `/api/groups/${groupId}/chat-thread-snooze?thread_id=${threadId}&user_id=${user.id}`,
          { method: 'DELETE' }
        )
        setSnoozed((prev) => {
          const copy = { ...prev }
          delete copy[threadId]
          return copy
        })
      },
      60 * 60 * 1000
    )
  }

  // Unsnooze logic
  const handleUnsnooze = async (threadId: string) => {
    await fetch(
      `/api/groups/${groupId}/chat-thread-snooze?thread_id=${threadId}&user_id=${user.id}`,
      { method: 'DELETE' }
    )
    setSnoozed((prev) => {
      const copy = { ...prev }
      delete copy[threadId]
      return copy
    })
  }

  // Last read logic (persisted)
  const handleOpenThread = async (thread: any) => {
    if (onSelectThread) onSelectThread(thread)
    const now = new Date().toISOString()
    setLastRead((prev) => ({ ...prev, [thread.id]: new Date(now).getTime() }))
    await fetch(`/api/groups/${groupId}/chat-thread-last-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread_id: thread.id, user_id: user.id, last_read: now }),
    })
    if (notifications[thread.id] && notifications[thread.id].length > 0) {
      for (const notif of notifications[thread.id]) {
        await fetch(`/api/groups/${groupId}/chat-thread-notifications?id=${notif.id}`, {
          method: 'DELETE',
        })
      }
      // Refetch notifications
      fetch(`/api/groups/${groupId}/chat-thread-notifications?user_id=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          const threadNotifs = data.filter((n: any) => n.thread_id === thread.id)
          setNotifications((prev) => ({ ...prev, [thread.id]: threadNotifs }))
        })
    }
  }

  // Advanced unread logic: only count notifications newer than lastRead
  const getUnreadCount = (threadId: string) => {
    const last = lastRead[threadId] || 0
    return (notifications[threadId] || []).filter(
      (n: any) => new Date(n.created_at).getTime() > last
    ).length
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <audio ref={audioRef} src={notificationSound} preload="auto" />
      <audio ref={messageAudioRef} src={messageSound} preload="auto" />
      <audio ref={reactionAudioRef} src={reactionSound} preload="auto" />
      <h2 className="text-2xl font-bold mb-4">Chat Threads</h2>
      <Button onClick={() => setShowForm((v) => !v)} className="mb-4">
        {showForm ? 'Cancel' : 'New Thread'}
      </Button>
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-2">
          <Input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Thread title"
            required
          />
          <Input
            name="body"
            value={form.body}
            onChange={handleChange}
            placeholder="Initial message"
            required
          />
          <Button type="submit">Create</Button>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          {success && <div className="text-green-600 text-sm mt-2">{success}</div>}
        </form>
      )}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {threads.length === 0 ? (
            <div className="text-gray-500">No threads yet.</div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.id}
                className="border rounded-sm p-3 bg-white hover:bg-gray-50 cursor-pointer relative"
              >
                {/* Notification badge (unread count) */}
                {!muted[thread.id] && !snoozed[thread.id] && getUnreadCount(thread.id) > 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {getUnreadCount(thread.id)}
                  </span>
                )}
                <div className="font-semibold text-lg" onClick={() => handleOpenThread(thread)}>
                  {thread.title}
                </div>
                <div className="text-xs text-gray-500">
                  {thread.created_at?.slice(0, 16).replace('T', ' ')}
                </div>
                <div className="text-sm text-gray-700 mt-1">{thread.body}</div>
                <div className="flex gap-2 mt-2 items-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddParticipant(thread.id)}
                  >
                    Join
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveParticipant(thread.id)}
                  >
                    Leave
                  </Button>
                  <span className="text-xs text-gray-500">
                    Participants: {(participants[thread.id] || []).map((p) => p.user_id).join(', ')}
                  </span>
                  {/* Mute toggle */}
                  <Button
                    size="sm"
                    variant={muted[thread.id] ? 'secondary' : 'outline'}
                    onClick={() => handleToggleMute(thread.id)}
                  >
                    {muted[thread.id] ? 'Unmute' : 'Mute'}
                  </Button>
                  {/* Snooze button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      snoozed[thread.id] ? handleUnsnooze(thread.id) : handleSnooze(thread.id)
                    }
                  >
                    {snoozed[thread.id] ? 'Snoozed' : 'Snooze'}
                  </Button>
                </div>
                <div className="flex gap-1 mt-2 items-center">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="text-lg hover:scale-110"
                      onClick={() => handleAddReaction(thread.id, emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                  {(reactions[thread.id] || []).map((r) => (
                    <span
                      key={r.emoji + r.user_id}
                      className="text-lg cursor-pointer"
                      onClick={() => handleRemoveReaction(thread.id, r.emoji)}
                    >
                      {r.emoji}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
