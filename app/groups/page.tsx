"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

interface Group {
  id: string
  name: string
  description: string | null
  member_count: number
  created_at: string
  cover_image_url: string | null
}

export default function GroupsPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadGroups() {
      try {
        setLoading(true)
        setError(null)
        
        const { data: { user } } = await supabaseClient.auth.getUser()
        if (!user) {
          router.push('/auth/signin?redirect=/groups')
          return
        }

        let query = supabaseClient
          .from('groups')
          .select('*')
          .order('created_at', { ascending: false })

        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`)
        }

        const { data, error: groupsError } = await query

        if (groupsError) throw groupsError
        setGroups(data || [])
      } catch (err: any) {
        console.error('Error loading groups:', err)
        setError(err.message || 'Failed to load groups')
      } finally {
        setLoading(false)
      }
    }

    loadGroups()
  }, [router, searchQuery])

  return (
    <div className="space-y-6">
      <div className="py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
            <p className="text-muted-foreground mt-2">Join and participate in book-related communities.</p>
          </div>
          <Button onClick={() => router.push('/groups/create')}>
            Create Group
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Input
          type="search"
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-1/3" />
              </CardFooter>
            </Card>
          ))
        ) : groups.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            {searchQuery ? 'No groups found matching your search' : 'No groups available'}
          </div>
        ) : (
          groups.map((group) => (
            <Card 
              key={group.id} 
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/groups/${group.id}`)}
            >
              {group.cover_image_url && (
                <div className="h-48 w-full">
                  <img 
                    src={group.cover_image_url} 
                    alt={group.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle>{group.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {group.description || 'No description available'}
                </p>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-gray-500">
                  {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                </p>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}