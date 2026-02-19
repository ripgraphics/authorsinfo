/**
 * Playwright global setup – creates a Supabase test user, signs in,
 * and writes storageState.json with correct @supabase/ssr cookies
 * so every test context is pre-authenticated.
 */
const fs = require('fs')
const path = require('path')

// Ensure .auth dir + empty storageState exist synchronously so
// playwright.config.ts can reference the path safely.
const authDir = path.resolve(__dirname, '.auth')
const storageStatePath = path.join(authDir, 'storageState.json')
const emptyState = JSON.stringify({ cookies: [], origins: [] })

if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true })
if (!fs.existsSync(storageStatePath)) fs.writeFileSync(storageStatePath, emptyState)

module.exports = async () => {
  // Load .env.local (Next.js convention)
  try {
    require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') })
  } catch {
    // dotenv may not be available; env vars must be set externally
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
    console.warn('[global-setup] Missing Supabase env vars – writing empty storageState')
    fs.writeFileSync(storageStatePath, emptyState)
    return
  }

  // Extract project ref for Supabase SSR cookie name (sb-<ref>-auth-token)
  let projectRef
  try {
    projectRef = new URL(SUPABASE_URL).hostname.split('.')[0]
  } catch {
    console.warn('[global-setup] Invalid SUPABASE_URL – writing empty storageState')
    fs.writeFileSync(storageStatePath, emptyState)
    return
  }

  const { createClient } = require('@supabase/supabase-js')
  const email = `pw-e2e-${Date.now()}@test.example`
  const password = 'PwTest123!'

  // ── 1. Create user via admin API ──────────────────────────────────
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let userId = null
  try {
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: 'Playwright E2E' },
    })
    if (error) throw error
    userId = created?.user?.id
    console.log('[global-setup] Created test user:', email, 'id:', userId)
  } catch (err) {
    console.warn('[global-setup] createUser error (may exist):', err?.message || err)
  }

  // Ensure public.users row so app queries work
  if (userId) {
    try {
      await admin.from('users').upsert({
        id: userId,
        email,
        name: 'Playwright E2E',
        permalink: `pw-e2e-${Date.now()}`,
      })
    } catch {
      // non-critical
    }
  }

  // ── 2. Sign in to get session tokens ──────────────────────────────
  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const { data, error } = await anon.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (!data.session) throw new Error('No session returned from signIn')

    const session = data.session
    const cookieName = `sb-${projectRef}-auth-token`
    const sessionJson = JSON.stringify(session)

    // ── 3. Construct Supabase SSR cookies (chunked if >3180 chars) ──
    const CHUNK_SIZE = 3180
    const cookies = []

    if (sessionJson.length <= CHUNK_SIZE) {
      cookies.push({
        name: cookieName,
        value: sessionJson,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
        expires: session.expires_at || Math.floor(Date.now() / 1000) + 3600,
      })
    } else {
      let remaining = sessionJson
      let i = 0
      while (remaining.length > 0) {
        cookies.push({
          name: `${cookieName}.${i}`,
          value: remaining.substring(0, CHUNK_SIZE),
          domain: 'localhost',
          path: '/',
          httpOnly: false,
          secure: false,
          sameSite: 'Lax',
          expires: session.expires_at || Math.floor(Date.now() / 1000) + 3600,
        })
        remaining = remaining.substring(CHUNK_SIZE)
        i++
      }
    }

    // ── 4. Write storageState ───────────────────────────────────────
    const storage = {
      cookies,
      origins: [
        {
          origin: 'http://localhost:3034',
          localStorage: [{ name: cookieName, value: sessionJson }],
        },
      ],
    }

    fs.writeFileSync(storageStatePath, JSON.stringify(storage, null, 2))
    console.log(
      '[global-setup] Wrote storageState with',
      cookies.length,
      'cookie(s)'
    )
  } catch (err) {
    console.error('[global-setup] Sign-in error:', err?.message || err)
    fs.writeFileSync(storageStatePath, emptyState)
  }
}
