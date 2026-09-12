/* eslint-disable descriptive-classname/require-semantic-classname */
'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Phone, Send, Video } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

interface DirectMessage {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  edited_at: string | null
  deleted_at: string | null
}

interface DirectReaction {
  id: string
  message_id: string
  reaction: string
  user_id: string
}

interface CallCapability {
  ready: boolean
  reason: string | null
}

type Props = { params: Promise<{ id: string }> }

export default function DirectMessagePage({ params }: Props) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingBody, setEditingBody] = useState('')
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [onlineUsers, setOnlineUsers] = useState(0)
  const [reactions, setReactions] = useState<Record<string, DirectReaction[]>>({})
  const [callCapability, setCallCapability] = useState<CallCapability | null>(null)
  const [callMessage, setCallMessage] = useState<string | null>(null)
  const realtimeChannel = useRef<ReturnType<
    ReturnType<typeof createBrowserClient<Database>>['channel']
  > | null>(null)

  useEffect(() => {
    const client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    void client.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))
  }, [])

  useEffect(() => {
    void fetch('/api/messages/calls/capabilities', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => setCallCapability(data as CallCapability))
      .catch(() => setCallCapability({ ready: false, reason: 'Call capability is unavailable.' }))
  }, [])

  useEffect(() => {
    let active = true
    let resolvedConversationId = ''
    void params
      .then(({ id }) => {
        if (active) {
          setConversationId(id)
          resolvedConversationId = id
        }
        return fetch(`/api/messages/direct/${id}`, { cache: 'no-store' })
      })
      .then(async (response) => {
        if (!active) return
        const data = await response.json()
        if (!response.ok) setError(data.error || 'Unable to load messages.')
        else {
          setMessages(data.messages as DirectMessage[])
          setNextCursor(data.next_cursor as string | null)
          void loadReactions(
            resolvedConversationId,
            (data.messages as DirectMessage[]).map((message) => message.id)
          )
        }
        setLoading(false)
      })
      .catch(() => {
        if (active) {
          setError('Unable to load messages.')
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [params])

  useEffect(() => {
    if (!conversationId) return
    const client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const channel = client
      .channel(`direct-conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_conversation_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const message = payload.new as DirectMessage
          setMessages((current) =>
            current.some((item) => item.id === message.id) ? current : [...current, message]
          )
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.user_id === currentUserId) return
        setTypingUsers((current) =>
          current.includes(payload?.user_id) ? current : [...current, payload?.user_id]
        )
        window.setTimeout(() => {
          setTypingUsers((current) => current.filter((userId) => userId !== payload?.user_id))
        }, 2000)
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setOnlineUsers(Object.keys(state).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && currentUserId) {
          await channel.track({ user_id: currentUserId })
        }
      })
    realtimeChannel.current = channel
    return () => {
      realtimeChannel.current = null
      void client.removeChannel(channel)
    }
  }, [conversationId, currentUserId])

  useEffect(() => {
    const newestMessage = messages.at(-1)
    if (!conversationId || !newestMessage) return
    void fetch(`/api/messages/direct/${conversationId}/read-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ last_read_message_id: newestMessage.id }),
    })
  }, [conversationId, messages])

  const loadReactions = async (conversationId: string, messageIds: string[]) => {
    if (messageIds.length === 0) return
    const nextReactions: Record<string, DirectReaction[]> = {}
    await Promise.all(
      messageIds.map(async (messageId) => {
        const response = await fetch(
          `/api/messages/direct/${conversationId}/reactions?message_id=${messageId}`,
          { cache: 'no-store' }
        )
        if (response.ok) {
          nextReactions[messageId] = (await response.json()) as DirectReaction[]
        }
      })
    )
    setReactions(nextReactions)
  }

  const toggleReaction = async (message: DirectMessage, reaction: string) => {
    if (!conversationId) return
    const existing = reactions[message.id]?.find(
      (item) => item.reaction === reaction && item.user_id === currentUserId
    )
    const url = new URL(`/api/messages/direct/${conversationId}/reactions`, window.location.origin)
    url.searchParams.set('message_id', message.id)
    url.searchParams.set('reaction', reaction)
    const response = await fetch(url.toString(), {
      method: existing ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...(existing ? {} : { body: JSON.stringify({ message_id: message.id, reaction }) }),
    })
    if (!response.ok) setError(existing ? 'Unable to remove reaction.' : 'Unable to add reaction.')
    await loadReactions(conversationId, [message.id])
  }

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault()
    if (!conversationId || !body.trim() || sending) return
    setSending(true)
    setError(null)
    const response = await fetch(`/api/messages/direct/${conversationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    const data = await response.json()
    if (!response.ok) setError(data.error || 'Unable to send message.')
    else {
      setMessages((current) =>
        current.some((item) => item.id === data.id) ? current : [...current, data as DirectMessage]
      )
      setBody('')
    }
    setSending(false)
  }

  const startCall = async (mediaType: 'audio' | 'video') => {
    if (!conversationId || !callCapability?.ready) return
    setCallMessage(null)
    const response = await fetch('/api/messages/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: conversationId, media_type: mediaType }),
    })
    const data = await response.json()
    setCallMessage(response.ok ? 'Call started.' : data.error || 'Unable to start call.')
  }

  const broadcastTyping = (value: string) => {
    setBody(value)
    if (!conversationId) return
    void realtimeChannel.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: currentUserId },
    })
  }

  const loadOlderMessages = async () => {
    if (!conversationId || !nextCursor || loadingOlder) return
    setLoadingOlder(true)
    const response = await fetch(
      `/api/messages/direct/${conversationId}?limit=50&before=${encodeURIComponent(nextCursor)}`,
      { cache: 'no-store' }
    )
    const data = await response.json()
    if (!response.ok) setError(data.error || 'Unable to load older messages.')
    else {
      setMessages((current) => [...(data.messages as DirectMessage[]), ...current])
      setNextCursor(data.next_cursor as string | null)
    }
    setLoadingOlder(false)
  }

  const editMessage = async (message: DirectMessage) => {
    if (!conversationId || !editingBody.trim()) return
    const response = await fetch(`/api/messages/direct/${conversationId}/messages/${message.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: editingBody }),
    })
    const data = await response.json()
    if (!response.ok) setError(data.error || 'Unable to edit message.')
    else {
      setMessages((current) => current.map((item) => (item.id === message.id ? data : item)))
      setEditingMessageId(null)
      setEditingBody('')
    }
  }

  const deleteMessage = async (message: DirectMessage) => {
    if (!conversationId) return
    const response = await fetch(`/api/messages/direct/${conversationId}/messages/${message.id}`, {
      method: 'DELETE',
    })
    const data = await response.json()
    if (!response.ok) setError(data.error || 'Unable to delete message.')
    else setMessages((current) => current.map((item) => (item.id === message.id ? data : item)))
  }

  return (
    <main className="direct-message-page mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col p-4 md:p-6">
      <header className="direct-message-page__header mb-4 flex items-center gap-3">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="direct-message-page__back-button"
          aria-label="Back to messages"
        >
          <Link href="/messages" className="direct-message-page__back-link">
            <ArrowLeft className="direct-message-page__back-icon h-5 w-5" />
          </Link>
        </Button>
        <div className="direct-message-page__heading">
          <h1 className="direct-message-page__title text-2xl font-bold">Private conversation</h1>
          <p className="direct-message-page__description text-sm text-muted-foreground">
            End-to-end participant access controlled by your account
          </p>
        </div>
        <div className="direct-message-page__call-actions ml-auto flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="direct-message-page__audio-call"
            onClick={() => void startCall('audio')}
            disabled={!callCapability?.ready}
            aria-label="Start audio call"
            title={
              callCapability?.ready
                ? 'Start audio call'
                : callCapability?.reason || 'Calls unavailable'
            }
          >
            <Phone className="direct-message-page__audio-call-icon h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="direct-message-page__video-call"
            onClick={() => void startCall('video')}
            disabled={!callCapability?.ready}
            aria-label="Start video call"
            title={
              callCapability?.ready
                ? 'Start video call'
                : callCapability?.reason || 'Calls unavailable'
            }
          >
            <Video className="direct-message-page__video-call-icon h-4 w-4" />
          </Button>
        </div>
      </header>

      <section className="direct-message-page__thread flex flex-1 flex-col rounded-lg border">
        <div className="direct-message-page__message-list flex-1 space-y-3 overflow-y-auto p-4">
          {nextCursor ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="direct-message-page__load-older"
              onClick={() => void loadOlderMessages()}
              disabled={loadingOlder}
            >
              {loadingOlder ? 'Loading...' : 'Load older messages'}
            </Button>
          ) : null}
          {typingUsers.length > 0 ? (
            <p className="direct-message-page__typing text-sm text-muted-foreground">
              Someone is typing...
            </p>
          ) : null}
          {loading ? (
            <p className="direct-message-page__loading text-sm text-muted-foreground">
              Loading messages...
            </p>
          ) : null}
          {!loading && messages.length === 0 ? (
            <p className="direct-message-page__empty text-sm text-muted-foreground">
              No messages yet.
            </p>
          ) : null}
          {messages.map((message) => (
            <article
              key={message.id}
              className="direct-message-page__message rounded-md bg-muted p-3"
            >
              {message.deleted_at ? (
                <p className="direct-message-page__message-body text-sm italic text-muted-foreground">
                  Message deleted
                </p>
              ) : editingMessageId === message.id ? (
                <div className="direct-message-page__edit-form flex gap-2">
                  <Input
                    value={editingBody}
                    onChange={(event) => setEditingBody(event.target.value)}
                    className="direct-message-page__edit-input"
                    aria-label="Edit message"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="direct-message-page__edit-save"
                    onClick={() => void editMessage(message)}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <p className="direct-message-page__message-body whitespace-pre-wrap break-words">
                  {message.body}
                </p>
              )}
              {!message.deleted_at &&
              message.sender_id === currentUserId &&
              editingMessageId !== message.id ? (
                <div className="direct-message-page__message-actions mt-2 flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="direct-message-page__edit-button"
                    onClick={() => {
                      setEditingMessageId(message.id)
                      setEditingBody(message.body)
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="direct-message-page__delete-button"
                    onClick={() => void deleteMessage(message)}
                  >
                    Delete
                  </Button>
                </div>
              ) : null}
              {!message.deleted_at ? (
                <div className="direct-message-page__reactions mt-2 flex gap-1">
                  {['❤️', '😂', '👍'].map((emoji) => {
                    const messageReactions = reactions[message.id] ?? []
                    const count = messageReactions.filter((item) => item.reaction === emoji).length
                    const active = messageReactions.some(
                      (item) => item.reaction === emoji && item.user_id === currentUserId
                    )
                    return (
                      <Button
                        key={emoji}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`direct-message-page__reaction-toggle ${
                          active ? 'direct-message-page__reaction-toggle--active' : ''
                        }`}
                        onClick={() => void toggleReaction(message, emoji)}
                        aria-label={`React with ${emoji}`}
                      >
                        {emoji} {count > 0 ? count : ''}
                      </Button>
                    )
                  })}
                </div>
              ) : null}
              <time className="direct-message-page__message-time mt-1 block text-xs text-muted-foreground">
                {new Date(message.created_at).toLocaleString()}
              </time>
            </article>
          ))}
        </div>
        {error ? (
          <p className="direct-message-page__error px-4 pb-2 text-sm text-destructive">{error}</p>
        ) : null}
        {callMessage ? (
          <p className="direct-message-page__call-message px-4 pb-2 text-sm text-muted-foreground">
            {callMessage}
          </p>
        ) : null}
        <form
          onSubmit={sendMessage}
          className="direct-message-page__composer flex gap-2 border-t p-4"
        >
          <span className="direct-message-page__presence text-xs text-muted-foreground">
            {onlineUsers > 1 ? 'Online' : 'Offline'}
          </span>
          <Input
            value={body}
            onChange={(event) => broadcastTyping(event.target.value)}
            placeholder="Write a message"
            maxLength={10000}
            disabled={sending || !conversationId}
            className="direct-message-page__input"
            aria-label="Message body"
          />
          <Button
            type="submit"
            size="icon"
            disabled={sending || !body.trim() || !conversationId}
            className="direct-message-page__send"
            aria-label="Send message"
          >
            <Send className="direct-message-page__send-icon h-4 w-4" />
          </Button>
        </form>
      </section>
    </main>
  )
}
