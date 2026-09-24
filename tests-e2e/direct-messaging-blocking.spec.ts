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
    expect((await blockerContext.request.post(path, { data: { body: 'before block' } })).status()).toBe(201)
    expect((await blockedContext.request.get(path)).status()).toBe(200)

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
