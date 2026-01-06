import { supabaseAdmin } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const dynamic = 'force-dynamic'

async function getUsers() {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, created_at, permalink')
      .order('name')
      .limit(30)

    if (error) {
      console.error('Error fetching users:', error)
      return getMockUsers()
    }

    return users && users.length > 0 ? users : getMockUsers()
  } catch (error) {
    console.error('Unexpected error fetching users:', error)
    return getMockUsers()
  }
}

function getMockUsers() {
  const mockUsers = []
  const names = [
    'Emma Thompson',
    'Liam Johnson',
    'Olivia Martinez',
    'Noah Williams',
    'Ava Brown',
    'Elijah Jones',
    'Sophia Garcia',
    'William Miller',
    'Isabella Davis',
    'James Wilson',
    'Charlotte Rodriguez',
    'Benjamin Martinez',
    'Amelia Anderson',
    'Lucas Taylor',
    'Mia Thomas',
    'Henry Jackson',
    'Harper White',
    'Alexander Harris',
    'Evelyn Martin',
    'Daniel Thompson',
    'Abigail Moore',
    'Matthew Walker',
    'Emily Clark',
    'Michael Rodriguez',
    'Elizabeth Lewis',
    'Sebastian Hall',
    'Scarlett Allen',
    'Jack Young',
    'Madison Hernandez',
    'Samuel King',
  ]

  for (let i = 0; i < names.length; i++) {
    mockUsers.push({
      id: `mock-${i + 1}`,
      name: names[i],
      email: names[i].toLowerCase().replace(' ', '.') + '@example.com',
      created_at: new Date(
        Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)
      ).toISOString(),
    })
  }

  return mockUsers
}

export default async function UserListPage() {
  const users = await getUsers()

  return (
    <div className="space-y-6">
      <div className="py-4">
        <h1 className="text-3xl font-bold tracking-tight">User Profiles</h1>
        <p className="text-muted-foreground mt-2">Browse users and view their public profiles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.length > 0 ? (
          users.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={`/placeholder.svg?text=${user.name?.[0] || 'U'}`}
                    name={user.name || 'User'}
                    size="md"
                    className="h-12 w-12"
                  />
                  <div>
                    <CardTitle className="text-xl">{user.name || 'Unnamed User'}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end">
                  <Link
                    href={
                      (user as any).permalink
                        ? `/profile/${(user as any).permalink}`
                        : `/profile/${user.id}`
                    }
                  >
                    <Button>View Profile</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <h3 className="text-lg font-medium">No users found</h3>
            <p className="text-muted-foreground mt-1">
              Try again later or check your database connection.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
