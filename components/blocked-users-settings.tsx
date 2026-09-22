'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

type BlockedUser = {
  id: string
  blocked_user_id: string
  user?: { name?: string | null; email?: string | null } | null
}

export function BlockedUsersSettings() {
  const { toast } = useToast()
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [unblockingId, setUnblockingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/users/block/list', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load blocked users')
        return (await response.json()) as BlockedUser[]
      })
      .then((data) => {
        if (!cancelled) setBlockedUsers(data)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast({
            title: 'Unable to load blocked users',
            description: error instanceof Error ? error.message : 'Please try again.',
            variant: 'destructive',
          })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [toast])

  const unblock = async (blockedUserId: string) => {
    setUnblockingId(blockedUserId)
    try {
      const response = await fetch('/api/users/block', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: blockedUserId }),
      })
      if (!response.ok) throw new Error('Unable to unblock user')
      setBlockedUsers((current) => current.filter((item) => item.blocked_user_id !== blockedUserId))
      toast({ title: 'User unblocked' })
    } catch (error: unknown) {
      toast({
        title: 'Unable to unblock user',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setUnblockingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blocked Users</CardTitle>
        <CardDescription>Manage people you have blocked. Unblocking restores future discovery and interaction eligibility.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading blocked users...
          </div>
        ) : blockedUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">You have not blocked anyone.</p>
        ) : (
          <div className="space-y-3">
            {blockedUsers.map((item) => {
              const label = item.user?.name || item.user?.email || 'User'
              return (
                <div key={item.id} className="flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{label}</p>
                    {item.user?.email && <p className="text-sm text-muted-foreground">{item.user.email}</p>}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void unblock(item.blocked_user_id)}
                    disabled={unblockingId === item.blocked_user_id}
                  >
                    {unblockingId === item.blocked_user_id ? 'Unblocking...' : 'Unblock'}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
