/* eslint-disable descriptive-classname/require-semantic-classname */
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Mail, MessageSquare, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { MessageButton } from '@/components/message-button'

interface InboxConversation {
  id: string
  group_id: string
  name: string | null
  description: string | null
  latest_message: { message: string | null; created_at: string | null } | null
  unread_count: number
}
interface PrivateMessagingStatus {
  ready: boolean
  reason: string | null
}
interface DirectConversation {
  id: string
  participant_id: string
  last_message_at: string | null
}
interface DirectSearchResult {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
}
interface Friend {
  id: string
  name: string | null
  email: string | null
  avatar_url?: string | null
}
interface FriendApiRow {
  friend: Friend
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<InboxConversation[]>([])
  const [directConversations, setDirectConversations] = useState<DirectConversation[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [privateMessaging, setPrivateMessaging] = useState<PrivateMessagingStatus | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<DirectSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadConversations = async () => {
    setLoading(true)
    const response = await fetch('/api/messages', { cache: 'no-store' })
    const data = await response.json()
    if (!response.ok) setError(data.error || 'Unable to load messages.')
    else setConversations(data as InboxConversation[])
    setLoading(false)
  }

  useEffect(() => {
    void loadConversations()
    void fetch('/api/messages/direct', { cache: 'no-store' }).then(async (response) => {
      if (response.ok) setDirectConversations((await response.json()) as DirectConversation[])
    })
    void fetch('/api/messages/capabilities', { cache: 'no-store' }).then(async (response) => {
      if (response.ok)
        setPrivateMessaging((await response.json()).private_messaging as PrivateMessagingStatus)
    })
    void fetch('/api/friends/list?limit=100', { cache: 'no-store' }).then(async (response) => {
      if (response.ok) {
        const data = await response.json()
        setFriends(
          ((data.friends ?? []) as FriendApiRow[])
            .map((row) => row.friend)
            .filter((friend) => Boolean(friend?.id))
        )
      }
    })
  }, [])

  const searchMessages = async () => {
    const query = searchQuery.trim()
    if (!query) {
      setSearchResults([])
      return
    }
    setSearching(true)
    const response = await fetch(`/api/messages/direct/search?q=${encodeURIComponent(query)}`, {
      cache: 'no-store',
    })
    const data = await response.json()
    if (!response.ok) setError(data.error || 'Unable to search messages.')
    else setSearchResults(data as DirectSearchResult[])
    setSearching(false)
  }

  const markUnread = async (conversation: InboxConversation) => {
    await fetch(`/api/groups/${conversation.group_id}/chat/read-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_id: conversation.id, mark_unread: true }),
    })
    await loadConversations()
  }

  return (
    <main className="messages-inbox messages-inbox__layout mx-auto max-w-5xl p-4 md:p-6">
      <header className="messages-inbox__header mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="messages-inbox__title text-3xl font-bold">Messages</h1>
          <p className="messages-inbox__description text-muted-foreground">
            Your authorized conversations
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="messages-inbox__refresh"
          onClick={() => void loadConversations()}
          disabled={loading}
          aria-label="Refresh messages"
        >
          <RefreshCw className="messages-inbox__refresh-icon" />
        </Button>
      </header>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void searchMessages()
        }}
        className="messages-inbox__search mb-6 flex gap-2"
      >
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search private messages"
          maxLength={200}
          className="messages-inbox__search-input"
          aria-label="Search private messages"
        />
        <Button
          type="submit"
          variant="outline"
          className="messages-inbox__search-button"
          disabled={searching || !searchQuery.trim()}
        >
          {searching ? 'Searching...' : 'Search'}
        </Button>
      </form>
      {searchResults.length > 0 && (
        <section className="messages-inbox__search-results mb-6">
          <h2 className="mb-3 text-lg font-semibold">Search results ({searchResults.length})</h2>
          <div className="divide-y rounded-lg border">
            {searchResults.map((result) => (
              <Link
                key={result.id}
                href={`/messages/direct/${result.conversation_id}`}
                className="block p-4 hover:bg-muted/50"
              >
                <span className="block truncate text-sm">{result.body}</span>
                <span className="block text-xs text-muted-foreground">
                  {new Date(result.created_at).toLocaleString()}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
      {privateMessaging && !privateMessaging.ready && (
        <div className="messages-inbox__private-status mb-6 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Private messaging is not enabled yet. {privateMessaging.reason}
        </div>
      )}
      <section className="messages-inbox__new-conversation mb-6 rounded-lg border p-4">
        <h2 className="mb-3 text-lg font-semibold">Message a friend</h2>
        <div
          className="grid gap-2 sm:grid-cols-2"
          role="listbox"
          aria-label="Choose a friend to message"
        >
          {friends.map((friend) => (
            <div key={friend.id} className="flex items-center gap-3 rounded-md border p-3">
              <Avatar
                id={friend.id}
                src={friend.avatar_url ?? undefined}
                name={friend.name || friend.email || ''}
                alt={friend.name || 'Friend avatar'}
                size="xs"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {friend.name || 'Unnamed friend'}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {friend.email || ''}
                </span>
              </span>
              <MessageButton
                targetUserId={friend.id}
                compact
                className="messages-inbox__friend-message"
              />
            </div>
          ))}
        </div>
      </section>
      {directConversations.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Private conversations</h2>
          <div className="divide-y rounded-lg border">
            {directConversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/messages/direct/${conversation.id}`}
                className="flex items-center gap-4 p-4 hover:bg-muted/50"
              >
                <MessageSquare className="h-5 w-5" />
                <span className="flex-1">Private conversation</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      {loading ? (
        <div className="messages-inbox__status">Loading conversations...</div>
      ) : error ? (
        <div className="messages-inbox__error text-destructive">{error}</div>
      ) : conversations.length === 0 ? (
        <div className="messages-inbox__empty flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No conversations yet</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Join a group with chat enabled to see its conversation here.
          </p>
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {conversations.map((conversation) => (
            <div key={conversation.id} className="flex items-center gap-4 p-4">
              <Link
                href={`/groups/${conversation.group_id}/chat`}
                className="flex min-w-0 flex-1 items-center gap-4"
              >
                <MessageSquare className="h-5 w-5" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {conversation.name || 'Group conversation'}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {conversation.latest_message?.message ||
                      conversation.description ||
                      'No messages yet'}
                  </span>
                </span>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void markUnread(conversation)}
                aria-label="Mark conversation unread"
              >
                {conversation.unread_count > 0 ? (
                  conversation.unread_count
                ) : (
                  <Mail className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
