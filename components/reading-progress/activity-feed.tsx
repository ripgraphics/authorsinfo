'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getRecentReadingActivity, getFriendsReadingActivity } from '@/app/actions/reading-progress'
import { formatDistanceToNow } from 'date-fns'
import { BookOpen, User } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface ActivityFeedProps {
  type: 'user' | 'friends'
  limit?: number
  className?: string
}

export function ActivityFeed({ type, limit = 5, className }: ActivityFeedProps) {
  const [activity, setActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchActivity() {
      setLoading(true)
      setError(null)

      try {
        let result

        if (type === 'user') {
          result = await getRecentReadingActivity(limit)
        } else {
          result = await getFriendsReadingActivity(limit)
        }

        if (result.error) {
          setError(result.error)
        } else {
          setActivity(result.activity)
        }
      } catch (err) {
        console.error('Error fetching activity:', err)
        setError('Failed to load reading activity')
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [type, limit])

  // Helper function to format status
  const formatStatus = (status: string): string => {
    switch (status) {
      case 'not_started':
        return 'wants to read'
      case 'in_progress':
        return 'is currently reading'
      case 'completed':
        return 'finished reading'
      case 'on_hold':
        return 'put on hold'
      case 'abandoned':
        return 'abandoned'
      default:
        return status
    }
  }

  // Helper function to format activity message
  const formatActivity = (item: any): string => {
    if (type === 'user') {
      return `You ${formatStatus(item.status)} "${item.book_title}"`
    } else {
      return `${item.user_name} ${formatStatus(item.status)} "${item.book_title}"`
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>
            {type === 'user' ? 'Your Reading Activity' : "Friends' Reading Activity"}
          </CardTitle>
          <CardDescription>
            {type === 'user' ? 'Your recent reading updates' : 'See what your friends are reading'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className="animate-pulse bg-muted h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="animate-pulse bg-muted h-4 w-3/4 rounded-sm" />
                  <div className="animate-pulse bg-muted h-3 w-1/2 rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>
            {type === 'user' ? 'Your Reading Activity' : "Friends' Reading Activity"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            {error === 'User not authenticated'
              ? 'Please sign in to view reading activity'
              : error === 'No friends found' && type === 'friends'
                ? "You don't have any friends yet. Add friends to see their activity."
                : 'Failed to load reading activity. Please try again.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (activity.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>
            {type === 'user' ? 'Your Reading Activity' : "Friends' Reading Activity"}
          </CardTitle>
          <CardDescription>
            {type === 'user' ? 'Your recent reading updates' : 'See what your friends are reading'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            {type === 'user'
              ? "You haven't tracked any books yet. Start tracking your reading progress!"
              : 'No activity from your friends yet.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          {type === 'user' ? 'Your Reading Activity' : "Friends' Reading Activity"}
        </CardTitle>
        <CardDescription>
          {type === 'user' ? 'Your recent reading updates' : 'See what your friends are reading'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activity.map((item) => (
            <div key={item.id} className="flex items-start space-x-4">
              {type === 'friends' ? (
                <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-white shadow-md relative">
                  {item.user_avatar ? (
                    <Image
                      src={item.user_avatar}
                      alt={`${item.user_name} avatar`}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative h-10 w-10 overflow-hidden rounded-md">
                  {item.cover_image_url ? (
                    <Image
                      src={item.cover_image_url || '/placeholder.svg'}
                      alt={item.book_title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1 flex-1">
                <p className="text-sm">
                  {formatActivity(item)}
                  {item.percentage !== undefined &&
                    item.percentage > 0 &&
                    item.status === 'in_progress' && (
                      <span className="text-muted-foreground"> ({item.percentage}% complete)</span>
                    )}
                </p>

                <div className="flex items-center text-xs text-muted-foreground">
                  <Link href={`/books/${item.book_id}`} className="hover:underline mr-2">
                    View Book
                  </Link>
                  <span>•</span>
                  <span className="ml-2">
                    {item.updated_at &&
                      formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
