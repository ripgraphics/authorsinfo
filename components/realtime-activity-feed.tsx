'use client'

import { useEffect } from 'react'
import { useRealtimeStore } from '@/lib/stores/realtime-store'
import { useAuth } from '@supabase/auth-helpers-react'

export function RealtimeActivityFeed() {
  const { session } = useAuth()
  const { activityFeed, initialize } = useRealtimeStore()

  useEffect(() => {
    if (session?.user?.id) {
      initialize(session.user.id)
    }
  }, [session?.user?.id, initialize])

  return (
    <div className="space-y-4">
      {activityFeed.map((activity) => (
        <div key={activity.id} className="p-4 border rounded-lg hover:bg-gray-50">
          <h3 className="font-medium text-sm">{activity.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
          <p className="text-xs text-gray-400 mt-2">
            {new Date(activity.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
      {activityFeed.length === 0 && (
        <p className="text-center text-gray-500 py-8">No activities yet</p>
      )}
    </div>
  )
}
