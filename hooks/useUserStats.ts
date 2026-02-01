'use client'

import { useState, useEffect, useCallback } from 'react'

export interface UserStats {
  booksRead: number
  friendsCount: number
  followersCount: number
  mutualFriendsCount?: number
  location: string | null
  website: string | null
  joinedDate: string
}

// Cache key includes currentUserId since mutualFriendsCount varies by viewer
const statsCache = new Map<string, { data: UserStats; timestamp: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function cacheKey(userId: string, currentUserId?: string | null) {
  return `${userId}::${currentUserId || 'anon'}`
}

function getCachedStats(userId: string, currentUserId?: string | null): UserStats | null {
  const key = cacheKey(userId, currentUserId)
  const cached = statsCache.get(key)
  if (!cached) return null
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    statsCache.delete(key)
    return null
  }
  return cached.data
}

function setCachedStats(userId: string, currentUserId: string | null | undefined, data: UserStats) {
  statsCache.set(cacheKey(userId, currentUserId), { data, timestamp: Date.now() })
}

export function useUserStats(
  userId: string | undefined,
  options?: { enabled?: boolean; currentUserId?: string | null }
) {
  const enabled = options?.enabled !== false
  const currentUserId = options?.currentUserId
  const [userStats, setUserStats] = useState<UserStats | null>(() =>
    userId ? getCachedStats(userId, currentUserId) : null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(
    async (id: string) => {
      const cached = getCachedStats(id, currentUserId)
      if (cached) {
        setUserStats(cached)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const url = currentUserId
          ? `/api/users/${id}/hover-data?currentUserId=${encodeURIComponent(currentUserId)}`
          : `/api/users/${id}/hover-data`
        const res = await fetch(url)
        if (!res.ok) throw new Error('Failed to fetch user stats')
        const json = await res.json()
        const stats: UserStats = {
          booksRead: json.stats?.booksRead ?? 0,
          friendsCount: json.stats?.friendsCount ?? 0,
          followersCount: json.stats?.followersCount ?? 0,
          mutualFriendsCount: json.stats?.mutualFriendsCount ?? 0,
          location: json.stats?.location ?? null,
          website: json.stats?.website ?? null,
          joinedDate: json.stats?.joinedDate ?? json.user?.created_at ?? '',
        }
        setCachedStats(id, currentUserId, stats)
        setUserStats(stats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setUserStats(null)
      } finally {
        setIsLoading(false)
      }
    },
    [currentUserId]
  )

  useEffect(() => {
    if (!userId || !enabled) return
    const cached = getCachedStats(userId, currentUserId)
    if (cached) {
      setUserStats(cached)
      return
    }
    fetchStats(userId)
  }, [userId, enabled, currentUserId, fetchStats])

  return { userStats, isLoading, error }
}
