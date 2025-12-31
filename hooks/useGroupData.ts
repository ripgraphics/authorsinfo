import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { getGroupInfo } from '@/utils/groupInfo'
import type { Group } from '@/types/group'

interface UseGroupDataProps {
  groupId: string
}

interface UseGroupDataReturn {
  group: Group | null
  isLoading: boolean
  error: Error | null
  updateGroup: (updates: Partial<Group>) => Promise<void>
  refreshGroup: () => Promise<void>
}

export function useGroupData({ groupId }: UseGroupDataProps): UseGroupDataReturn {
  const [group, setGroup] = useState<Group | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const fetchGroupData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const groupData = await getGroupInfo(groupId)
      setGroup(groupData)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch group data')
      setError(error)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateGroup = async (updates: Partial<Group>) => {
    try {
      setIsLoading(true)
      setError(null)
      // TODO: Implement update logic
      await fetchGroupData() // Refresh data after update
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update group')
      setError(error)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshGroup = async () => {
    await fetchGroupData()
  }

  useEffect(() => {
    fetchGroupData()
  }, [groupId])

  return {
    group,
    isLoading,
    error,
    updateGroup,
    refreshGroup,
  }
}
