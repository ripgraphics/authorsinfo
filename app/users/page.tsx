import { supabaseAdmin } from '@/lib/supabase'
import { UserCard } from './user-card'

export default async function UsersPage() {
  // Fetch user id, name, and permalink from the database
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, name, permalink')
    .order('name')

  if (error) {
    console.error('Error fetching users:', error)
    return <div className="users-page__error">Failed to load users.</div>
  }

  return (
    <div className="space-y-6">
      <div className="py-4">
        <h1 className="text-3xl font-bold tracking-tight">All Users</h1>
        <p className="text-muted-foreground mt-2">Browse and discover users from our community.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {users?.map((user: any) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  )
}
