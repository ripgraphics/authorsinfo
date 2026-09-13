/* eslint-disable descriptive-classname/require-semantic-classname */
'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { MessageCircle, Minus, Send, Phone, Video } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CloseButton } from '@/components/ui/close-button'
import { EntityHoverCard } from '@/components/entity-hover-cards'

interface Conversation {
  id: string
  participant_id: string
}

interface UnreadConversation extends Conversation {
  unread_count: number
}

interface Friend {
  id: string
  name: string | null
  email: string | null
  avatar_url?: string | null
}

interface Message {
  id: string
  sender_id: string
  body: string
  created_at: string
  deleted_at: string | null
}

export interface FloatingChatProps {
  openEventName?: string
}

export function FloatingChat({
  openEventName = 'authorsinfo:open-floating-chat',
}: FloatingChatProps) {
  const formatMessageTime = (value: string) =>
    new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const formatMessageDate = (value: string) =>
    new Date(value).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? null
  const [open, setOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [unreadConversations, setUnreadConversations] = useState<UnreadConversation[]>([])
  const [recipientReadMessageId, setRecipientReadMessageId] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createBrowserClient<Database>>['channel']
  > | null>(null)
  const messageEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && activeConversationId && messages.length > 0) {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [open, activeConversationId, messages.length])

  useEffect(() => {
    const storedOpen = window.sessionStorage.getItem('authorsinfo:floating-chat:open')
    const storedConversation = window.sessionStorage.getItem(
      'authorsinfo:floating-chat:conversation'
    )
    if (storedOpen === 'true') setOpen(true)
    if (storedConversation) setActiveConversationId(storedConversation)
  }, [])

  useEffect(() => {
    window.sessionStorage.setItem('authorsinfo:floating-chat:open', String(open))
    if (activeConversationId) {
      window.sessionStorage.setItem('authorsinfo:floating-chat:conversation', activeConversationId)
    } else {
      window.sessionStorage.removeItem('authorsinfo:floating-chat:conversation')
    }
  }, [open, activeConversationId])

  useEffect(() => {
    if (!user) return
    void Promise.all([
      fetch('/api/messages/direct', { cache: 'no-store' }).then((response) =>
        response.ok ? response.json() : []
      ),
      fetch('/api/friends/list?limit=100', { cache: 'no-store' }).then((response) =>
        response.ok ? response.json() : { friends: [] }
      ),
    ]).then(([conversationData, friendData]) => {
      setConversations(conversationData as Conversation[])
      setFriends(
        ((friendData.friends ?? []) as { friend: Friend }[])
          .map((row) => row.friend)
          .filter((friend) => Boolean(friend?.id))
      )
    })
  }, [user])

  useEffect(() => {
    if (!user || open) return
    const refreshUnread = async () => {
      const conversations = (await fetch('/api/messages/direct', { cache: 'no-store' }).then(
        (response) => (response.ok ? response.json() : [])
      )) as Conversation[]
      const unread = await Promise.all(
        conversations.map(async (conversation) => {
          const messages = await fetch(`/api/messages/direct/${conversation.id}?limit=50`, {
            cache: 'no-store',
          }).then((response) => (response.ok ? response.json() : { messages: [] }))
          const readStates = (await fetch(`/api/messages/direct/${conversation.id}/read-state`, {
            cache: 'no-store',
          }).then((response) => (response.ok ? response.json() : []))) as {
            user_id: string
            last_read_message_id: string | null
          }[]
          const participantState = readStates.find((state) => state.user_id !== userId)
          const lastReadIndex = participantState?.last_read_message_id
            ? (messages.messages as Message[]).findIndex(
                (message) => message.id === participantState.last_read_message_id
              )
            : -1
          const count = Math.max(
            0,
            (messages.messages as Message[]).filter(
              (message, index) => message.sender_id !== userId && index > lastReadIndex
            ).length
          )
          return count > 0 ? { ...conversation, unread_count: count } : null
        })
      )
      setUnreadConversations(
        unread.filter((conversation): conversation is UnreadConversation => Boolean(conversation))
      )
    }
    void refreshUnread()
    const interval = window.setInterval(() => void refreshUnread(), 3000)
    return () => window.clearInterval(interval)
  }, [user, userId, open])

  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener(openEventName, handleOpen)
    return () => window.removeEventListener(openEventName, handleOpen)
  }, [openEventName])

  useEffect(() => {
    if (!activeConversationId) return
    setLoadingMessages(true)
    void fetch(`/api/messages/direct/${activeConversationId}?limit=50`, { cache: 'no-store' })
      .then((response) => response.json())
      .then(async (data) => {
        setMessages((data.messages ?? []) as Message[])
        const readStates = (await fetch(`/api/messages/direct/${activeConversationId}/read-state`, {
          cache: 'no-store',
        }).then((response) => (response.ok ? response.json() : []))) as {
          user_id: string
          last_read_message_id: string | null
        }[]
        setRecipientReadMessageId(
          readStates.find((state) => state.user_id !== userId)?.last_read_message_id ?? null
        )
        const latestMessage = (data.messages as Message[]).at(-1)
        if (latestMessage) {
          await fetch(`/api/messages/direct/${activeConversationId}/read-state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ last_read_message_id: latestMessage.id }),
          })
          setUnreadConversations((current) =>
            current.filter((conversation) => conversation.id !== activeConversationId)
          )
        }
      })
      .finally(() => setLoadingMessages(false))

    const client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const channel = client
      .channel(`floating-direct-${activeConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_conversation_messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          const message = payload.new as Message
          setMessages((current) =>
            current.some((item) => item.id === message.id) ? current : [...current, message]
          )
          if (message.sender_id !== userId) {
            if (open) {
              void fetch(`/api/messages/direct/${activeConversationId}/read-state`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ last_read_message_id: message.id }),
              })
            } else {
              setUnreadConversations((current) => {
                const existing = current.find(
                  (conversation) => conversation.id === activeConversationId
                )
                if (existing) {
                  return current.map((conversation) =>
                    conversation.id === activeConversationId
                      ? { ...conversation, unread_count: conversation.unread_count + 1 }
                      : conversation
                  )
                }
                return current
              })
            }
          }
        }
      )
      .subscribe()
    channelRef.current = channel
    return () => {
      channelRef.current = null
      void client.removeChannel(channel)
    }
  }, [activeConversationId, userId, open])

  const openConversation = async (friendId: string) => {
    const response = await fetch('/api/messages/direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: friendId }),
    })
    if (!response.ok) return
    const conversation = await response.json()
    setConversations((current) =>
      current.some((item) => item.id === conversation.id)
        ? current
        : [...current, { id: conversation.id, participant_id: friendId }]
    )
    setActiveConversationId(conversation.id)
  }

  const send = async (event: FormEvent) => {
    event.preventDefault()
    if (!activeConversationId || !draft.trim()) return
    const response = await fetch(`/api/messages/direct/${activeConversationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: draft }),
    })
    if (response.ok) setDraft('')
  }

  if (authLoading || !user) return null

  const friendById = new Map(friends.map((friend) => [friend.id, friend]))
  const activeFriend = conversations.find(
    (conversation) => conversation.id === activeConversationId
  )
    ? friendById.get(
        conversations.find((conversation) => conversation.id === activeConversationId)
          ?.participant_id ?? ''
      )
    : null

  return (
    <div className="floating-chat fixed bottom-5 right-5 z-50 flex items-end gap-3">
      {open ? (
        <section className="floating-chat__panel flex h-[min(32rem,calc(100vh-6rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border bg-background shadow-2xl">
          <header className="floating-chat__header flex items-center gap-3 border-b bg-primary px-4 py-3 text-primary-foreground">
            {activeFriend ? (
              <EntityHoverCard
                type="user"
                entity={{
                  id: activeFriend.id,
                  name: activeFriend.name || activeFriend.email || 'Friend',
                  avatar_url: activeFriend.avatar_url || undefined,
                }}
                showActions={false}
              >
                <Avatar
                  src={activeFriend.avatar_url ?? undefined}
                  name={activeFriend.name ?? ''}
                  alt={activeFriend.name ?? 'Friend'}
                  size="xs"
                  className="floating-chat__participant-avatar cursor-pointer ring-2 ring-primary-foreground/40"
                />
              </EntityHoverCard>
            ) : (
              <MessageCircle className="floating-chat__header-icon h-5 w-5" />
            )}
            <span className="floating-chat__title min-w-0 flex-1 truncate font-semibold">
              {activeFriend?.name || 'Chat'}
            </span>
            <div className="floating-chat__chat-icons flex shrink-0 items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="floating-chat__call h-7 w-7 rounded-full p-0 text-inherit hover:bg-primary-foreground/20"
                aria-label="Audio call"
                title="Audio call"
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="floating-chat__video h-7 w-7 rounded-full p-0 text-inherit hover:bg-primary-foreground/20"
                aria-label="Video call"
                title="Video call"
              >
                <Video className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="floating-chat__minimize h-7 w-7 rounded-full p-0 text-inherit hover:bg-primary-foreground/20"
                onClick={() => setOpen(false)}
                aria-label="Minimize chat"
                title="Minimize chat"
              >
                <Minus className="floating-chat__minimize-icon h-4 w-4" />
              </Button>
              <CloseButton
                onClick={() => {
                  setOpen(false)
                  setActiveConversationId(null)
                }}
                size="sm"
                variant="ghost"
                positioned={false}
                className="floating-chat__dismiss h-7 w-7 rounded-full p-0 text-inherit hover:bg-primary-foreground/20"
              />
            </div>
          </header>
          {activeConversationId ? (
            <>
              <div className="floating-chat__messages flex-1 space-y-2 overflow-y-auto p-3">
                {loadingMessages ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : null}
                {messages.map((message, index) => {
                  const previousMessage = messages[index - 1]
                  const showDate =
                    !previousMessage ||
                    new Date(previousMessage.created_at).toDateString() !==
                      new Date(message.created_at).toDateString()
                  return (
                    <div key={message.id} className="floating-chat__message-group">
                      {showDate ? (
                        <div className="floating-chat__date-separator my-3 text-center text-[11px] text-muted-foreground">
                          {formatMessageDate(message.created_at)}
                        </div>
                      ) : null}
                      <div
                        className={`floating-chat__message-row flex items-end gap-2 ${message.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.sender_id !== userId ? (
                          <Avatar
                            src={activeFriend?.avatar_url ?? undefined}
                            name={activeFriend?.name ?? ''}
                            alt={activeFriend?.name ?? 'Friend'}
                            size="xs"
                            className="floating-chat__message-avatar"
                          />
                        ) : null}
                        <div
                          className={`floating-chat__message max-w-[82%] rounded-xl px-3 py-2 text-sm shadow-sm ${
                            message.sender_id === userId
                              ? 'floating-chat__message--sent ml-auto bg-blue-500 text-white rounded-br-lg rounded-tl-lg rounded-tr-md'
                              : 'floating-chat__message--received mr-auto bg-gray-200 text-gray-800 rounded-bl-lg rounded-br-md rounded-tl-md rounded-tr-lg'
                          }`}
                        >
                          {message.deleted_at ? <em>Message deleted</em> : message.body}
                        </div>
                        {message.sender_id === userId &&
                        index === messages.length - 1 &&
                        recipientReadMessageId === message.id ? (
                          <Avatar
                            src={activeFriend?.avatar_url ?? undefined}
                            name={activeFriend?.name ?? ''}
                            alt="Seen by recipient"
                            size="xs"
                            className="floating-chat__seen-avatar"
                          />
                        ) : null}
                      </div>
                      <div
                        className={`floating-chat__message-time mt-1 text-[10px] text-muted-foreground ${message.sender_id === userId ? 'text-right' : 'text-left'}`}
                      >
                        {formatMessageTime(message.created_at)}
                      </div>
                    </div>
                  )
                })}
                {!loadingMessages && messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No messages yet.</p>
                ) : null}
                <div
                  ref={messageEndRef}
                  className="floating-chat__message-end"
                  aria-hidden="true"
                />
              </div>
              <form className="floating-chat__composer flex gap-2 border-t p-3" onSubmit={send}>
                <Input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Type a message"
                  aria-label="Floating chat message"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!draft.trim()}
                  aria-label="Send floating chat message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="floating-chat__conversation-list flex-1 overflow-y-auto p-3">
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Recent chats
              </p>
              {conversations.map((conversation) => {
                const friend = friendById.get(conversation.participant_id)
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    className="floating-chat__conversation flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-muted"
                    onClick={() => setActiveConversationId(conversation.id)}
                  >
                    <Avatar
                      src={friend?.avatar_url ?? undefined}
                      name={friend?.name ?? ''}
                      alt={friend?.name ?? 'Friend'}
                      size="xs"
                    />
                    <span className="truncate text-sm font-medium">
                      {friend?.name || 'Private conversation'}
                    </span>
                  </button>
                )
              })}
              <p className="my-3 text-xs font-semibold uppercase text-muted-foreground">Friends</p>
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  type="button"
                  className="floating-chat__friend flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-muted"
                  onClick={() => void openConversation(friend.id)}
                >
                  <Avatar
                    src={friend.avatar_url ?? undefined}
                    name={friend.name ?? ''}
                    alt={friend.name ?? 'Friend'}
                    size="xs"
                  />
                  <span className="truncate text-sm">{friend.name || friend.email}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      ) : null}
      <div className="floating-chat__launcher-stack relative">
        <div className="floating-chat__unread-stack absolute bottom-full right-0 mb-3 flex flex-col items-end gap-2">
          {unreadConversations.map((conversation) => {
            const friend = friendById.get(conversation.participant_id)
            return (
              <button
                key={conversation.id}
                type="button"
                className="floating-chat__unread-conversation relative rounded-full shadow-lg"
                onClick={() => {
                  setOpen(true)
                  setActiveConversationId(conversation.id)
                }}
                aria-label={`Open ${friend?.name || 'conversation'}, ${conversation.unread_count} unread messages`}
              >
                <Avatar
                  src={friend?.avatar_url ?? undefined}
                  name={friend?.name ?? ''}
                  alt={friend?.name || 'Friend'}
                  size="sm"
                  className="floating-chat__unread-avatar ring-2 ring-background"
                />
                <span className="floating-chat__unread-badge absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold text-destructive-foreground">
                  {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                </span>
              </button>
            )
          })}
        </div>
        <Button
          type="button"
          size="icon"
          className="floating-chat__launcher h-14 w-14 rounded-full shadow-xl"
          onClick={() => setOpen(true)}
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}
