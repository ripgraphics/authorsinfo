import { useEffect, useState } from 'react'
import { getFollowTargetTypes, FollowTargetTypeData } from '@/lib/follows'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function FollowTargetTypes() {
  const [types, setTypes] = useState<FollowTargetTypeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTypes() {
      const { types, error } = await getFollowTargetTypes()
      if (error) {
        setError(error)
      } else {
        setTypes(types)
      }
      setLoading(false)
    }

    loadTypes()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        <p>Error loading follow target types: {error}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {types.map((type) => (
        <Card key={type.id}>
          <CardHeader>
            <CardTitle className="capitalize">{type.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>{type.description}</CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 