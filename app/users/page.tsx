import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

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
      <div className="py-6">
        <h1 className="text-3xl font-bold tracking-tight">All Users</h1>
        <p className="text-muted-foreground mt-2">Browse and discover users from our community.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {users?.map((user: any) => (
          <Link
            key={user.id}
            href={user.permalink ? `/profile/${user.permalink}` : `/profile/${user.id}`}
            className="block bg-white rounded-lg shadow hover:shadow-lg p-4 text-center transition-transform hover:scale-105"
          >
            <div className="mx-auto mb-4 w-16 h-16">
              <Avatar className="w-full h-full">
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            <h2 className="font-medium truncate">{user.name}</h2>
          </Link>
        ))}
      </div>
    </div>
  )
} 