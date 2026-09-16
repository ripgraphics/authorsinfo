/* eslint-disable descriptive-classname/require-semantic-classname */
'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Minus, Phone, Video, X } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { useAuth } from '@/hooks/useAuth'
import { broadcastChatUnreadTotal } from '@/hooks/use-chat-unread'
import { useTypingIndicator } from '@/hooks/use-typing-indicator'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { ChatComposer } from '@/components/chat-composer'
import { TypingIndicator } from '@/components/typing-indicator'
import { EntityHoverCard } from '@/components/entity-hover-cards'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatChatTimestamp } from '@/lib/utils/dateUtils'

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
  read_at?: string | null
  read_by?: string | null
}

export interface FloatingChatProps {
  openEventName?: string
}

export function FloatingChat({
  openEventName = 'authorsinfo:open-floating-chat',
}: FloatingChatProps) {
  const formatMessageDate = (value: string) =>
    new Date(value).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? null
  const [open, setOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [unreadConversations, setUnreadConversations] = useState<UnreadConversation[]>([])
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createBrowserClient<Database>>['channel']
  > | null>(null)
  const messageEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  // Tracks the message count seen on the previous render for this
  // conversation. On initial load (or conversation switch) the list jumps
  // straight to the newest message; only genuinely new messages after
  // that smooth-scroll into view.
  const lastMessageCountRef = useRef(0)
  const lastConversationRef = useRef<string | null>(null)

  // Typing indicator hook
  const { typingUserNames, broadcastTyping: broadcastTypingEvent } = useTypingIndicator({
    conversationId: activeConversationId,
    currentUserId: userId,
  })

  useEffect(() => {
    if (!open || !activeConversationId || messages.length === 0) return

    const isNewConversation = lastConversationRef.current !== activeConversationId
    const isInitialLoad = isNewConversation || lastMessageCountRef.current === 0
    const hasNewMessage = messages.length > lastMessageCountRef.current

    lastConversationRef.current = activeConversationId
    lastMessageCountRef.current = messages.length

    const scrollToBottom = (behavior: ScrollBehavior) => {
      const container = messagesContainerRef.current
      if (container) {
        // Scroll the container itself — robust against late-loading
        // avatars/images shifting content after scrollIntoView runs.
        container.scrollTo({ top: container.scrollHeight, behavior })
      } else {
        messageEndRef.current?.scrollIntoView({ behavior, block: 'end' })
      }
    }

    // Initial open: jump instantly to the newest message — no animation
    // through the whole history. New messages afterwards: smooth scroll.
    if (isInitialLoad) {
      scrollToBottom('auto')
      // Re-assert once fonts/avatars settle so we end exactly at bottom.
      const raf = window.requestAnimationFrame(() => scrollToBottom('auto'))
      return () => window.cancelAnimationFrame(raf)
    }
    if (hasNewMessage) scrollToBottom('smooth')
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

  // Latest open/active state for the unread poll — read via ref so the
  // polling effect does not re-run (and re-fetch) when the chat window
  // opens or minimizes.
  const chatStateRef = useRef({ open: false, activeConversationId: null as string | null })
  chatStateRef.current = { open, activeConversationId }

  useEffect(() => {
    if (!user) return
    const refreshUnread = async () => {
      const { open: chatOpen, activeConversationId: activeId } = chatStateRef.current
      const conversations = (await fetch('/api/messages/direct', { cache: 'no-store' }).then(
        (response) => (response.ok ? response.json() : [])
      )) as Conversation[]
      const unread = await Promise.all(
        conversations.map(async (conversation) => {
          // Skip the active conversation while the chat is open — its read
          // state is being persisted and the badge is already cleared.
          if (chatOpen && conversation.id === activeId) return null
          const messages = await fetch(`/api/messages/direct/${conversation.id}?limit=50`, {
            cache: 'no-store',
          }).then((response) => (response.ok ? response.json() : { messages: [] }))
          const readStates = (await fetch(`/api/messages/direct/${conversation.id}/read-state`, {
            cache: 'no-store',
          }).then((response) => (response.ok ? response.json() : []))) as {
            user_id: string
            last_read_message_id: string | null
          }[]
          // Unread = messages from the other participant that appear AFTER
          // MY last-read position, so use the current user's read state.
          const myReadState = readStates.find((state) => state.user_id === userId)
          const lastReadIndex = myReadState?.last_read_message_id
            ? (messages.messages as Message[]).findIndex(
                (message) => message.id === myReadState.last_read_message_id
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
      const nextUnread = unread.filter((conversation): conversation is UnreadConversation =>
        Boolean(conversation)
      )
      setUnreadConversations(nextUnread)
      // Broadcast the total so the header Messages badge stays in sync.
      broadcastChatUnreadTotal(nextUnread.reduce((sum, item) => sum + item.unread_count, 0))
    }
    void refreshUnread()
    const interval = window.setInterval(() => void refreshUnread(), 3000)
    return () => window.clearInterval(interval)
  }, [user, userId])

  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener(openEventName, handleOpen)
    return () => window.removeEventListener(openEventName, handleOpen)
  }, [openEventName])

  // Clear the unread badge for the active conversation as soon as it is
  // opened — the read state is persisted server-side right after.
  // Reads the latest list via ref so the deps stay stable.
  const unreadRef = useRef<UnreadConversation[]>([])
  unreadRef.current = unreadConversations
  useEffect(() => {
    if (!open || !activeConversationId) return
    const current = unreadRef.current
    const next = current.filter((conversation) => conversation.id !== activeConversationId)
    if (next.length === current.length) return
    setUnreadConversations(next)
    broadcastChatUnreadTotal(next.reduce((sum, item) => sum + item.unread_count, 0))
  }, [open, activeConversationId])

  useEffect(() => {
    if (!activeConversationId) return
    // Clear the previous conversation's messages immediately so the
    // window does not briefly show stale messages while the new ones load.
    setMessages([])
    lastMessageCountRef.current = 0
    setLoadingMessages(true)
    void fetch(`/api/messages/direct/${activeConversationId}?limit=50`, { cache: 'no-store' })
      .then((response) => response.json())
      .then(async (data) => {
        setMessages((data.messages ?? []) as Message[])
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
      process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim()
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

  const send = async (body: string): Promise<boolean> => {
    if (!activeConversationId || !body.trim()) return false
    const trimmedBody = body.trim()
    // Optimistic update: show the message immediately, replace with the
    // server response (or remove on failure) without waiting on realtime.
    const optimisticId = `optimistic-${Date.now()}`
    const optimisticMessage: Message = {
      id: optimisticId,
      sender_id: userId ?? '',
      body: trimmedBody,
      created_at: new Date().toISOString(),
      deleted_at: null,
    }
    setMessages((current) => [...current, optimisticMessage])
    try {
      const response = await fetch(`/api/messages/direct/${activeConversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmedBody }),
      })
      if (!response.ok) throw new Error('Send failed')
      const saved = (await response.json()) as Message
      setMessages((current) =>
        current.map((message) => (message.id === optimisticId ? saved : message))
      )
      return true
    } catch {
      // Roll back the optimistic message; returning false keeps the draft.
      setMessages((current) => current.filter((message) => message.id !== optimisticId))
      return false
    }
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
        <section className="floating-chat__panel relative flex h-[min(32rem,calc(100vh-6rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border bg-background shadow-2xl">
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
              <IconButton
                icon={Phone}
                label="Audio call"
                tone="theme"
                className="floating-chat__call [&_svg]:size-5"
              />
              <IconButton
                icon={Video}
                label="Video call"
                tone="theme"
                className="floating-chat__video [&_svg]:size-5"
              />
              <IconButton
                icon={Minus}
                label="Minimize chat"
                tone="theme"
                onClick={() => setOpen(false)}
                className="floating-chat__minimize [&_svg]:size-5"
              />
              <IconButton
                icon={X}
                label="Close"
                tone="theme"
                onClick={() => {
                  setOpen(false)
                  setActiveConversationId(null)
                }}
                className="floating-chat__dismiss [&_svg]:size-5"
              />
            </div>
          </header>
          {activeConversationId ? (
            <>
              <div
                ref={messagesContainerRef}
                className="floating-chat__messages flex-1 space-y-2 overflow-y-auto p-3"
              >
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
                              ? 'floating-chat__message--sent ml-auto bg-app-theme-blue text-primary-foreground rounded-br-lg rounded-tl-lg rounded-tr-md'
                              : 'floating-chat__message--received mr-auto bg-muted text-foreground rounded-bl-lg rounded-br-md rounded-tl-md rounded-tr-lg'
                          }`}
                        >
                          {message.deleted_at ? <em>Message deleted</em> : message.body}
                        </div>
                      </div>
                      <div
                        className={`floating-chat__message-time mt-1 text-[10px] text-muted-foreground ${message.sender_id === userId ? 'text-right' : 'text-left'}`}
                      >
                        {formatChatTimestamp(message.created_at)}
                      </div>
                        {message.sender_id === userId && message.read_at && message.read_by ? (
                        <div className="floating-chat__seen-receipt mt-0.5 flex justify-end">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex h-3.5 w-3.5 cursor-help">
                                <Avatar
                                  src={activeFriend?.avatar_url ?? undefined}
                                  name={activeFriend?.name ?? ''}
                                  alt="Seen by recipient"
                                  size="receipt"
                                  className="floating-chat__seen-avatar border shadow-none"
                                />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Seen by {activeFriend?.name || 'recipient'} at{' '}
                              {formatChatTimestamp(message.read_at)}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      ) : null}
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
              <div className="floating-chat__typing-overlay pointer-events-none absolute bottom-16 left-3 right-3 z-10">
                <TypingIndicator
                  typingUserNames={typingUserNames}
                  className="floating-chat__typing rounded-md bg-background/95 px-2 py-1 shadow-sm"
                />
              </div>
              <ChatComposer
                conversationId={activeConversationId}
                onSend={(body) => send(body)}
                onTyping={broadcastTypingEvent}
                placeholder="Type a message"
                ariaLabel="Floating chat message"
                className="floating-chat__composer border-t p-3"
                textareaClassName="floating-chat__composer-textarea"
                sendButtonClassName="floating-chat__send"
                sendButtonLabel="Send floating chat message"
              />
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
          {/* Minimized conversation avatar — clicking it reopens the chat */}
          {!open && activeConversationId && activeFriend ? (
            <button
              type="button"
              className="floating-chat__minimized-conversation relative rounded-full shadow-lg"
              onClick={() => setOpen(true)}
              aria-label={`Open chat with ${activeFriend.name || 'friend'}`}
              title={`Chat with ${activeFriend.name || 'friend'}`}
            >
              <Avatar
                src={activeFriend.avatar_url ?? undefined}
                name={activeFriend.name ?? ''}
                alt={activeFriend.name || 'Friend'}
                size="sm"
                className="floating-chat__minimized-avatar ring-2 ring-background"
              />
              {(() => {
                const unread = unreadConversations.find(
                  (conversation) => conversation.id === activeConversationId
                )
                return unread && unread.unread_count > 0 ? (
                  <span className="floating-chat__unread-badge absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold text-destructive-foreground">
                    {unread.unread_count > 99 ? '99+' : unread.unread_count}
                  </span>
                ) : null
              })()}
            </button>
          ) : null}
          {unreadConversations
            .filter((conversation) => open || conversation.id !== activeConversationId)
            .map((conversation) => {
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
