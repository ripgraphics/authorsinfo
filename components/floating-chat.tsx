/* eslint-disable descriptive-classname/require-semantic-classname */
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Maximize2, MessageCircle, MoreHorizontal, Pencil, Search } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { GiphyFetch } from '@giphy/js-fetch-api'
import type { ChatComposerGif } from '@/components/chat-composer'
import type { Database } from '@/types/database'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { broadcastChatUnreadTotal } from '@/hooks/use-chat-unread'
import { useTypingIndicator } from '@/hooks/use-typing-indicator'
import { useGroupPermissions } from '@/hooks/useGroupPermissions'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ChatComposer } from '@/components/chat-composer'
import { ConversationRail } from '@/components/conversation-rail'
import { ParticipantDetailsPanel } from '@/components/participant-details-panel'
import { DirectMessageList } from '@/components/direct-message-list'
import { ConversationHeader } from '@/components/conversation-header'
import { DirectCallPanel } from '@/components/direct-call-panel'
import { useDirectCall } from '@/hooks/use-direct-call'
import {
  normalizeDirectConversation,
  normalizeGroupConversation,
  type DirectConversationRecord,
  type GroupConversationRecord,
  type MessengerConversation,
} from '@/lib/messaging/conversation-types'
import {
  normalizeDirectMessage,
  normalizeGroupMessage,
  appendUniqueMessage,
  type MessengerMessage,
} from '@/lib/messaging/message-types'
import { shouldSkipActiveUnreadRefresh } from '@/lib/messaging/unread'
import type { MessengerRequestListItem } from '@/components/messenger-request-list'

type Conversation = DirectConversationRecord

interface UnreadConversation {
  id: string
  unread_count: number
}

interface Friend {
  id: string
  name: string | null
  email: string | null
  avatar_url?: string | null
  role?: string | null
}

export interface FloatingChatProps {
  openEventName?: string
  fullPage?: boolean
  initialConversationId?: string | null
  compactInbox?: boolean
}

