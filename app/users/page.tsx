import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { supabaseAdmin } from "@/lib/supabase"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default async function UsersPage() {
  // Fetch user id and name from the database
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, name')
    .order('name')

  if (error) {
    console.error('Error fetching users:', error)
    return <div className="users-page__error">Failed to load users.</div>
  }

  return (
    <div className="users-page">
      <PageHeader />

      <main className="users-page__container container mx-auto py-8">
        <h1 className="users-page__title text-2xl font-bold mb-6">All Users</h1>

        <div className="users-page__list grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {users?.map((user: any) => (
            <Link
              key={user.id}
              href={`/profile/${user.id}`}
              className="users-page__card block bg-white rounded-lg shadow hover:shadow-lg p-4 text-center"
            >
              <div className="users-page__avatar-wrapper mx-auto mb-4 w-16 h-16">
                <Avatar className="w-full h-full">
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>

              <h2 className="users-page__name font-medium truncate">{user.name}</h2>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
} 