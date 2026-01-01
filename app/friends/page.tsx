import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getFriends } from '@/lib/friends-server'
import { FriendList } from '@/components/friend-list'
import { redirect } from 'next/navigation'

interface FriendsPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    sort?: string
  }>
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

async function FriendsContent({ userId }: { userId: string }) {
  // Fetch friends server-side
  const friendsData = await getFriends(userId, 1, 100)
  const friends = friendsData.friends || []
  const totalCount = friendsData.count || friends.length

  return (
    <FriendList
      userId={userId}
      initialFriends={friends}
      initialCount={totalCount}
    />
  )
}

export default async function FriendsPage({ searchParams }: FriendsPageProps) {
  const user = await getAuthenticatedUser()

  // Require authentication
  if (!user) {
    redirect('/login?redirect=/friends')
  }

  return (
    <div className="space-y-6">
      <div className="py-6">
        <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your friends and connections.
        </p>
      </div>
      <Suspense fallback={<div>Loading friends...</div>}>
        <FriendsContent userId={user.id} />
      </Suspense>
    </div>
  )
}
