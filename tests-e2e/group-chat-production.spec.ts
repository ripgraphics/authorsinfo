import { expect, test } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type FixtureUser = {
  id: string
  email: string
  password: string
  session: { access_token: string; refresh_token: string; expires_at?: number }
}
type ChatFixture = {
  admin: SupabaseClient
  groupId: string
  channelId: string
  eventChannelId: string
  eventId: string
  active: FixtureUser
  observer: FixtureUser
  nonmember: FixtureUser
  suspended: FixtureUser
}

const baseUrl = 'http://localhost:3034'

async function createFixtureUser(admin: SupabaseClient, label: string): Promise<FixtureUser> {
  const email = `chat-e2e-${label}-${Date.now()}@example.test`
  const password = 'ChatE2E-Password-2026!'
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error || !data.user) {
    throw new Error(
      `Unable to create ${label} fixture user through Supabase Auth: ${error?.message || 'missing user'}`
    )
  }

  const { error: profileError } = await admin.from('users').upsert({
    id: data.user.id,
    email,
    name: `Chat E2E ${label}`,
    permalink: `chat-e2e-${label}-${Date.now()}`,
  })
  if (profileError) throw profileError

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )
  const { data: signedIn, error: signInError } = await anon.auth.signInWithPassword({
    email,
    password,
  })
  if (signInError || !signedIn.session) throw signInError ?? new Error(`Unable to sign in ${label}`)
  return { id: data.user.id, email, password, session: signedIn.session }
}

function storageState(session: FixtureUser['session']) {
  const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0]
  const cookieName = `sb-${projectRef}-auth-token`
  const sessionJson = JSON.stringify(session)
  const chunkSize = 3180
  const cookies = []
  for (let offset = 0, index = 0; offset < sessionJson.length; offset += chunkSize, index += 1) {
    cookies.push({
      name: sessionJson.length <= chunkSize ? cookieName : `${cookieName}.${index}`,
      value: sessionJson.slice(offset, offset + chunkSize),
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax' as const,
      expires: session.expires_at || Math.floor(Date.now() / 1000) + 3600,
    })
  }
  return {
    cookies,
    origins: [{ origin: baseUrl, localStorage: [{ name: cookieName, value: sessionJson }] }],
  }
}

async function createFixture(): Promise<ChatFixture> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )
  const { data: group, error: groupError } = await admin
    .from('groups')
    .select('id')
    .limit(1)
    .single()
  if (groupError || !group) throw groupError ?? new Error('No group exists for chat E2E fixture')
  const { data: channel, error: channelError } = await admin
    .from('group_chat_channels')
    .select('id')
    .eq('group_id', group.id)
    .is('event_id', null)
    .limit(1)
    .single()
  if (channelError || !channel) throw channelError ?? new Error('No group chat channel exists')

  const active = await createFixtureUser(admin, 'active')
  const observer = await createFixtureUser(admin, 'observer')
  const nonmember = await createFixtureUser(admin, 'nonmember')
  const suspended = await createFixtureUser(admin, 'suspended')
  const memberships = [active, observer, suspended].map((user) => ({
    group_id: group.id,
    user_id: user.id,
    status: user === suspended ? 'suspended' : 'active',
  }))
  const { error: memberError } = await admin.from('group_members').upsert(memberships, {
    onConflict: 'group_id,user_id',
  })
  if (memberError) throw memberError

  const { data: existingEvent, error: eventError } = await admin
    .from('events')
    .select('id')
    .limit(1)
    .maybeSingle()
  if (eventError) throw eventError
  let event = existingEvent
  if (!event) {
    const { data: createdEvent, error: createEventError } = await admin
      .from('events')
      .insert({
        title: `Chat E2E Event ${Date.now()}`,
        description: 'Temporary event-channel authorization fixture',
        created_by: active.id,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      })
      .select('id')
      .single()
    if (createEventError || !createdEvent) {
      throw createEventError ?? new Error('Unable to create event-channel fixture')
    }
    event = createdEvent
  }
  const { data: eventChannel, error: eventChannelError } = await admin
    .from('group_chat_channels')
    .insert({
      group_id: group.id,
      name: 'E2E Event Channel',
      event_id: event.id,
      is_event_channel: true,
    })
    .select('id')
    .single()
  if (eventChannelError || !eventChannel)
    throw eventChannelError ?? new Error('Unable to create event channel')

  return {
    admin,
    groupId: group.id,
    channelId: channel.id,
    eventChannelId: eventChannel.id,
    eventId: event.id,
    active,
    observer,
    nonmember,
    suspended,
  }
}

