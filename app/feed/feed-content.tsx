'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import EnterpriseTimelineActivities from '@/components/enterprise/enterprise-timeline-activities-optimized'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export function FeedContent() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: userData } } = await supabase.auth.getUser()
        setUser(userData)
      } catch (error) {
        console.error('Error getting user:', error)
    } finally {
      setIsLoading(false)
    }
  }

    getUser()
  }, [supabase])

  if (isLoading) {
        return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-32 bg-gray-200 rounded w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
              </div>
        )
  }

  if (!user) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Authentication Required</h3>
          <p className="text-red-600 mb-4">Please log in to view your feed.</p>
        </CardContent>
      </Card>
    )
  }

  // Use the optimized enterprise timeline component
  return (
    <EnterpriseTimelineActivities
      entityId={user.id}
      entityType="user"
      isOwnEntity={true}
      showAnalytics={true}
      enableModeration={true}
      enableAI={true}
      enableAudit={true}
      enableRealTime={true}
      enableCrossPosting={true}
      enableCollaboration={true}
      enableAICreation={true}
      enableSocialNetworking={true}
      enableMonetization={true}
      enableReadingProgress={true}
      enablePrivacyControls={true}
    />
  )
} 