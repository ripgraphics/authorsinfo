import { useState, useEffect, useCallback } from 'react'

interface UserStats {
  booksRead: number
  friendsCount: number
  followersCount: number
  location: string | null
  website: string | null
  joinedDate: string
  bio: string | null
}

interface BulkUserData {
  [userId: string]: UserStats
}

export function useBulkUserData(userIds: string[]) {
  const [userData, setUserData] = useState<BulkUserData>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBulkUserData = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/users/bulk-hover-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds: ids }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }

      const result = await response.json()
      
      // Convert array to map for easy lookup
      const userDataMap: BulkUserData = {}
      result.users.forEach((user: any) => {
        userDataMap[user.id] = user.stats
      })

      setUserData(prev => ({ ...prev, ...userDataMap }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching bulk user data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch data for new user IDs that we don't have yet
  useEffect(() => {
    const missingUserIds = userIds.filter(id => !userData[id])
    if (missingUserIds.length > 0) {
      fetchBulkUserData(missingUserIds)
    }
  }, [userIds, userData, fetchBulkUserData])

  const getUserStats = useCallback((userId: string): UserStats | null => {
    return userData[userId] || null
  }, [userData])

  const isUserDataLoaded = useCallback((userId: string): boolean => {
    return !!userData[userId]
  }, [userData])

  return {
    userData,
    isLoading,
    error,
    getUserStats,
    isUserDataLoaded,
    refetch: () => fetchBulkUserData(userIds)
  }
}