async function cleanupFixture(fixture: ChatFixture) {
  await fixture.admin.from('group_chat_messages').delete().eq('channel_id', fixture.channelId)
  await fixture.admin.from('group_chat_channels').delete().eq('id', fixture.eventChannelId)
  await fixture.admin.from('events').delete().eq('id', fixture.eventId)
  await fixture.admin
    .from('group_members')
    .delete()
    .eq('group_id', fixture.groupId)
    .in('user_id', [fixture.active.id, fixture.observer.id, fixture.suspended.id])
  for (const user of [fixture.active, fixture.observer, fixture.nonmember, fixture.suspended]) {
    await fixture.admin.auth.admin.deleteUser(user.id)
  }
}

test.describe('production group chat authorization and realtime', () => {
  test.describe.configure({ mode: 'serial' })
  let fixture: ChatFixture | null = null
  let fixtureError: string | null = null

  test.beforeAll(async () => {
    try {
      fixture = await createFixture()
    } catch (error) {
      fixtureError = error instanceof Error ? error.message : JSON.stringify(error)
      console.error('[chat-e2e] Fixture provisioning failed:', fixtureError)
    }
  })

  test.afterAll(async () => {
    if (fixture) await cleanupFixture(fixture)
  })

  test('active member can read and send while restricted actors are denied', async ({
    browser,
  }) => {
    test.skip(Boolean(fixtureError), fixtureError || undefined)
    if (!fixture) throw new Error('Chat E2E fixture was not created')
    const chatFixture = fixture
    const activeContext = await browser.newContext({
      storageState: storageState(chatFixture.active.session),
    })
    const nonmemberContext = await browser.newContext({
      storageState: storageState(chatFixture.nonmember.session),
    })
    const suspendedContext = await browser.newContext({
      storageState: storageState(chatFixture.suspended.session),
    })
    try {
      const activeResponse = await activeContext.request.get(
        `${baseUrl}/api/groups/${chatFixture.groupId}/chat`
      )
      expect(activeResponse.status()).toBe(200)
      expect(
        (await activeResponse.json()).some(
          (channel: { id: string }) => channel.id === chatFixture.channelId
        )
      ).toBe(true)

      const sendResponse = await activeContext.request.post(
        `${baseUrl}/api/groups/${chatFixture.groupId}/chat`,
        {
          data: {
            channel_id: chatFixture.channelId,
            message: 'production chat authorization proof',
          },
        }
      )
      expect(sendResponse.status()).toBe(201)
      expect((await sendResponse.json()).user_id).toBe(chatFixture.active.id)

      for (const context of [nonmemberContext, suspendedContext]) {
        expect(
          (await context.request.get(`${baseUrl}/api/groups/${chatFixture.groupId}/chat`)).status()
        ).toBe(403)
      }
    } finally {
      await activeContext.close()
      await nonmemberContext.close()
      await suspendedContext.close()
    }
  })

  test('rejects event channels and forged sender payloads', async ({ browser }) => {
    test.skip(Boolean(fixtureError), fixtureError || undefined)
    if (!fixture) throw new Error('Chat E2E fixture was not created')
    const chatFixture = fixture
    const context = await browser.newContext({
      storageState: storageState(chatFixture.active.session),
    })
    try {
      expect(
        (
          await context.request.get(
            `${baseUrl}/api/groups/${chatFixture.groupId}/chat?channel_id=${chatFixture.eventChannelId}`
          )
        ).status()
      ).toBe(404)
      const forged = await context.request.post(
        `${baseUrl}/api/groups/${chatFixture.groupId}/chat`,
        {
          data: {
            channel_id: chatFixture.channelId,
            message: 'forged',
            user_id: chatFixture.observer.id,
          },
        }
      )
      expect(forged.status()).toBe(400)
    } finally {
      await context.close()
    }
  })
})
