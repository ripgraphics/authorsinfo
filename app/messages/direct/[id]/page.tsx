/* eslint-disable descriptive-classname/require-semantic-classname */
'use client'

import { useEffect, useRef, useState } from 'react'
import { Phone, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChatComposer } from '@/components/chat-composer'
import { TypingIndicator } from '@/components/typing-indicator'
import { useTypingIndicator } from '@/hooks/use-typing-indicator'
import { supabaseClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

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

const formatMessageTime = (value: string) =>
  new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

const formatMessageDate = (value: string) =>
  new Date(value).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })

export default function DirectMessagePage({ params }: Props) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingBody, setEditingBody] = useState('')
  const [onlineUsers, setOnlineUsers] = useState(0)
  const [reactions, setReactions] = useState<Record<string, DirectReaction[]>>({})
  const [callCapability, setCallCapability] = useState<CallCapability | null>(null)
  const [callMessage, setCallMessage] = useState<string | null>(null)
  const realtimeChannel = useRef<RealtimeChannel | null>(null)
  const messageEndRef = useRef<HTMLDivElement>(null)
  const messageListRef = useRef<HTMLDivElement>(null)
  // Kept in a ref so the realtime subscription effect never has to re-run
  // (and tear down the websocket) when the current user resolves.
  const currentUserIdRef = useRef<string | null>(null)

  // Typing indicator hook
  const { typingUserNames, broadcastTyping: broadcastTypingEvent } = useTypingIndicator({
    conversationId,
    currentUserId,
  })

  useEffect(() => {
    if (!loading && messages.length > 0) {
      const messageList = messageListRef.current
      if (!messageList) return
      const distanceFromBottom =
        messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight
      if (distanceFromBottom < 160) {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }
    }
  }, [loading, messages.length])

  useEffect(() => {
    void supabaseClient.auth.getUser().then(({ data }) => {
      currentUserIdRef.current = data.user?.id ?? null
      setCurrentUserId(data.user?.id ?? null)
    })
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
    const client = supabaseClient
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
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setOnlineUsers(Object.keys(state).length)
      })
      .subscribe(async (status) => {
        const userId = currentUserIdRef.current
        if (status === 'SUBSCRIBED' && userId) {
          await channel.track({ user_id: userId })
        }
      })
    realtimeChannel.current = channel
    return () => {
      realtimeChannel.current = null
      void client.removeChannel(channel)
    }
  }, [conversationId])

  useEffect(() => {
    const newestMessage = messages.at(-1)
    if (!conversationId || !newestMessage) return
    // Skip optimistic rows: their IDs are not UUIDs, so the read-state API
    // (which validates a UUID) rejects them with a 400. The effect re-runs
    // once the server row replaces the optimistic entry.
    if (newestMessage.id.startsWith('optimistic-')) return
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

  const sendMessage = async (body: string): Promise<boolean> => {
    if (!conversationId || !body.trim() || sending) return false
    setSending(true)
    setError(null)
    const trimmedBody = body.trim()
    // Optimistic update: show the message immediately, replace with the
    // server response (or remove on failure) without waiting on realtime.
    const optimisticId = `optimistic-${Date.now()}`
    const optimisticMessage: DirectMessage = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: currentUserId ?? '',
      body: trimmedBody,
      created_at: new Date().toISOString(),
      edited_at: null,
      deleted_at: null,
    }
    setMessages((current) => [...current, optimisticMessage])
    try {
      const response = await fetch(`/api/messages/direct/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmedBody }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to send message.')
      setMessages((current) =>
        current.map((message) => (message.id === optimisticId ? (data as DirectMessage) : message))
      )
      return true
    } catch {
      setMessages((current) => current.filter((message) => message.id !== optimisticId))
      setError('Unable to send message.')
      return false
    } finally {
      setSending(false)
    }
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
      <header className="direct-message-page__header mb-4 flex items-center gap-3 bg-blue-500 p-3 rounded-t-lg">
        <div className="direct-message-page__heading">
          <h1 className="direct-message-page__title text-xl font-bold text-white">Chat</h1>
        </div>
        <div className="direct-message-page__call-actions ml-auto flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="direct-message-page__audio-call"
            onClick={() => void startCall('audio')}
            disabled={!callCapability?.ready}
            aria-label="Audio call"
            title={
              callCapability?.ready ? 'Audio call' : callCapability?.reason || 'Calls unavailable'
            }
          >
            <Phone className="direct-message-page__audio-call-icon h-4 w-4 text-white" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="direct-message-page__video-call"
            onClick={() => void startCall('video')}
            disabled={!callCapability?.ready}
            aria-label="Video call"
            title={
              callCapability?.ready ? 'Video call' : callCapability?.reason || 'Calls unavailable'
            }
          >
            <Video className="direct-message-page__video-call-icon h-4 w-4 text-white" />
          </Button>
        </div>
      </header>

      <section className="direct-message-page__thread relative flex h-[calc(100vh-10rem)] max-h-[calc(100vh-10rem)] min-h-0 flex-1 flex-col rounded-lg border">
        <div
          ref={messageListRef}
          className="direct-message-page__message-list min-h-0 flex-1 space-y-3 overflow-y-auto p-4 pb-5"
        >
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
          {messages.map((message) => {
            const isCurrentUser = message.sender_id === currentUserId
            const messageIndex = messages.findIndex((item) => item.id === message.id)
            const previousMessage = messages[messageIndex - 1]
            const showDate =
              messageIndex === 0 ||
              new Date(previousMessage.created_at).toDateString() !==
                new Date(message.created_at).toDateString()

            return (
              <div key={message.id} className="direct-message-page__message">
                {showDate && (
                  <div className="direct-message-page__message-date mx-auto mb-2 w-fit rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {formatMessageDate(message.created_at)}
                  </div>
                )}
                <div
                  className={`direct-message-page__message-content flex ${isCurrentUser ? 'justify-end' : 'justify-start'} gap-2`}
                >
                  <div
                    className={`direct-message-page__message-bubble max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      message.deleted_at
                        ? 'direct-message-page__message-bubble--deleted bg-muted italic text-muted-foreground'
                        : isCurrentUser
                          ? 'direct-message-page__message-bubble--sent bg-blue-500 text-white'
                          : 'direct-message-page__message-bubble--received bg-gray-200 text-gray-800'
                    }`}
                  >
                    {message.deleted_at ? (
                      <em>Message deleted</em>
                    ) : editingMessageId === message.id ? (
                      <div className="direct-message-page__edit-form flex gap-2">
                        <Input
                          value={editingBody}
                          onChange={(event) => setEditingBody(event.target.value)}
                          className="direct-message-page__edit-input h-8 flex-1 rounded-full bg-white text-gray-800"
                          aria-label="Edit message"
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="direct-message-page__edit-save rounded-full"
                          onClick={() => void editMessage(message)}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      message.body
                    )}
                  </div>
                </div>
                <div
                  className={`direct-message-page__message-time text-[10px] ${isCurrentUser ? 'text-right' : 'text-left'} text-gray-500`}
                >
                  {formatMessageTime(message.created_at)}
                </div>
                {!message.deleted_at ? (
                  <div
                    className={`direct-message-page__message-actions flex gap-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="direct-message-page__edit-button h-6 rounded-full px-2 text-xs"
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
                      className="direct-message-page__delete-button h-6 rounded-full px-2 text-xs"
                      onClick={() => void deleteMessage(message)}
                    >
                      Delete
                    </Button>
                  </div>
                ) : null}
                {!message.deleted_at ? (
                  <div
                    className={`direct-message-page__reactions flex gap-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {['❤️', '😂', '👍'].map((emoji) => {
                      const messageReactions = reactions[message.id] ?? []
                      const count = messageReactions.filter(
                        (item) => item.reaction === emoji
                      ).length
                      const active = messageReactions.some(
                        (item) => item.reaction === emoji && item.user_id === currentUserId
                      )
                      return (
                        <Button
                          key={emoji}
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={`direct-message-page__reaction-toggle h-6 rounded-full px-2 text-xs ${
                            active ? 'direct-message-page__reaction-toggle--active bg-blue-100' : ''
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
              </div>
            )
          })}
          <div
            ref={messageEndRef}
            className="direct-message-page__message-end"
            aria-hidden="true"
          />
        </div>
        <div className="direct-message-page__typing-overlay pointer-events-none absolute bottom-[5.5rem] left-4 right-4 z-10">
          <TypingIndicator
            typingUserNames={typingUserNames}
            className="direct-message-page__typing rounded-md bg-background/95 px-2 py-1 shadow-sm"
          />
        </div>
        {error ? (
          <p className="direct-message-page__error px-4 pb-2 text-sm text-destructive">{error}</p>
        ) : null}
        {callMessage ? (
          <p className="direct-message-page__call-message px-4 pb-2 text-sm text-muted-foreground">
            {callMessage}
          </p>
        ) : null}
        <div className="direct-message-page__composer-wrapper border-t p-4">
          <span className="direct-message-page__presence text-xs text-muted-foreground">
            {onlineUsers > 1 ? 'Online' : 'Offline'}
          </span>
          <ChatComposer
            conversationId={conversationId}
            onSend={sendMessage}
            onTyping={broadcastTypingEvent}
            placeholder="Write a message"
            ariaLabel="Message body"
            disabled={sending || !conversationId}
            className="direct-message-page__composer"
            textareaClassName="direct-message-page__input"
            sendButtonClassName="direct-message-page__send"
            sendButtonLabel="Send message"
          />
        </div>
      </section>
    </main>
  )
}
