import { expect, test } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const baseUrl = 'http://localhost:3034'
test.describe.configure({ mode: 'serial' })

type FixtureUser = {
  id: string
  email: string
  session: { access_token: string; refresh_token: string; expires_at?: number }
}

function storageState(session: FixtureUser['session']) {
  const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0]
  const cookieName = `sb-${projectRef}-auth-token`
  const sessionJson = JSON.stringify(session)
  const cookies = []
  for (let offset = 0, index = 0; offset < sessionJson.length; offset += 3180, index += 1) {
    cookies.push({
      name: sessionJson.length <= 3180 ? cookieName : `${cookieName}.${index}`,
      value: sessionJson.slice(offset, offset + 3180),
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax' as const,
      expires: session.expires_at || Math.floor(Date.now() / 1000) + 3600,
    })
  }
  return { cookies, origins: [{ origin: baseUrl, localStorage: [{ name: cookieName, value: sessionJson }] }] }
}

async function createUser(admin: SupabaseClient, label: string): Promise<FixtureUser> {
  const email = `direct-block-e2e-${label}-${Date.now()}@example.test`
  const password = 'DirectBlockE2E-Password-2026!'
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (error || !data.user) throw error ?? new Error(`Unable to create ${label}`)
  const { error: profileError } = await admin.from('users').upsert({
    id: data.user.id,
    email,
    name: `Direct Block E2E ${label}`,
    permalink: `direct-block-e2e-${label}-${Date.now()}`,
  })
  if (profileError) throw profileError
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: signedIn, error: signInError } = await anon.auth.signInWithPassword({ email, password })
  if (signInError || !signedIn.session) throw signInError ?? new Error(`Unable to sign in ${label}`)
  return { id: data.user.id, email, session: signedIn.session }
}

test('blocks both sides of a direct conversation and restores access after unblock', async ({ browser }) => {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const blocker = await createUser(admin, 'blocker')
  const blocked = await createUser(admin, 'blocked')
  const lowId = blocker.id < blocked.id ? blocker.id : blocked.id
  const highId = blocker.id < blocked.id ? blocked.id : blocker.id
  const { data: conversation, error: conversationError } = await admin
    .from('direct_conversations')
    .insert({ user_low_id: lowId, user_high_id: highId })
    .select('id')
    .single()
  if (conversationError || !conversation) throw conversationError ?? new Error('Conversation fixture failed')

  const blockerContext = await browser.newContext({ storageState: storageState(blocker.session) })
  const blockedContext = await browser.newContext({ storageState: storageState(blocked.session) })
  try {
    const path = `${baseUrl}/api/messages/direct/${conversation.id}`
    const sentMessage = await blockerContext.request.post(path, { data: { body: 'before block' } })
    expect(sentMessage.status()).toBe(201)
    const sentMessageData = await sentMessage.json() as { id: string }
    expect((await blockedContext.request.get(path)).status()).toBe(200)
    expect((await blockedContext.request.get(`${path}/read-state`)).status()).toBe(200)
    expect((await blockedContext.request.post(`${path}/read-state`, {
      data: { last_read_message_id: sentMessageData.id },
    })).status()).toBe(200)

    const blockResponse = await blockerContext.request.post(`${baseUrl}/api/users/block`, {
      data: { user_id: blocked.id },
    })
    expect(blockResponse.status()).toBe(200)

    for (const context of [blockerContext, blockedContext]) {
      const history = await context.request.get(path)
      expect(history.status()).toBe(403)
      expect(await history.json()).toMatchObject({ code: 'blocked_user' })
      const send = await context.request.post(path, { data: { body: 'while blocked' } })
      expect(send.status()).toBe(403)
      expect(await send.json()).toMatchObject({ code: 'blocked_user' })
    }

    const unblockResponse = await blockerContext.request.delete(`${baseUrl}/api/users/block`, {
      data: { user_id: blocked.id },
    })
    expect(unblockResponse.status()).toBe(200)
    expect((await blockerContext.request.get(path)).status()).toBe(200)
  } finally {
    await blockerContext.close()
    await blockedContext.close()
    await admin.from('direct_conversations').delete().eq('id', conversation.id)
    await admin.from('blocks').delete().or(`and(user_id.eq.${blocker.id},blocked_user_id.eq.${blocked.id}),and(user_id.eq.${blocked.id},blocked_user_id.eq.${blocker.id})`)
    await admin.auth.admin.deleteUser(blocker.id)
    await admin.auth.admin.deleteUser(blocked.id)
  }
})

test('reconciles direct realtime delivery after a channel reconnect', async () => {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const sender = await createUser(admin, 'reconnect-sender')
  const observer = await createUser(admin, 'reconnect-observer')
  const lowId = sender.id < observer.id ? sender.id : observer.id
  const highId = sender.id < observer.id ? observer.id : sender.id
  const { data: conversation, error: conversationError } = await admin
    .from('direct_conversations')
    .insert({ user_low_id: lowId, user_high_id: highId })
    .select('id')
    .single()
  if (conversationError || !conversation) throw conversationError ?? new Error('Conversation fixture failed')

  const senderClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const observerClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  try {
    await senderClient.auth.setSession(sender.session)
    await observerClient.auth.setSession(observer.session)
    await senderClient.realtime.setAuth(sender.session.access_token)
    await observerClient.realtime.setAuth(observer.session.access_token)

    const receive = (expectedBody: string) => {
      let readyResolve: (() => void) | null = null
      let readyReject: ((error: Error) => void) | null = null
      const ready = new Promise<void>((resolve, reject) => {
        readyResolve = resolve
        readyReject = reject
      })
      const received = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${expectedBody}`)), 15000)
      observerClient
        .channel(`floating-direct-${conversation.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_conversation_messages',
          filter: `conversation_id=eq.${conversation.id}`,
        }, (payload) => {
          if ((payload.new as { body?: string }).body !== expectedBody) return
          clearTimeout(timeout)
          resolve()
        })
        .subscribe((status, error) => {
          if (status === 'SUBSCRIBED') readyResolve?.()
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            clearTimeout(timeout)
            const failure = error ?? new Error(`Reconnect channel ${status}`)
            readyReject?.(failure)
            reject(failure)
          }
        })
      })
      return { ready, received }
    }

    const firstMessage = 'before reconnect'
    const firstReceived = receive(firstMessage)
    await firstReceived.ready
    const firstSend = await senderClient.from('direct_conversation_messages').insert({
      conversation_id: conversation.id,
      sender_id: sender.id,
      body: firstMessage,
      mention_user_ids: [],
    })
    if (firstSend.error) throw firstSend.error
    await firstReceived.received
    await observerClient.removeAllChannels()

    const secondMessage = 'after reconnect'
    const secondReceived = receive(secondMessage)
    await secondReceived.ready
    const secondSend = await senderClient.from('direct_conversation_messages').insert({
      conversation_id: conversation.id,
      sender_id: sender.id,
      body: secondMessage,
      mention_user_ids: [],
    })
    if (secondSend.error) throw secondSend.error
    await secondReceived.received
    await observerClient.removeAllChannels()
  } finally {
    await senderClient.removeAllChannels()
    await observerClient.removeAllChannels()
    await admin.from('direct_conversation_messages').delete().eq('conversation_id', conversation.id)
    await admin.from('direct_conversations').delete().eq('id', conversation.id)
    await admin.auth.admin.deleteUser(sender.id)
    await admin.auth.admin.deleteUser(observer.id)
  }
})
