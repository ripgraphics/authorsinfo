import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'
import { checkRateLimit } from '@/lib/rate-limit'
import { getBlockedUserIds, isBlockedByEitherUser } from '@/lib/messaging/blocking'

const conversationSchema = z
  .object({
    user_id: z.string().uuid().optional(),
    user_permalink: z.string().trim().min(1).max(200).optional(),
  })
  .strict()
  .refine((value) => Boolean(value.user_id || value.user_permalink), {
    message: 'Target user is required',
  })

type ConversationRow = {
  id: string
  user_low_id: string
  user_high_id: string
  created_at?: string | null
  last_message_at?: string | null
}

type LatestMessageRow = {
  conversation_id: string
  body: string
  created_at: string
}

interface ConversationQueryResult {
  data: ConversationRow | null
  error: unknown
}

interface ConversationQuery {
  select(columns: string): ConversationQuery
  eq(column: string, value: string): ConversationQuery
  order(column: string, options: { ascending: boolean }): ConversationQuery
  in(column: string, values: string[]): ConversationQuery
  limit(value: number): ConversationQuery
  maybeSingle(): Promise<ConversationQueryResult>
  single(): Promise<ConversationQueryResult>
  insert(value: Record<string, string>): ConversationQuery
  then<TResult1 = { data: ConversationRow[] | null; error: unknown }, TResult2 = never>(
    onfulfilled?:
      | ((value: {
          data: ConversationRow[] | null
          error: unknown
        }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
}

interface ConversationSupabaseClient {
  from(table: 'direct_conversations' | 'direct_conversation_messages' | 'users' | 'profiles' | 'images' | 'user_friends' | 'direct_message_requests'): ConversationQuery
}

function getConversationClient(context: AuthenticatedRoute): ConversationSupabaseClient {
  return context.supabase as unknown as ConversationSupabaseClient
}

export async function GET() {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response

    const { data, error } = await getConversationClient(authentication.context)
      .from('direct_conversations')
      .select('id, user_low_id, user_high_id, created_at, last_message_at')
      .order('last_message_at', { ascending: false })
    if (error) throw error

    const conversationRows = data ?? []
    const blockedUserIds = await getBlockedUserIds(authentication.context)
    const visibleConversationRows = conversationRows.filter((conversation) => {
      const participantId = conversation.user_low_id === authentication.context.user.id
        ? conversation.user_high_id
        : conversation.user_low_id
      return !blockedUserIds.has(participantId)
    })
    const participantIds = visibleConversationRows.map((conversation) =>
      conversation.user_low_id === authentication.context.user.id
        ? conversation.user_high_id
        : conversation.user_low_id
    )
    const participantRows = await Promise.all(
      participantIds.map(async (participantId) => {
        try {
          const { data: participant } = await getConversationClient(authentication.context)
            .from('users')
            .select('id, name, email')
            .eq('id', participantId)
            .maybeSingle()
          return participant as {
            id: string
            name?: string | null
            email?: string | null
          } | null
        } catch {
          return null
        }
      })
    )
    const participantsById = new Map(
      participantRows
        .filter(
          (participant): participant is NonNullable<typeof participant> => Boolean(participant)
        )
        .map((participant) => [participant.id, participant])
    )
    const { data: profiles, error: profilesError } = participantIds.length
      ? await getConversationClient(authentication.context)
        .from('profiles')
        .select('user_id, avatar_image_id')
        .in('user_id', participantIds)
      : { data: [], error: null }
    // Avatar enrichment is optional; a participant/RLS image lookup must not
    // make the entire authenticated conversation inbox fail.
    const avatarImageIds = (profiles ?? [])
      .map((profile) => (profile as { avatar_image_id?: string | null }).avatar_image_id)
      .filter((imageId): imageId is string => Boolean(imageId))
    const { data: images, error: imagesError } = avatarImageIds.length
      ? await getConversationClient(authentication.context)
        .from('images')
        .select('id, url')
        .in('id', avatarImageIds)
      : { data: [], error: null }
    const safeImages = imagesError ? [] : images ?? []
    const avatarByUserId = new Map<string, string | null>()
    const imageById = new Map(
      safeImages.map((image) => {
        const record = image as { id: string; url?: string | null }
        return [record.id, record.url ?? null]
      })
    )
    for (const profile of profiles ?? []) {
      const record = profile as unknown as { user_id: string; avatar_image_id?: string | null }
      avatarByUserId.set(record.user_id, record.avatar_image_id ? imageById.get(record.avatar_image_id) ?? null : null)
    }
    const conversationIds = visibleConversationRows.map((conversation) => conversation.id)
    const latestMessagesByConversation = new Map<string, LatestMessageRow>()
    if (conversationIds.length > 0) {
      const { data: latestMessages, error: latestMessagesError } = await getConversationClient(
        authentication.context
      )
        .from('direct_conversation_messages')
        .select('conversation_id, body, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })
        .limit(conversationIds.length * 100)
      if (latestMessagesError) throw latestMessagesError
      for (const message of (latestMessages ?? []) as unknown as LatestMessageRow[]) {
        if (!latestMessagesByConversation.has(message.conversation_id)) {
          latestMessagesByConversation.set(message.conversation_id, message)
        }
      }
    }

    const conversations = visibleConversationRows.map((conversation) => {
      const participantId = conversation.user_low_id === authentication.context.user.id
        ? conversation.user_high_id
        : conversation.user_low_id
      const participant = participantsById.get(participantId)
      return {
        ...conversation,
        participant_id: participantId,
        participant: participant
          ? { ...participant, avatar_url: avatarByUserId.get(participantId) ?? null }
          : null,
        last_message_preview: latestMessagesByConversation.get(conversation.id)?.body ?? null,
      }
    })
    return NextResponse.json(conversations, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load direct conversations', 500, false)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const rate = await checkRateLimit(`messaging:conversation:${authentication.context.user.id}`)
    if (!rate.success) {
      return NextResponse.json({ error: 'Too many conversation requests' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000))) },
      })
    }

    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }

    const input = conversationSchema.safeParse(await request.json().catch(() => null))
    if (!input.success) {
      return NextResponse.json({ error: 'Invalid conversation request' }, { status: 400 })
    }

    let targetUserId = input.data.user_id
    if (!targetUserId && input.data.user_permalink) {
      const { data: target, error: targetError } = await getConversationClient(
        authentication.context
      )
        .from('users')
        .select('id')
        .eq('user_permalink', input.data.user_permalink)
        .maybeSingle()
      if (targetError) throw targetError
      targetUserId = (target as { id?: string } | null)?.id
    }
    if (!targetUserId || targetUserId === authentication.context.user.id) {
      return NextResponse.json({ error: 'Invalid conversation target' }, { status: 400 })
    }
    if (await isBlockedByEitherUser(authentication.context, targetUserId)) {
      return NextResponse.json(
        { error: 'This user is unavailable', code: 'blocked_user' },
        { status: 403 }
      )
    }

    const userIds = [authentication.context.user.id, targetUserId].sort()
    const [userLowId, userHighId] = userIds
    const supabase = getConversationClient(authentication.context)
    const existing = await supabase
      .from('direct_conversations')
      .select('id, user_low_id, user_high_id')
      .eq('user_low_id', userLowId)
      .eq('user_high_id', userHighId)
      .maybeSingle()
    if (existing.error) throw existing.error
    if (existing.data) {
      const requestState = await supabase
        .from('direct_message_requests')
        .select('status, requester_id, recipient_id')
        .eq('conversation_id', existing.data.id)
        .maybeSingle()
      if (requestState.error) throw requestState.error
      return NextResponse.json({
        ...existing.data,
        ...(requestState.data
          ? { ...requestState.data, request_status: (requestState.data as { status?: string }).status }
          : {}),
      })
    }

    const friendship = await supabase
      .from('user_friends')
      .select('status')
      .eq('user_id', userLowId)
      .eq('friend_id', userHighId)
      .maybeSingle()
    if (friendship.error) throw friendship.error
    const reverseFriendship = await supabase
      .from('user_friends')
      .select('status')
      .eq('user_id', userHighId)
      .eq('friend_id', userLowId)
      .maybeSingle()
    if (reverseFriendship.error) throw reverseFriendship.error

    const created = await supabase
      .from('direct_conversations')
      .insert({ user_low_id: userLowId, user_high_id: userHighId })
      .select('id, user_low_id, user_high_id')
      .single()
    if (created.error) throw created.error

    const friendshipStatus = (friendship.data as { status?: string } | null)?.status
      ?? (reverseFriendship.data as { status?: string } | null)?.status
    if (friendshipStatus !== 'accepted') {
      const requestRecord = await supabase
        .from('direct_message_requests')
        .insert({
          conversation_id: created.data?.id ?? '',
          requester_id: authentication.context.user.id,
          recipient_id: targetUserId,
          status: 'pending',
        })
        .select('status, requester_id, recipient_id')
        .single()
      if (requestRecord.error) throw requestRecord.error
      return NextResponse.json({
        ...created.data,
        ...requestRecord.data,
        request_status: (requestRecord.data as { status?: string }).status,
      }, { status: 201 })
    }

    return NextResponse.json(created.data, { status: 201 })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to create direct conversation', 500, false)
  }
}
