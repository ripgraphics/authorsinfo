import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

const searchSchema = z
  .object({
    q: z.string().trim().min(1).max(200),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict()

type SearchMessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  edited_at: string | null
  deleted_at: string | null
}

interface SearchQuery {
  select(columns: string): SearchQuery
  eq(column: string, value: string): SearchQuery
  or(expression: string): SearchQuery
  in(column: string, values: string[]): SearchQuery
  is(column: string, value: null): SearchQuery
  order(column: string, options: { ascending: boolean }): SearchQuery
  limit(value: number): SearchQuery
  textSearch(column: string, query: string, options?: { type: string }): SearchQuery
  then<TResult1 = { data: SearchMessageRow[] | null; error: unknown }, TResult2 = never>(
    onfulfilled?:
      | ((value: {
          data: SearchMessageRow[] | null
          error: unknown
        }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
}

interface SearchClient {
  from(table: 'direct_conversations' | 'direct_conversation_messages'): SearchQuery
}

function getClient(context: AuthenticatedRoute): SearchClient {
  return context.supabase as unknown as SearchClient
}

export async function GET(request: NextRequest) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response

    const input = searchSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
    if (!input.success) {
      return NextResponse.json({ error: 'Invalid search request' }, { status: 400 })
    }

    const userId = authentication.context.user.id
    const { data: conversations, error: conversationError } = await getClient(
      authentication.context
    )
      .from('direct_conversations')
      .select('id, user_low_id, user_high_id')
      .or(`user_low_id.eq.${userId},user_high_id.eq.${userId}`)
    if (conversationError) throw conversationError

    const conversationIds = (conversations ?? []).map(
      (conversation) => (conversation as { id: string }).id
    )
    if (conversationIds.length === 0) return NextResponse.json([])

    const { data, error } = await getClient(authentication.context)
      .from('direct_conversation_messages')
      .select('id, conversation_id, sender_id, body, created_at, edited_at, deleted_at')
      .in('conversation_id', conversationIds)
      .is('deleted_at', null)
      .textSearch('body', input.data.q, { type: 'websearch' })
      .order('created_at', { ascending: false })
      .limit(input.data.limit)
    if (error) throw error

    return NextResponse.json(data ?? [], { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to search messages', 500, false)
  }
}