export function FloatingChat({
  openEventName = 'authorsinfo:open-floating-chat',
  fullPage = false,
  initialConversationId = null,
  compactInbox = false,
}: FloatingChatProps) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const userId = user?.id ?? null
  const giphyFetch = useMemo(
    () => new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'dc6zaTOxFJmzC'),
    []
  )
  const [open, setOpen] = useState(fullPage)
  const compactPanelRef = useRef<HTMLElement | null>(null)
  const [conversations, setConversations] = useState<MessengerConversation[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [messageRequests, setMessageRequests] = useState<MessengerRequestListItem[]>([])
  const [groupMembers, setGroupMembers] = useState<Friend[]>([])
  const [leavingGroup, setLeavingGroup] = useState(false)
  const [invitingMemberId, setInvitingMemberId] = useState<string | null>(null)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversationId
  )
  const [minimizedConversationIds, setMinimizedConversationIds] = useState<string[]>([])
  const [messages, setMessages] = useState<MessengerMessage[]>([])
  const [replyingToMessageId, setReplyingToMessageId] = useState<string | null>(null)
  const [mentionUserIds, setMentionUserIds] = useState<string[]>([])
  const [forwardingMessage, setForwardingMessage] = useState<MessengerMessage | null>(null)
  const [pinnedMessageIds, setPinnedMessageIds] = useState<Set<string>>(new Set())
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [messageLoadError, setMessageLoadError] = useState<string | null>(null)
  const [conversationUnavailable, setConversationUnavailable] = useState(false)
  const [messageLoadAttempt, setMessageLoadAttempt] = useState(0)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [nextMessageCursor, setNextMessageCursor] = useState<string | null>(null)
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false)
  const [connectionError, setConnectionError] = useState(false)
  const [callCapabilityReady, setCallCapabilityReady] = useState(false)
  const [reconnectAttempt, setReconnectAttempt] = useState(0)
  const [activeConversationMuted, setActiveConversationMuted] = useState(false)
  const [activeConversationArchived, setActiveConversationArchived] = useState(false)
  const [activeConversationRestricted, setActiveConversationRestricted] = useState(false)
  const [archivedConversationIds, setArchivedConversationIds] = useState<Set<string>>(new Set())
  const [unreadConversations, setUnreadConversations] = useState<UnreadConversation[]>([])
  const manuallyUnreadConversationIdsRef = useRef(new Set<string>())
  const [conversationSearch, setConversationSearch] = useState('')
  const [conversationFilter, setConversationFilter] = useState<
    'all' | 'unread' | 'groups' | 'communities'
  >('all')
  const [compactOptionsOpen, setCompactOptionsOpen] = useState(false)
  const [mobileConversationOpen, setMobileConversationOpen] = useState(Boolean(initialConversationId))
  const conversationsRef = useRef<MessengerConversation[]>([])
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createBrowserClient<Database>>['channel']
  > | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const lastSentMessageIdRef = useRef<string | null>(null)
  // Tracks the message count seen on the previous render for this
  // conversation. On initial load (or conversation switch) the list jumps
  // straight to the newest message; only genuinely new messages after
  // that smooth-scroll into view.
  const lastMessageCountRef = useRef(0)
  const lastConversationRef = useRef<string | null>(null)
  const directCall = useDirectCall({
    conversationId: activeConversationId,
    currentUserId: userId,
  })

  // Typing indicator hook
  const { typingUserNames, broadcastTyping: broadcastTypingEvent } = useTypingIndicator({
    conversationId: activeConversationId,
    currentUserId: userId,
  })
  conversationsRef.current = conversations

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
    if (!activeConversationId) {
      setCallCapabilityReady(false)
      return
    }
    const conversation = conversationsRef.current.find((item) => item.id === activeConversationId)
    if (conversation?.kind !== 'direct') {
      setCallCapabilityReady(false)
      return
    }
    let active = true
    void fetch('/api/messages/calls/capabilities', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() as Promise<{ ready?: boolean }> : null))
      .then((capability) => {
        if (active) setCallCapabilityReady(Boolean(capability?.ready))
      })
      .catch(() => {
        if (active) setCallCapabilityReady(false)
      })
    return () => {
      active = false
    }
  }, [activeConversationId, conversations])

  useEffect(() => {
    if (fullPage) {
      setOpen(true)
      if (initialConversationId) {
        setActiveConversationId(initialConversationId)
        setMobileConversationOpen(true)
      }
      return
    }
    if (!userId) return
    const storagePrefix = `authorsinfo:floating-chat:${userId}`
    const storedOpen = window.sessionStorage.getItem(`${storagePrefix}:open`)
    const storedConversation = window.sessionStorage.getItem(`${storagePrefix}:conversation`)
    if (storedOpen === 'true') setOpen(true)
    if (storedConversation) {
      try {
        const parsed = JSON.parse(storedConversation) as unknown
        setMinimizedConversationIds(
          Array.isArray(parsed)
            ? parsed.filter((value): value is string => typeof value === 'string')
            : [storedConversation]
        )
      } catch {
        setMinimizedConversationIds([storedConversation])
      }
    }
  }, [fullPage, initialConversationId, userId])

  useEffect(() => {
    if (!userId) return
    const storagePrefix = `authorsinfo:floating-chat:${userId}`
    window.sessionStorage.setItem(`${storagePrefix}:open`, String(open))
    if (minimizedConversationIds.length > 0) {
      window.sessionStorage.setItem(`${storagePrefix}:conversation`, JSON.stringify(minimizedConversationIds))
    } else {
      window.sessionStorage.removeItem(`${storagePrefix}:conversation`)
    }
  }, [open, minimizedConversationIds, userId])

  useEffect(() => {
    if (!userId || !activeConversationId) return
    if (conversations.length === 0) return
    if (conversationsRef.current.some((conversation) => conversation.id === activeConversationId)) return
    setActiveConversationId(null)
    setMobileConversationOpen(false)
  }, [conversations, activeConversationId, userId])

  useEffect(() => {
    if (!user) return
    void Promise.all([
      fetch('/api/messages/direct', { cache: 'no-store' }).then((response) =>
        response.ok ? response.json() : []
      ),
      fetch('/api/messages', { cache: 'no-store' }).then((response) =>
        response.ok ? response.json() : []
      ),
      fetch('/api/friends/list?limit=100', { cache: 'no-store' }).then((response) =>
        response.ok ? response.json() : { friends: [] }
      ),
      fetch('/api/messages/requests', { cache: 'no-store' }).then((response) =>
        response.ok ? response.json() : []
      ),
    ]).then(([conversationData, groupConversationData, friendData, requestData]) => {
      const directConversations = (conversationData as Conversation[]).map(
        normalizeDirectConversation
      )
      const groupConversations = (groupConversationData as GroupConversationRecord[]).map(
        normalizeGroupConversation
      )
      setConversations(
        [...directConversations, ...groupConversations].sort((left, right) =>
          (right.latestMessageAt ?? '').localeCompare(left.latestMessageAt ?? '')
        )
      )
      setFriends(
        ((friendData.friends ?? []) as { friend: Friend }[])
          .map((row) => row.friend)
          .filter((friend) => Boolean(friend?.id))
      )
      setMessageRequests((requestData as MessengerRequestListItem[]) ?? [])
    })
  }, [user])

  const updateMessageRequest = async (
    requestId: string,
    action: 'accept' | 'decline' | 'cancel'
  ) => {
    const response = await fetch('/api/messages/requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: requestId, action }),
    })
    if (!response.ok) return
    setMessageRequests((current) => current.filter((request) => request.id !== requestId))
  }

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
        conversations.map(async (record) => {
          const conversation = normalizeDirectConversation(record)
          // Skip the active conversation while the chat is open — its read
          // state is being persisted and the badge is already cleared.
          if (
            shouldSkipActiveUnreadRefresh({
              chatOpen,
              conversationId: conversation.id,
              activeConversationId: activeId,
              manuallyUnreadConversationIds: manuallyUnreadConversationIdsRef.current,
            })
          ) return null
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
            ? (messages.messages as Array<{ id: string }>).findIndex(
              (message) => message.id === myReadState.last_read_message_id
              )
            : -1
          const count = Math.max(
            0,
            (messages.messages as Array<{ sender_id: string; id: string }>).filter(
              (message, index) => message.sender_id !== userId && index > lastReadIndex
            ).length
          )
          return count > 0 ? { id: conversation.id, unread_count: count } : null
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
    const handleOpen = () => {
      if (compactInbox) {
        setOpen((current) => !current)
        setActiveConversationId(null)
        setMobileConversationOpen(false)
      } else {
        setOpen(true)
        setActiveConversationId(null)
        setMobileConversationOpen(false)
      }
    }
    window.addEventListener(openEventName, handleOpen)
    return () => window.removeEventListener(openEventName, handleOpen)
  }, [compactInbox, openEventName])

  useEffect(() => {
    if (compactInbox) return
    const handleConversationSelection = (event: Event) => {
      const conversationId = (event as CustomEvent<{ conversationId?: string }>).detail?.conversationId
      if (!conversationId) return
      setActiveConversationId(conversationId)
      setMobileConversationOpen(true)
      setOpen(true)
    }
    const handleFriendSelection = (event: Event) => {
      const friendId = (event as CustomEvent<{ friendId?: string }>).detail?.friendId
      if (!friendId) return
      setOpen(true)
      setMobileConversationOpen(true)
      void openConversation(friendId)
    }
    window.addEventListener('authorsinfo:open-floating-conversation', handleConversationSelection)
    window.addEventListener('authorsinfo:open-floating-friend', handleFriendSelection)
    return () => {
      window.removeEventListener('authorsinfo:open-floating-conversation', handleConversationSelection)
      window.removeEventListener('authorsinfo:open-floating-friend', handleFriendSelection)
    }
  }, [compactInbox])

  useEffect(() => {
    if (!compactInbox || !open) return
    const handleOutsidePointer = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (compactPanelRef.current?.contains(target)) return
      if (target.closest('.page-header__messages-btn')) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', handleOutsidePointer)
    return () => document.removeEventListener('pointerdown', handleOutsidePointer)
  }, [compactInbox, open])

  // Clear the unread badge for the active conversation as soon as it is
  // opened — the read state is persisted server-side right after.
  // Reads the latest list via ref so the deps stay stable.
  const unreadRef = useRef<UnreadConversation[]>([])
  unreadRef.current = unreadConversations
  useEffect(() => {
    if (!open || !activeConversationId) return
    manuallyUnreadConversationIdsRef.current.delete(activeConversationId)
    const current = unreadRef.current
    const next = current.filter((conversation) => conversation.id !== activeConversationId)
    if (next.length === current.length) return
    setUnreadConversations(next)
    broadcastChatUnreadTotal(next.reduce((sum, item) => sum + item.unread_count, 0))
  }, [open, activeConversationId])

  useEffect(() => {
    if (!activeConversationId) return
    const historyController = new AbortController()
    // Clear the previous conversation's messages immediately so the
    // window does not briefly show stale messages while the new ones load.
    setMessages([])
    setReplyingToMessageId(null)
    setMentionUserIds([])
    setPinnedMessageIds(new Set())
    setMessageLoadError(null)
    setConversationUnavailable(false)
    setConnectionError(false)
    setActiveConversationMuted(false)
    setActiveConversationArchived(archivedConversationIds.has(activeConversationId))
    setActiveConversationRestricted(false)
    setHasMoreMessages(false)
    setNextMessageCursor(null)
    lastMessageCountRef.current = 0
    setLoadingMessages(true)
    const activeConversation = conversationsRef.current.find(
      (conversation) => conversation.id === activeConversationId
    )
    const isGroupConversation = activeConversation?.kind === 'messenger_group'
    const groupId = activeConversation?.groupId
    const historyUrl = isGroupConversation && groupId
      ? `/api/groups/${groupId}/chat?channel_id=${encodeURIComponent(activeConversationId)}`
      : `/api/messages/direct/${activeConversationId}?limit=50`
    const settingsUrl = isGroupConversation
      ? `/api/messages/group/${activeConversationId}/settings`
      : `/api/messages/direct/${activeConversationId}/settings`
    void Promise.all([
        fetch(settingsUrl, { cache: 'no-store' }),
        ...(isGroupConversation
          ? []
          : [fetch(`/api/messages/direct/${activeConversationId}/restriction`, { cache: 'no-store' })]),
      ])
        .then(async ([settingsResponse, restrictionResponse]) => ({
          settings: settingsResponse.ok ? await settingsResponse.json() : null,
          restriction: restrictionResponse?.ok ? await restrictionResponse.json() : null,
        }))
        .then(({ settings, restriction }) => {
          if (settings) {
            setActiveConversationMuted(Boolean(settings.is_muted))
            setActiveConversationArchived(Boolean(settings.is_archived))
            setArchivedConversationIds((current) => {
              const next = new Set(current)
              if (settings.is_archived) next.add(activeConversationId)
              else next.delete(activeConversationId)
              return next
            })
          }
          if (restriction) setActiveConversationRestricted(Boolean(restriction.restricted))
        })
    void fetch(historyUrl, { cache: 'no-store', signal: historyController.signal })
      .then((response) => {
        if (response.status === 403 || response.status === 404) {
          setConversationUnavailable(true)
          throw new DOMException('Conversation unavailable', 'AbortError')
        }
        if (!response.ok) throw new Error('Unable to load message history')
        return response.json()
      })
      .then(async (data) => {
        const normalizedMessages = isGroupConversation
          ? (data as Array<Parameters<typeof normalizeGroupMessage>[0]>).map(normalizeGroupMessage)
          : (data.messages ?? []).map(normalizeDirectMessage)
        if (!isGroupConversation) {
          await Promise.all(normalizedMessages.map(async (message: MessengerMessage) => {
            const attachmentResponse = await fetch(
              `/api/messages/direct/${activeConversationId}/attachments?message_id=${encodeURIComponent(message.id)}`,
              { cache: 'no-store', signal: historyController.signal }
            )
            if (!attachmentResponse.ok) return
            const attachments = await attachmentResponse.json() as Array<{
              id: string
              file_name: string
              mime_type: string
              file_size: number
            }>
            message.attachments = attachments.map((attachment) => ({
              id: attachment.id,
              fileName: attachment.file_name,
              mimeType: attachment.mime_type,
              fileSize: attachment.file_size,
            }))
          }))
        }
        setMessages(normalizedMessages)
        if (!isGroupConversation) {
          const pins = await Promise.all(normalizedMessages.map(async (message: MessengerMessage) => {
            const response = await fetch(
              `/api/messages/direct/${activeConversationId}/pins?message_id=${encodeURIComponent(message.id)}`,
              { cache: 'no-store', signal: historyController.signal }
            )
            if (!response.ok) return null
            const pin = await response.json() as { message_id?: string } | null
            return pin?.message_id ?? null
          }))
          setPinnedMessageIds(new Set(pins.filter((id): id is string => Boolean(id))))
        }
        setHasMoreMessages(!isGroupConversation && Boolean(data.has_more))
        setNextMessageCursor(!isGroupConversation ? (data.next_cursor ?? null) : null)
        const latestMessage = normalizedMessages.at(-1)
        if (latestMessage) {
          const readStateUrl = isGroupConversation && groupId
            ? `/api/groups/${groupId}/chat/read-state`
            : `/api/messages/direct/${activeConversationId}/read-state`
          const readStateBody = isGroupConversation
            ? { channel_id: activeConversationId, last_read_at: latestMessage.createdAt }
            : { last_read_message_id: latestMessage.id }
          await fetch(readStateUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(readStateBody),
            signal: historyController.signal,
          })
          setUnreadConversations((current) =>
            current.filter((conversation) => conversation.id !== activeConversationId)
          )
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        if (historyController.signal.aborted) return
        setMessages([])
        setMessageLoadError('Unable to load messages. Please try again.')
      })
      .finally(() => {
        if (!historyController.signal.aborted) setLoadingMessages(false)
      })

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
          table: isGroupConversation ? 'group_chat_messages' : 'direct_conversation_messages',
          filter: `${isGroupConversation ? 'channel_id' : 'conversation_id'}=eq.${activeConversationId}`,
        },
        (payload) => {
          const message = isGroupConversation
            ? normalizeGroupMessage(payload.new as Parameters<typeof normalizeGroupMessage>[0])
            : normalizeDirectMessage(payload.new as Parameters<typeof normalizeDirectMessage>[0])
          setMessages((current) =>
            appendUniqueMessage(current, message)
          )
          if (message.senderId !== userId && !isGroupConversation) {
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConnectionError(false)
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setConnectionError(true)
        }
      })
    channelRef.current = channel
    return () => {
      historyController.abort()
      channelRef.current = null
      void client.removeChannel(channel)
    }
  }, [activeConversationId, userId, open, messageLoadAttempt, reconnectAttempt])

  useEffect(() => {
    const activeConversation = conversations.find(
      (conversation) => conversation.id === activeConversationId
    )
    if (!activeConversation?.groupId) {
      setGroupMembers([])
      return
    }
    void fetch(`/api/messages/group/${activeConversation.groupId}/members`, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : []))
      .then((members) => setGroupMembers(members as Friend[]))
  }, [activeConversationId, conversations])

  const openConversation = async (friendId: string) => {
    setOpen(true)
    setMobileConversationOpen(true)
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
        : [
            ...current,
            {
              id: conversation.id,
              kind: 'direct',
              participantId: friendId,
              title: null,
              latestMessagePreview: null,
              latestMessageAt: null,
            },
          ]
    )
    setActiveConversationId(conversation.id)
  }

  const send = async (body: string): Promise<boolean> => {
    if (!activeConversationId || !body.trim()) return false
    const activeConversation = conversations.find(
      (conversation) => conversation.id === activeConversationId
    )
    const isGroupConversation = activeConversation?.kind === 'messenger_group'
    const groupId = activeConversation?.groupId
    if (isGroupConversation && !groupId) return false
    const trimmedBody = body.trim()
    // Optimistic update: show the message immediately, replace with the
    // server response (or remove on failure) without waiting on realtime.
    const optimisticId = `optimistic-${Date.now()}`
    const optimisticMessage: MessengerMessage = {
      id: optimisticId,
      senderId: userId ?? '',
      body: trimmedBody,
      createdAt: new Date().toISOString(),
      deletedAt: null,
      readAt: null,
      readBy: null,
      mentionUserIds,
      ...(replyingToMessageId ? { replyToMessageId: replyingToMessageId } : {}),
    }
    setMessages((current) => [...current, optimisticMessage])
    try {
      const response = await fetch(
        isGroupConversation
          ? `/api/groups/${groupId}/chat`
          : `/api/messages/direct/${activeConversationId}`,
        {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isGroupConversation
            ? { channel_id: activeConversationId, message: trimmedBody }
            : {
                body: trimmedBody,
                mention_user_ids: mentionUserIds,
                ...(replyingToMessageId ? { reply_to_message_id: replyingToMessageId } : {}),
              }
        ),
        }
      )
      if (!response.ok) throw new Error('Send failed')
      const responseData = await response.json()
      const saved = isGroupConversation
        ? normalizeGroupMessage(responseData as Parameters<typeof normalizeGroupMessage>[0])
        : normalizeDirectMessage(responseData as Parameters<typeof normalizeDirectMessage>[0])
      setMessages((current) =>
        current.map((message) => (message.id === optimisticId ? saved : message))
      )
      lastSentMessageIdRef.current = saved.id
      setReplyingToMessageId(null)
      setMentionUserIds([])
      return true
    } catch {
      // Roll back the optimistic message; returning false keeps the draft.
      setMessages((current) => current.filter((message) => message.id !== optimisticId))
      return false
    }
  }

  const uploadDirectAttachments = async (messageId: string, files: File[]) => {
    if (!activeConversationId || activeConversation?.kind !== 'direct') return
    const uploadedAttachments = await Promise.all(files.map(async (file) => {
      const formData = new FormData()
      formData.set('file', file)
      formData.set('message_id', messageId)
      const response = await fetch(`/api/messages/direct/${activeConversationId}/attachments`, {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) return null
      return await response.json() as {
        id: string
        file_name: string
        mime_type: string
        file_size: number
      }
    }))
    const attachments = uploadedAttachments.filter((attachment): attachment is NonNullable<typeof attachment> => Boolean(attachment))
    if (attachments.length) {
      setMessages((current) => current.map((message) => message.id === messageId
        ? {
            ...message,
            attachments: [
              ...(message.attachments ?? []),
              ...attachments.map((attachment) => ({
                id: attachment.id,
                fileName: attachment.file_name,
                mimeType: attachment.mime_type,
                fileSize: attachment.file_size,
              })),
            ],
          }
        : message
      ))
    }
  }

  const searchGifs = useMemo(
    () => async (query: string): Promise<ChatComposerGif[]> => {
      const response = query.toLowerCase() === 'trending'
        ? await giphyFetch.trending({ offset: 0, limit: 12, rating: 'pg-13' })
        : await giphyFetch.search(query, { offset: 0, limit: 12, rating: 'pg-13', lang: 'en' })
      return response.data.flatMap((gif) => {
        const url = gif.images.fixed_width?.url || gif.images.original?.url
        return url ? [{ id: String(gif.id), title: gif.title || 'GIF', url }] : []
      })
    },
    [giphyFetch]
  )

  const searchStickers = useMemo(
    () => async (query: string): Promise<ChatComposerGif[]> => {
      const response = await giphyFetch.search(query === 'trending' ? 'popular' : query, {
        offset: 0,
        limit: 12,
        rating: 'pg-13',
        lang: 'en',
        type: 'stickers',
      })
      return response.data.flatMap((sticker) => {
        const url = sticker.images.fixed_width?.url || sticker.images.original?.url
        return url ? [{ id: String(sticker.id), title: sticker.title || 'Sticker', url }] : []
      })
    },
    [giphyFetch]
  )

  const leaveActiveGroup = async () => {
    const activeConversation = conversations.find(
      (conversation) => conversation.id === activeConversationId
    )
    if (!activeConversation?.groupId || leavingGroup || !userId) return
    setLeavingGroup(true)
    try {
      const response = await fetch(
        `/api/messages/group/${activeConversation.groupId}/members/${userId}`,
        { method: 'DELETE' }
      )
      if (!response.ok) return
      setConversations((current) => current.filter((item) => item.id !== activeConversation.id))
      setActiveConversationId(null)
      setMobileConversationOpen(false)
    } finally {
      setLeavingGroup(false)
    }
  }

  const activeConversationForPermissions = conversations.find(
    (conversation) => conversation.id === activeConversationId
  )
  const activeGroupId =
    activeConversationForPermissions?.kind === 'messenger_group'
      ? activeConversationForPermissions.groupId ?? null
      : null
  const { hasPermission: hasGroupPermission } = useGroupPermissions(
    activeGroupId,
    userId ?? undefined
  )
  const canInviteGroupMembers = Boolean(
    activeGroupId && hasGroupPermission('invite_members')
  )
  const groupMemberIds = new Set(groupMembers.map((member) => member.id))
  const inviteCandidates = friends.filter((friend) => !groupMemberIds.has(friend.id))

  const inviteGroupMember = async (memberId: string) => {
    if (!activeGroupId || !canInviteGroupMembers || invitingMemberId) return
    setInvitingMemberId(memberId)
    try {
      const response = await fetch(`/api/messages/group/${activeGroupId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitee_user_id: memberId }),
      })
      if (response.ok) {
        setGroupMembers((current) => current.filter((member) => member.id !== memberId))
      }
    } finally {
      setInvitingMemberId(null)
    }
  }

  const editDirectMessage = async (messageId: string) => {
    if (!activeConversationId || activeConversation?.kind !== 'direct') return
    const message = messages.find((item) => item.id === messageId)
    const body = window.prompt('Edit message', message?.body ?? '')?.trim()
    if (!body || body === message?.body) return
    const response = await fetch(
      `/api/messages/direct/${activeConversationId}/messages/${messageId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      }
    )
    if (!response.ok) return
    const updated = normalizeDirectMessage(
      (await response.json()) as Parameters<typeof normalizeDirectMessage>[0]
    )
    setMessages((current) => current.map((item) => (item.id === messageId ? { ...item, ...updated } : item)))
  }

  const deleteDirectMessage = async (messageId: string) => {
    if (!activeConversationId || activeConversation?.kind !== 'direct') return
    const response = await fetch(
      `/api/messages/direct/${activeConversationId}/messages/${messageId}`,
      { method: 'DELETE' }
    )
    if (!response.ok) return
    setMessages((current) =>
      current.map((item) => (item.id === messageId ? { ...item, deletedAt: new Date().toISOString() } : item))
    )
  }

  const reactToDirectMessage = async (messageId: string) => {
    if (!activeConversationId) return
    const isGroup = activeConversation?.kind === 'messenger_group'
    const groupId = activeConversation?.groupId
    if (isGroup && !groupId) return
    await fetch(
      isGroup
        ? `/api/groups/${groupId}/chat/reactions`
        : `/api/messages/direct/${activeConversationId}/reactions`,
      {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: messageId, reaction: '👍' }),
      }
    )
  }

  const copyDirectMessage = async (messageId: string) => {
    const message = messages.find((item) => item.id === messageId)
    if (!message?.body) return
    await navigator.clipboard.writeText(message.body)
  }

  const forwardMessageToFriend = async (friendId: string) => {
    if (!forwardingMessage) return
    const response = await fetch('/api/messages/direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: friendId }),
    })
    if (!response.ok) return
    const conversation = await response.json() as { id: string }
    const sendResponse = await fetch(`/api/messages/direct/${conversation.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: forwardingMessage.body }),
    })
    if (!sendResponse.ok) return
    setForwardingMessage(null)
    setConversations((current) => current.some((item) => item.id === conversation.id)
      ? current
      : [...current, {
        id: conversation.id,
        kind: 'direct',
        participantId: friendId,
        title: null,
        latestMessagePreview: forwardingMessage.body,
        latestMessageAt: new Date().toISOString(),
      }])
    setActiveConversationId(conversation.id)
    setMobileConversationOpen(true)
  }

  const toggleDirectMessagePin = async (messageId: string) => {
    if (!activeConversationId || activeConversation?.kind !== 'direct') return
    const pinned = pinnedMessageIds.has(messageId)
    const response = await fetch(`/api/messages/direct/${activeConversationId}/pins${pinned ? `?message_id=${messageId}` : ''}`, {
      method: pinned ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...(pinned ? {} : { body: JSON.stringify({ message_id: messageId }) }),
    })
    if (!response.ok) return
    setPinnedMessageIds((current) => {
      const next = new Set(current)
      if (pinned) next.delete(messageId)
      else next.add(messageId)
      return next
    })
  }

  const deleteDirectMessageForMe = async (messageId: string) => {
    if (!activeConversationId || activeConversation?.kind !== 'direct') return
    const response = await fetch(`/api/messages/direct/${activeConversationId}/deletions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: messageId }),
    })
    if (response.ok) setMessages((current) => current.filter((message) => message.id !== messageId))
  }

  const reportDirectMessage = async (messageId: string) => {
    if (!activeConversationId) return
    const reason = window.prompt('Why are you reporting this message?')?.trim()
    if (!reason) return
    await fetch(`/api/messages/direct/${activeConversationId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: messageId, reason }),
    })
  }

  const markActiveConversationUnread = async () => {
    if (!activeConversationId || !activeConversation) return
    const isGroupConversation = activeConversation.kind === 'messenger_group'
    const response = await fetch(
      isGroupConversation
        ? `/api/groups/${activeConversation.groupId}/chat/read-state`
        : `/api/messages/direct/${activeConversationId}/read-state`,
      {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: isGroupConversation
        ? JSON.stringify({ channel_id: activeConversationId, mark_unread: true })
        : JSON.stringify({ last_read_message_id: null }),
      }
    )
    if (!response.ok) return
    manuallyUnreadConversationIdsRef.current.add(activeConversationId)
    setUnreadConversations((current) => {
      const existing = current.find((conversation) => conversation.id === activeConversationId)
      if (existing) return current
      return [...current, { id: activeConversationId, unread_count: 1 }]
    })
  }

  const toggleActiveConversationMute = async () => {
    if (!activeConversationId || !activeConversation) return
    const nextMuted = !activeConversationMuted
    const response = await fetch(
      activeConversation.kind === 'messenger_group'
        ? `/api/messages/group/${activeConversationId}/settings`
        : `/api/messages/direct/${activeConversationId}/settings`,
      {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_muted: nextMuted }),
      }
    )
    if (response.ok) setActiveConversationMuted(nextMuted)
  }

  const toggleActiveConversationArchive = async () => {
    if (!activeConversationId || !activeConversation) return
    const nextArchived = !activeConversationArchived
    const response = await fetch(
      activeConversation.kind === 'messenger_group'
        ? `/api/messages/group/${activeConversationId}/settings`
        : `/api/messages/direct/${activeConversationId}/settings`,
      {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_archived: nextArchived }),
      }
    )
    if (!response.ok) return
    setActiveConversationArchived(nextArchived)
    setArchivedConversationIds((current) => {
      const next = new Set(current)
      if (nextArchived) next.add(activeConversationId)
      else next.delete(activeConversationId)
      return next
    })
  }

  const toggleActiveConversationRestriction = async () => {
    if (!activeConversationId || activeConversation?.kind !== 'direct') return
    const nextRestricted = !activeConversationRestricted
    const response = await fetch(`/api/messages/direct/${activeConversationId}/restriction`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restricted: nextRestricted }),
    })
    if (response.ok) setActiveConversationRestricted(nextRestricted)
  }

  const blockActiveParticipant = async () => {
    if (!activeFriend?.id || activeConversation?.kind !== 'direct') return
    if (!window.confirm(`Block ${activeFriend.name || 'this participant'}?`)) return
    const response = await fetch('/api/users/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: activeFriend.id }),
    })
    if (!response.ok) return
    setConversations((current) => current.filter((item) => item.id !== activeConversationId))
    setActiveConversationId(null)
    setMobileConversationOpen(false)
  }

  const replyingToMessage = messages.find((message) => message.id === replyingToMessageId)

  const loadOlderMessages = async () => {
    if (
      !activeConversationId ||
      activeConversation?.kind !== 'direct' ||
      !nextMessageCursor ||
      loadingOlderMessages
    ) return
    setLoadingOlderMessages(true)
    try {
      const response = await fetch(
        `/api/messages/direct/${activeConversationId}?limit=50&before=${encodeURIComponent(nextMessageCursor)}`,
        { cache: 'no-store' }
      )
      if (!response.ok) return
      const data = (await response.json()) as {
        messages?: Parameters<typeof normalizeDirectMessage>[0][]
        has_more?: boolean
        next_cursor?: string | null
      }
      const olderMessages = (data.messages ?? []).map(normalizeDirectMessage)
      const olderPins = await Promise.all(olderMessages.map(async (message) => {
        const response = await fetch(
          `/api/messages/direct/${activeConversationId}/pins?message_id=${encodeURIComponent(message.id)}`,
          { cache: 'no-store' }
        )
        if (!response.ok) return null
        const pin = await response.json() as { message_id?: string } | null
        return pin?.message_id ?? null
      }))
      setPinnedMessageIds((current) => new Set([
        ...current,
        ...olderPins.filter((id): id is string => Boolean(id)),
      ]))
      setMessages((current) => [
        ...olderMessages,
        ...current.filter((message) => !olderMessages.some((older) => older.id === message.id)),
      ])
      setHasMoreMessages(Boolean(data.has_more))
      setNextMessageCursor(data.next_cursor ?? null)
    } finally {
      setLoadingOlderMessages(false)
    }
  }

  if (authLoading || !user) {
    if (!authLoading) {
      window.sessionStorage.removeItem('authorsinfo:floating-chat:open')
      window.sessionStorage.removeItem('authorsinfo:floating-chat:conversation')
    }
    return null
  }

  const friendById = new Map(friends.map((friend) => [friend.id, friend]))
  const activeFriend = conversations.find(
    (conversation) => conversation.id === activeConversationId && conversation.kind === 'direct'
  )
    ? friendById.get(
        conversations.find((conversation) => conversation.id === activeConversationId)
          ?.participantId ?? ''
      )
    : null
  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId
  )
  const activeParticipant = activeConversation?.kind === 'messenger_group'
    ? {
        id: activeConversation.groupId ?? activeConversation.id,
        name: activeConversation.title,
        avatar_url: activeConversation.avatarUrl ?? null,
      }
    : activeFriend
  const railItems = conversations.map((conversation) => ({
    id: conversation.id,
    title: conversation.title,
    participant: friendById.get(conversation.participantId ?? '') ?? null,
    unreadCount:
      unreadConversations.find((item) => item.id === conversation.id)?.unread_count ??
      conversation.unreadCount,
    lastMessagePreview: conversation.latestMessagePreview,
    lastMessageAt: conversation.latestMessageAt,
  }))
  const normalizedSearch = conversationSearch.trim().toLowerCase()
  const filteredRailItems = normalizedSearch
    ? railItems.filter((item) => item.participant?.name?.toLowerCase().includes(normalizedSearch))
    : railItems
  const filteredFriends = normalizedSearch
    ? friends.filter((friend) =>
        `${friend.name ?? ''} ${friend.email ?? ''}`.toLowerCase().includes(normalizedSearch)
      )
    : friends
  const filteredByArchive = filteredRailItems.filter((item) => !archivedConversationIds.has(item.id))
  const visibleRailItems = conversationFilter === 'unread'
    ? filteredByArchive.filter((item) => Boolean(item.unreadCount))
    : conversationFilter === 'groups'
      ? filteredByArchive.filter((item) => conversations.find((conversation) => conversation.id === item.id)?.kind === 'messenger_group')
      : conversationFilter === 'communities'
        ? []
      : filteredByArchive
  const visibleContacts = conversationFilter === 'unread' || conversationFilter === 'groups' || conversationFilter === 'communities' ? [] : filteredFriends

  return (
    <div
      className={
        fullPage
          ? 'floating-chat floating-chat--full-page flex h-[calc(100vh-4rem)] w-full'
          : compactInbox
            ? 'floating-chat floating-chat--compact-inbox fixed right-4 top-16 z-[60] flex items-start gap-3'
            : 'floating-chat fixed bottom-5 right-5 z-50 flex items-end gap-3'
      }
    >
      {open ? (
        <section
          ref={compactInbox ? compactPanelRef : undefined}
          className={
            fullPage
              ? 'floating-chat__panel floating-chat__panel--full-page relative flex h-full min-h-0 w-full flex-col overflow-hidden border-0 bg-background shadow-none'
              : compactInbox
                ? 'floating-chat__panel floating-chat__panel--compact-inbox relative flex h-[calc(100vh-4rem-30px)] max-h-[calc(100vh-4rem-30px)] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border bg-background shadow-2xl'
                : 'floating-chat__panel relative flex h-[min(32rem,calc(100vh-6rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border bg-background shadow-2xl'
          }
        >
          {activeConversationId || fullPage || !compactInbox ? <ConversationHeader
            participant={activeParticipant ?? null}
            title={activeConversation?.title ?? (fullPage || open ? 'Messenger' : undefined)}
            presenceLabel={open && activeConversationId ? 'Active conversation' : undefined}
            connectionLabel={connectionError ? 'Connection lost' : undefined}
            showMinimize={!fullPage}
            showClose={!fullPage}
            showBack={fullPage}
            onBack={() => setMobileConversationOpen(false)}
            onReconnect={
              connectionError ? () => setReconnectAttempt((attempt) => attempt + 1) : undefined
            }
            onMarkUnread={activeConversation ? () => void markActiveConversationUnread() : undefined}
            onBlock={activeConversation?.kind === 'direct' ? () => void blockActiveParticipant() : undefined}
            isMuted={activeConversationMuted}
            onToggleMute={activeConversation ? () => void toggleActiveConversationMute() : undefined}
            isArchived={activeConversationArchived}
            onToggleArchive={activeConversation ? () => void toggleActiveConversationArchive() : undefined}
            isRestricted={activeConversationRestricted}
            onToggleRestrict={activeConversation?.kind === 'direct' ? () => void toggleActiveConversationRestriction() : undefined}
            onAudioCall={callCapabilityReady && activeConversation?.kind === 'direct'
              ? () => void directCall.startCall('audio')
              : undefined}
            onVideoCall={callCapabilityReady && activeConversation?.kind === 'direct'
              ? () => void directCall.startCall('video')
              : undefined}
            onMinimize={() => {
              if (activeConversationId) {
                setMinimizedConversationIds((current) => [
                  activeConversationId,
                  ...current.filter((id) => id !== activeConversationId),
                ])
              }
              setOpen(false)
            }}
            onClose={() => {
              setOpen(false)
              setActiveConversationId(null)
              setMinimizedConversationIds([])
            }}
          /> : (
            <div className="floating-chat__compact-header border-b bg-background px-3 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Chats</h2>
                <TooltipProvider delayDuration={300}>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" aria-label="More chat options" className="rounded-full" onClick={() => setCompactOptionsOpen((current) => !current)}>
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={8} className="z-[100] border-black !bg-black px-2 py-1 text-xs !text-white">More</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" aria-label="See all in Messenger" className="rounded-full" onClick={() => { setOpen(false); router.push('/messages') }}>
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={8} className="z-[100] border-black !bg-black px-2 py-1 text-xs !text-white">See all in Messenger</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" aria-label="New message" className="rounded-full" onClick={() => document.querySelector<HTMLInputElement>('[aria-label="Search Messenger"]')?.focus()}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={8} className="z-[100] border-black !bg-black px-2 py-1 text-xs !text-white">New message</TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
                {compactOptionsOpen ? (
                  <div role="menu" aria-label="Messenger options" className="absolute right-3 top-12 z-10 w-48 rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg">
                    <button type="button" role="menuitem" className="w-full rounded px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => { setConversationFilter('unread'); setCompactOptionsOpen(false) }}>Show unread chats</button>
                    <button type="button" role="menuitem" className="w-full rounded px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => { router.push('/messages'); setCompactOptionsOpen(false) }}>Open Messenger settings</button>
                  </div>
                ) : null}
              </div>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={conversationSearch} onChange={(event) => setConversationSearch(event.target.value)} placeholder="Search Messenger" aria-label="Search Messenger" className="h-9 rounded-full bg-muted pl-9" />
              </div>
              <div className="mt-2 flex gap-1" role="tablist" aria-label="Messenger categories">
                {(['all', 'unread', 'groups', 'communities'] as const).map((option) => (
                  <button key={option} type="button" role="tab" aria-selected={conversationFilter === option} onClick={() => setConversationFilter(option)} className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${conversationFilter === option ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {option === 'all' ? 'All' : option}
                  </button>
                ))}
              </div>
            </div>
          )}
          <DirectCallPanel
            status={directCall.status}
            mediaType={directCall.mediaType}
            localStream={directCall.localStream}
            remoteStream={directCall.remoteStream}
            error={directCall.error}
            onAccept={() => void directCall.acceptCall()}
            onDecline={() => void directCall.declineCall()}
            onEnd={() => void directCall.endCall()}
          />
          <div className={fullPage ? 'flex min-h-0 min-w-0 flex-1' : 'contents'}>
            {fullPage ? (
              <ConversationRail
                items={visibleRailItems}
                activeConversationId={activeConversationId}
                onSelect={(conversationId) => {
                  setActiveConversationId(conversationId)
                  setMobileConversationOpen(true)
                }}
                mobileVisible={!mobileConversationOpen}
                contacts={visibleContacts}
                onSelectContact={(friendId) => void openConversation(friendId)}
                searchValue={conversationSearch}
                onSearchChange={setConversationSearch}
                filter={conversationFilter}
                onFilterChange={setConversationFilter}
                messageRequests={messageRequests}
                currentUserId={userId}
                onAcceptRequest={(requestId) => void updateMessageRequest(requestId, 'accept')}
                onDeclineRequest={(requestId) => void updateMessageRequest(requestId, 'decline')}
                onCancelRequest={(requestId) => void updateMessageRequest(requestId, 'cancel')}
              />
            ) : null}
          <div className={`${fullPage ? 'flex min-w-0 flex-1 flex-col' : 'contents'} ${fullPage && !mobileConversationOpen ? 'hidden md:flex' : ''}`}>
          {activeConversationId ? (
            <>
              <DirectMessageList
                ref={messagesContainerRef}
                messages={messages}
                currentUserId={userId}
                participant={activeParticipant ?? null}
                typingUserNames={typingUserNames}
                loading={loadingMessages}
                onEdit={activeConversation?.kind === 'direct' ? (messageId) => void editDirectMessage(messageId) : undefined}
                onDelete={activeConversation?.kind === 'direct' ? (messageId) => void deleteDirectMessage(messageId) : undefined}
                onReaction={(messageId) => void reactToDirectMessage(messageId)}
                onCopy={(messageId) => void copyDirectMessage(messageId)}
                onReport={(messageId) => void reportDirectMessage(messageId)}
                onReply={setReplyingToMessageId}
                onForward={(messageId) => {
                  const message = messages.find((item) => item.id === messageId)
                  if (message) setForwardingMessage(message)
                }}
                pinnedMessageIds={pinnedMessageIds}
                onTogglePin={(messageId) => void toggleDirectMessagePin(messageId)}
                onDeleteForMe={(messageId) => void deleteDirectMessageForMe(messageId)}
                loadError={messageLoadError}
                conversationUnavailable={conversationUnavailable}
                onBackToInbox={() => {
                  setActiveConversationId(null)
                  setMobileConversationOpen(false)
                }}
                onRetry={() => {
                  setMessageLoadError(null)
                  setMessageLoadAttempt((attempt) => attempt + 1)
                }}
                hasMore={hasMoreMessages && activeConversation?.kind === 'direct'}
                loadingOlder={loadingOlderMessages}
                onLoadOlder={() => void loadOlderMessages()}
                className="floating-chat__messages"
              />
              <ChatComposer
                conversationId={activeConversationId}
                onSend={(body) => send(body)}
                onTyping={broadcastTypingEvent}
                mentionCandidates={friends.map((friend) => ({ id: friend.id, name: friend.name }))}
                onMentionIdsChange={setMentionUserIds}
                emojiOptions={['😀', '😂', '😍', '👍', '❤️', '🎉', '😢', '😮', '😡', '🙏']}
                gifSearch={searchGifs}
                onGifSelected={async (gif) => {
                  const response = await fetch(gif.url)
                  const blob = await response.blob()
                  const file = new File([blob], `${gif.id}.gif`, { type: 'image/gif' })
                  const sent = await send(`GIF: ${gif.title}`)
                  if (sent && lastSentMessageIdRef.current) {
                    await uploadDirectAttachments(lastSentMessageIdRef.current, [file])
                  }
                }}
                stickerSearch={searchStickers}
                onStickerSelected={async (sticker) => {
                  const response = await fetch(sticker.url)
                  const blob = await response.blob()
                  const file = new File([blob], `${sticker.id}.webp`, { type: blob.type || 'image/webp' })
                  const sent = await send(`Sticker: ${sticker.title}`)
                  if (sent && lastSentMessageIdRef.current) {
                    await uploadDirectAttachments(lastSentMessageIdRef.current, [file])
                  }
                }}
                onVoiceNoteSelected={async (file) => {
                  const sent = await send('Voice message')
                  if (sent && lastSentMessageIdRef.current) {
                    await uploadDirectAttachments(lastSentMessageIdRef.current, [file])
                  }
                }}
                onFilesSelected={async (files) => {
                  const body = files.map((file) => file.name).join(', ')
                  if (!body) return
                  const sent = await send(`Shared files: ${body}`)
                  if (sent && lastSentMessageIdRef.current) {
                    await uploadDirectAttachments(lastSentMessageIdRef.current, files)
                  }
                }}
                replyContext={replyingToMessage ? {
                  authorName: replyingToMessage.senderId === userId
                    ? 'yourself'
                    : activeFriend?.name || 'participant',
                  body: replyingToMessage.body,
                } : null}
                onCancelReply={() => setReplyingToMessageId(null)}
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
              {messageRequests.some((request) => request.status === 'pending') ? (
                <div className="mb-3 rounded-lg border bg-muted/30 p-3" aria-label="New message request">
                  <div className="flex items-center gap-3">
                    <Avatar name="Message request" alt="Message request" size="xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">New message request</p>
                      <p className="truncate text-xs text-muted-foreground">Review your pending message request</p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button type="button" size="sm" onClick={() => void updateMessageRequest(messageRequests.find((request) => request.status === 'pending')?.id ?? '', 'accept')}>Accept</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void updateMessageRequest(messageRequests.find((request) => request.status === 'pending')?.id ?? '', 'decline')}>Decline</Button>
                  </div>
                </div>
              ) : null}
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Recent chats
              </p>
              {visibleRailItems.map((item) => {
                const conversation = conversations.find((candidate) => candidate.id === item.id)
                if (!conversation) return null
                const friend = friendById.get(conversation.participantId ?? '')
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    className="floating-chat__conversation flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-muted"
                    onClick={() => {
                      setOpen(false)
                      window.dispatchEvent(new Event('authorsinfo:open-floating-chat'))
                      window.dispatchEvent(new CustomEvent('authorsinfo:open-floating-conversation', {
                        detail: { conversationId: conversation.id },
                      }))
                    }}
                  >
                    <span className="relative shrink-0">
                      <Avatar
                        src={friend?.avatar_url ?? undefined}
                        name={friend?.name ?? ''}
                        alt={friend?.name ?? 'Friend'}
                        size="xs"
                      />
                      {item.unreadCount ? (
                        <span
                          className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground ring-2 ring-background"
                          aria-label={`${item.unreadCount} unread messages`}
                        >
                          {item.unreadCount > 99 ? '99+' : item.unreadCount}
                        </span>
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{friend?.name || conversation.title || 'Private conversation'}</span>
                      {conversation.latestMessagePreview ? <span className="block truncate text-xs text-muted-foreground">{conversation.latestMessagePreview}</span> : null}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      {conversation.latestMessageAt ? <span className="text-[10px] text-muted-foreground">{new Date(conversation.latestMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span> : null}
                      {item.unreadCount ? <span className="h-2 w-2 rounded-full bg-primary" aria-label={`${item.unreadCount} unread`} /> : null}
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
                  onClick={() => {
                    setOpen(false)
                    window.dispatchEvent(new Event('authorsinfo:open-floating-chat'))
                    window.dispatchEvent(new CustomEvent('authorsinfo:open-floating-friend', {
                      detail: { friendId: friend.id },
                    }))
                  }}
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
          </div>
          {!activeConversationId && compactInbox ? (
            <button type="button" className="border-t bg-background px-3 py-3 text-center text-sm font-semibold text-primary hover:bg-muted" onClick={() => router.push('/messages')}>
              See all in Messenger
            </button>
          ) : null}
          {fullPage ? (
            <ParticipantDetailsPanel
              participant={activeParticipant ?? null}
              members={groupMembers}
              groupTitle={activeConversation?.kind === 'messenger_group' ? activeConversation.title : null}
              historyPolicy={activeConversation?.kind === 'messenger_group' ? activeConversation.historyPolicy : null}
              description={activeConversation?.kind === 'messenger_group' ? 'Group conversation' : undefined}
              canLeave={activeConversation?.kind === 'messenger_group'}
              onLeave={() => void leaveActiveGroup()}
              leaving={leavingGroup}
              canInvite={canInviteGroupMembers}
              inviteCandidates={inviteCandidates}
              onInviteMember={(memberId) => void inviteGroupMember(memberId)}
              invitingMemberId={invitingMemberId}
              canMarkUnread={Boolean(activeConversation)}
              onMarkUnread={() => void markActiveConversationUnread()}
              canBlock={activeConversation?.kind === 'direct'}
              onBlock={() => void blockActiveParticipant()}
              canMute={Boolean(activeConversation)}
              onToggleMute={() => void toggleActiveConversationMute()}
              isMuted={activeConversationMuted}
              canArchive={Boolean(activeConversation)}
              onToggleArchive={() => void toggleActiveConversationArchive()}
              isArchived={activeConversationArchived}
              canRestrict={activeConversation?.kind === 'direct'}
              isRestricted={activeConversationRestricted}
              onToggleRestrict={() => void toggleActiveConversationRestriction()}
            />
          ) : null}
          {forwardingMessage ? (
            <div className="absolute inset-x-4 bottom-20 z-10 rounded-lg border bg-background p-3 shadow-xl">
              <p className="text-sm font-semibold">Forward message</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{forwardingMessage.body}</p>
              <div className="mt-3 grid max-h-40 gap-1 overflow-y-auto">
                {friends.map((friend) => (
                  <button
                    key={friend.id}
                    type="button"
                    className="rounded p-2 text-left text-sm hover:bg-muted"
                    onClick={() => void forwardMessageToFriend(friend.id)}
                  >
                    {friend.name || friend.email || 'Friend'}
                  </button>
                ))}
              </div>
              <button type="button" className="mt-2 text-xs text-muted-foreground" onClick={() => setForwardingMessage(null)}>
                Cancel
              </button>
            </div>
          ) : null}
          </div>
        </section>
      ) : null}
      {!fullPage && !compactInbox ? <div className="floating-chat__launcher-stack relative">
        <div className="floating-chat__unread-stack absolute bottom-full right-0 mb-3 flex flex-col items-end gap-2">
          {/* Minimized conversation avatar — clicking it reopens the chat */}
          {minimizedConversationIds.filter((minimizedId) => minimizedId !== activeConversationId).map((minimizedId) => {
            const minimizedConversation = conversations.find((conversation) => conversation.id === minimizedId)
            const friend = friendById.get(minimizedConversation?.participantId ?? '')
            if (!friend) return null
            const unread = unreadConversations.find((conversation) => conversation.id === minimizedId)
            return (
              <button
                key={minimizedId}
                type="button"
                className="floating-chat__minimized-conversation relative rounded-full shadow-lg"
                onClick={() => {
                  setActiveConversationId(minimizedId)
                  setOpen(true)
                }}
                aria-label={`Open chat with ${friend.name || 'friend'}`}
                title={`Chat with ${friend.name || 'friend'}`}
              >
                <Avatar
                  src={friend.avatar_url ?? undefined}
                  name={friend.name ?? ''}
                  alt={friend.name || 'Friend'}
                  size="sm"
                  className="floating-chat__minimized-avatar ring-2 ring-background"
                />
                {unread && unread.unread_count > 0 ? (
                  <span className="floating-chat__unread-badge absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold text-destructive-foreground">
                    {unread.unread_count > 99 ? '99+' : unread.unread_count}
                  </span>
                ) : null}
              </button>
            )
          })}
          {unreadConversations
            .filter((conversation) => open || conversation.id !== activeConversationId)
            .map((conversation) => {
              const unreadConversation = conversations.find((item) => item.id === conversation.id)
              const friend = friendById.get(unreadConversation?.participantId ?? '')
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
          onClick={() => {
            setActiveConversationId(null)
            setMobileConversationOpen(false)
            setOpen(true)
          }}
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div> : null}
    </div>
  )
}
