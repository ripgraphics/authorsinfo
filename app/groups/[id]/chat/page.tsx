'use client'

import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase-client'
import { applyReactionDelete, applyReactionInsert } from '@/lib/chat-reaction-state'

interface ChatChannel {
  id: string
  group_id: string
  name: string | null
  description: string | null
}

interface ChatMessage {
  id: string
  channel_id: string
  user_id: string | null
  message: string | null
  created_at: string | null
}

interface ChatReaction {
  message_id: string
  reaction: string
  user_id: string
}

const EMOJIS = ['👍', '😂', '🔥', '❤️', '😮', '🎉']

export default function GroupChatPage() {
  const params = useParams<{ id: string }>()
  const groupId = params.id
  const [userId, setUserId] = useState<string | null>(null)
  const [channel, setChannel] = useState<ChatChannel | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reactions, setReactions] = useState<Record<string, string[]>>({})
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    async function loadChat() {
      setLoading(true)
      setError(null)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        setError('Sign in to access group chat.')
        setLoading(false)
        return
      }

      setUserId(user.id)
      const channelsResponse = await fetch(`/api/groups/${groupId}/chat`)
      const channelsData = await channelsResponse.json()
      if (cancelled) return
      if (!channelsResponse.ok) {
        setError(channelsData.error || 'Unable to load group chat.')
        setLoading(false)
        return
      }

      const selectedChannel = (channelsData as ChatChannel[])[0] ?? null
      setChannel(selectedChannel)
      if (!selectedChannel) {
        setMessages([])
        setLoading(false)
        return
      }

      const messagesResponse = await fetch(
        `/api/groups/${groupId}/chat?channel_id=${encodeURIComponent(selectedChannel.id)}`
      )
      const messagesData = await messagesResponse.json()
      if (cancelled) return
      if (!messagesResponse.ok) {
        setError(messagesData.error || 'Unable to load group messages.')
      } else {
        setMessages(messagesData as ChatMessage[])
        const loadedReactions: Record<string, string[]> = {}
        for (const message of messagesData as ChatMessage[]) {
          const reactionsResponse = await fetch(
            `/api/groups/${groupId}/chat/reactions?message_id=${encodeURIComponent(message.id)}`
          )
          if (!reactionsResponse.ok) continue
          const reactionRows = (await reactionsResponse.json()) as ChatReaction[]
          loadedReactions[message.id] = reactionRows.map((reaction) => reaction.reaction)
        }
        setReactions(loadedReactions)
        const latestMessage = (messagesData as ChatMessage[]).at(-1)
        if (latestMessage?.created_at) {
          await fetch(`/api/groups/${groupId}/chat/read-state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channel_id: selectedChannel.id,
              last_read_at: latestMessage.created_at,
            }),
          })
        }
      }
      setLoading(false)
    }

    void loadChat()
    return () => {
      cancelled = true
    }
  }, [groupId])

  useEffect(() => {
    if (!channel || !userId) return
    const supabase = createClient()
    const realtimeChannel = supabase
      .channel(`group_chat_channel_${channel.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_chat_messages',
          filter: `channel_id=eq.${channel.id}`,
        },
        (payload) => {
          setMessages((previous) => {
            if (previous.some((message) => message.id === payload.new.id)) return previous
            return [...previous, payload.new as ChatMessage]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_chat_message_reactions',
        },
        (payload) => {
          setReactions((previous) => applyReactionInsert(previous, payload.new))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'group_chat_message_reactions',
        },
        (payload) => {
          setReactions((previous) => applyReactionDelete(previous, payload.old))
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(realtimeChannel)
    }
  }, [channel, userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!channel || !body.trim() || sending) return
    setSending(true)
    setError(null)
    const response = await fetch(`/api/groups/${groupId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_id: channel.id, message: body }),
    })
    const data = await response.json()
    if (!response.ok) {
      setError(data.error || 'Unable to send message.')
    } else {
      setBody('')
      setMessages((previous) =>
        previous.some((message) => message.id === data.id) ? previous : [...previous, data]
      )
    }
    setSending(false)
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!groupId) return
    const current = reactions[messageId] ?? []
    const hasReaction = current.includes(emoji)
    const response = await fetch(
      `/api/groups/${groupId}/chat/reactions${hasReaction ? `?message_id=${encodeURIComponent(messageId)}&reaction=${encodeURIComponent(emoji)}` : ''}`,
      {
        method: hasReaction ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...(hasReaction
          ? {}
          : { body: JSON.stringify({ message_id: messageId, reaction: emoji }) }),
      }
    )
    if (!response.ok) return
    setReactions((previous) =>
      hasReaction
        ? applyReactionDelete(previous, { message_id: messageId, reaction: emoji })
        : applyReactionInsert(previous, { message_id: messageId, reaction: emoji })
    )
  }

  return (
    <div className="group-chat group-chat__layout mx-auto flex h-[80vh] max-w-3xl flex-col p-4">
      <header className="group-chat__header mb-4">
        <h2 className="group-chat__title text-2xl font-bold">{channel?.name || 'Group Chat'}</h2>
        {channel?.description && (
          <p className="group-chat__description text-sm text-gray-500">{channel.description}</p>
        )}
      </header>
      <div className="group-chat__message-list mb-4 flex-1 overflow-y-auto rounded-sm bg-gray-50 p-4">
        {loading ? (
          <div className="group-chat__status">Loading...</div>
        ) : error && !channel ? (
          <div className="group-chat__error text-red-600">{error}</div>
        ) : !channel ? (
          <div className="group-chat__empty text-gray-500">No group chat channel is available.</div>
        ) : messages.length === 0 ? (
          <div className="group-chat__empty text-gray-500">No messages yet.</div>
        ) : (
          <div className="group-chat__messages space-y-2">
            {messages.map((message) => {
              const isOwnMessage = message.user_id === userId
              return (
                <div
                  key={message.id}
                  className={`group-chat__message flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`group-chat__bubble max-w-xl rounded-lg px-4 py-2 ${
                      isOwnMessage ? 'bg-blue-500 text-white' : 'border bg-white'
                    }`}
                  >
                    <div className="group-chat__sender text-xs font-semibold">
                      {isOwnMessage ? 'You' : message.user_id}
                    </div>
                    <div className="group-chat__body whitespace-pre-wrap break-words">
                      {message.message}
                    </div>
                    <div className="group-chat__reactions mt-1 flex gap-1">
                      {EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="group-chat__reaction text-lg transition-transform hover:scale-110"
                          onClick={() => handleReaction(message.id, emoji)}
                          aria-label={`React ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    {(reactions[message.id] ?? []).length > 0 && (
                      <div className="group-chat__reaction-summary mt-1 text-sm">
                        {reactions[message.id].join(' ')}
                      </div>
                    )}
                    <div className="group-chat__timestamp mt-1 text-[10px] text-gray-400">
                      {message.created_at?.slice(0, 16).replace('T', ' ')}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} className="group-chat__scroll-anchor" />
          </div>
        )}
      </div>
      {error && channel && (
        <div className="group-chat__error mb-2 text-xs text-red-600">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="group-chat__composer flex gap-2">
        <Input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={channel ? 'Type a message...' : 'Chat is unavailable'}
          className="group-chat__input flex-1"
          disabled={!channel || !userId || sending}
          maxLength={10000}
        />
        <Button
          type="submit"
          className="group-chat__send-button"
          disabled={!channel || !userId || !body.trim() || sending}
        >
          {sending ? 'Sending...' : 'Send'}
        </Button>
      </form>
    </div>
  )
}
