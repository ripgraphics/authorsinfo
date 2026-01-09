import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

type PrivacySettings = {
  allow_public_reading_profile: boolean
  allow_friends_to_see_reading: boolean
  allow_followers_to_see_reading: boolean
}

type ReadingProgressRow = {
  id: string
  book_id: string | null
  status: string
  privacy_level: 'private' | 'friends' | 'followers' | 'public' | string
  allow_friends: boolean
  allow_followers: boolean
  updated_at: string | null
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing env.${name} (needed for e2e Supabase facts queries)`)
  }
  return value
}

export function createSupabaseAdminForE2E() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    throw new Error(
      'Missing Supabase URL. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL for e2e tests.'
    )
  }
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function getUserByPermalink(permalink: string) {
  const supabase = createSupabaseAdminForE2E()
  const { data, error } = await (supabase.from('users') as any)
    .select('id, name, email, permalink')
    .eq('permalink', permalink)
    .maybeSingle()

  if (error) throw error
  return data as { id: string; name: string | null; email: string | null; permalink: string | null } | null
}

export async function getUserPrivacySettings(userId: string): Promise<PrivacySettings | null> {
  const supabase = createSupabaseAdminForE2E()
  const { data, error } = await (supabase.from('user_privacy_settings') as any)
    .select('allow_public_reading_profile, allow_friends_to_see_reading, allow_followers_to_see_reading')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return {
    allow_public_reading_profile: data.allow_public_reading_profile === true,
    allow_friends_to_see_reading: data.allow_friends_to_see_reading === true,
    allow_followers_to_see_reading: data.allow_followers_to_see_reading === true,
  }
}

export async function getReadingProgressInProgress(userId: string): Promise<ReadingProgressRow[]> {
  const supabase = createSupabaseAdminForE2E()
  const { data, error } = await (supabase.from('reading_progress') as any)
    .select('id, book_id, status, privacy_level, allow_friends, allow_followers, updated_at')
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as ReadingProgressRow[]
}

export async function getExistingBooksCount(bookIds: string[]): Promise<number> {
  if (bookIds.length === 0) return 0
  const supabase = createSupabaseAdminForE2E()
  const { data, error } = await (supabase.from('books') as any).select('id').in('id', bookIds)
  if (error) throw error
  return (data ?? []).length
}

export async function checkIfFriends(viewerId: string, profileOwnerId: string): Promise<boolean> {
  const supabase = createSupabaseAdminForE2E()
  const { data, error } = await (supabase.from('user_friends') as any)
    .select('id')
    .or(
      `and(user_id.eq.${viewerId},friend_id.eq.${profileOwnerId},status.eq.accepted),and(user_id.eq.${profileOwnerId},friend_id.eq.${viewerId},status.eq.accepted)`
    )
    .maybeSingle()

  if (error) throw error
  return !!data
}

export async function checkIfFollowing(viewerId: string, profileOwnerId: string): Promise<boolean> {
  const supabase = createSupabaseAdminForE2E()

  const { data: targetType, error: targetTypeError } = await (supabase.from('follow_target_types') as any)
    .select('id')
    .eq('name', 'user')
    .maybeSingle()

  if (targetTypeError) throw targetTypeError
  if (!targetType?.id) return false

  const { data, error } = await (supabase.from('follows') as any)
    .select('id')
    .eq('follower_id', viewerId)
    .eq('following_id', profileOwnerId)
    .eq('target_type_id', targetType.id)
    .maybeSingle()

  if (error) throw error
  return !!data
}

export async function computeExpectedVisibleCurrentlyReadingCount(args: {
  profileOwnerId: string
  viewerId: string | null
}): Promise<number> {
  const [privacySettings, progress] = await Promise.all([
    getUserPrivacySettings(args.profileOwnerId),
    getReadingProgressInProgress(args.profileOwnerId),
  ])

  const isOwner = args.viewerId === args.profileOwnerId
  if (isOwner) {
    const bookIds = progress.map((rp) => rp.book_id).filter(Boolean) as string[]
    return await getExistingBooksCount(bookIds)
  }

  // User-level gate (matches the app logic)
  let canViewProgress = false
  if (!args.viewerId) {
    canViewProgress = privacySettings?.allow_public_reading_profile === true
  } else {
    const [isFriend, isFollower] = await Promise.all([
      checkIfFriends(args.viewerId, args.profileOwnerId),
      checkIfFollowing(args.viewerId, args.profileOwnerId),
    ])
    canViewProgress =
      privacySettings?.allow_public_reading_profile === true ||
      (privacySettings?.allow_friends_to_see_reading === true && isFriend) ||
      (privacySettings?.allow_followers_to_see_reading === true && isFollower)
  }

  if (!canViewProgress) return 0

  const viewerIsFriend = args.viewerId ? await checkIfFriends(args.viewerId, args.profileOwnerId) : false
  const viewerIsFollower = args.viewerId ? await checkIfFollowing(args.viewerId, args.profileOwnerId) : false

  const visibleProgress = progress.filter((rp) => {
    return (
      rp.privacy_level === 'public' ||
      (rp.allow_friends === true && viewerIsFriend) ||
      (rp.allow_followers === true && viewerIsFollower)
    )
  })

  const bookIds = visibleProgress.map((rp) => rp.book_id).filter(Boolean) as string[]
  return await getExistingBooksCount(bookIds)
}

export async function ensureE2EViewerUser(): Promise<{ email: string; password: string; id: string }> {
  const supabase = createSupabaseAdminForE2E()
  const password = 'password123'
  const email = `e2e.viewer.${Date.now()}@example.test`

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'E2E Viewer' },
  })
  if (createError || !created?.user?.id) throw createError ?? new Error('Failed to create e2e viewer user')

  // Ensure public.users row exists for app queries
  const { error: upsertError } = await (supabase.from('users') as any).upsert({
    id: created.user.id,
    email,
    name: 'E2E Viewer',
    permalink: `e2e.viewer.${Date.now()}`,
  })
  if (upsertError) throw upsertError

  return { email, password, id: created.user.id }
}
