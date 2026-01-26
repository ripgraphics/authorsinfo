/**
 * TagPreviewCard Component
 * Hover/expand UI showing entity metadata and quick actions
 */

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Hash, AtSign, User, Book, Users, Calendar, MapPin, ExternalLink, X, Bell, BellOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export interface TagPreviewData {
  id: string
  name: string
  slug: string
  type: 'user' | 'entity' | 'topic' | 'collaborator' | 'location' | 'taxonomy'
  avatarUrl?: string
  sublabel?: string
  description?: string
  metadata?: {
    entityId?: string
    entityType?: string
    bio?: string
    location?: string
    followers?: number
    posts?: number
    [key: string]: any
  }
}

export interface TagPreviewCardProps {
  tag: TagPreviewData
  position?: 'top' | 'bottom' | 'left' | 'right'
  onClose?: () => void
  className?: string
}

export function TagPreviewCard({
  tag,
  position = 'bottom',
  onClose,
  className,
}: TagPreviewCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Check subscription status for topic tags
  useEffect(() => {
    if (!user || tag.type !== 'topic' || subscriptionLoaded) return

    const checkSubscription = async () => {
      try {
        const response = await fetch(`/api/tags/subscribe?tagId=${encodeURIComponent(tag.id)}`)
        if (response.ok) {
          const data = await response.json()
          setIsSubscribed(data.subscriptions?.some((s: any) => s.tag_id === tag.id) || false)
        }
      } catch (error) {
        console.error('Error checking subscription:', error)
      } finally {
        setSubscriptionLoaded(true)
      }
    }

    checkSubscription()
  }, [user, tag.id, tag.type, subscriptionLoaded])

  // Handle subscribe/unsubscribe
  const handleSubscriptionToggle = useCallback(async () => {
    if (!user || isSubscribing) return

    setIsSubscribing(true)
    try {
      const response = await fetch('/api/tags/subscribe', {
        method: isSubscribed ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: tag.id }),
      })

      if (response.ok) {
        setIsSubscribed(!isSubscribed)
      } else {
        console.error('Failed to toggle subscription')
      }
    } catch (error) {
      console.error('Error toggling subscription:', error)
    } finally {
      setIsSubscribing(false)
    }
  }, [user, tag.id, isSubscribed, isSubscribing])

  const getIcon = () => {
    switch (tag.type) {
      case 'user':
        return <User className="h-4 w-4" />
      case 'entity':
        if (tag.metadata?.entityType === 'book') return <Book className="h-4 w-4" />
        if (tag.metadata?.entityType === 'group') return <Users className="h-4 w-4" />
        if (tag.metadata?.entityType === 'event') return <Calendar className="h-4 w-4" />
        return <AtSign className="h-4 w-4" />
      case 'topic':
        return <Hash className="h-4 w-4" />
      case 'location':
        return <MapPin className="h-4 w-4" />
      default:
        return <AtSign className="h-4 w-4" />
    }
  }

  const getHref = () => {
    switch (tag.type) {
      case 'user':
        return `/profile/${tag.slug}`
      case 'entity':
        if (tag.metadata?.entityType === 'author') return `/authors/${tag.slug}`
        if (tag.metadata?.entityType === 'book') return `/books/${tag.slug}`
        if (tag.metadata?.entityType === 'group') return `/groups/${tag.slug}`
        if (tag.metadata?.entityType === 'event') return `/events/${tag.slug}`
        return `/entities/${tag.slug}`
      case 'topic':
        return `/tags/${tag.slug}`
      case 'location':
        return `/locations/${tag.slug}`
      default:
        return null
    }
  }

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        'absolute z-50 w-80',
        positionClasses[position],
        'opacity-0 transition-opacity duration-200',
        isVisible && 'opacity-100',
        className
      )}
    >
      <Card className="shadow-lg border">
        {onClose && (
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
              aria-label="Close preview"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            {tag.type === 'user' && tag.avatarUrl && (
              <Avatar
                src={tag.avatarUrl}
                alt={tag.name}
                name={tag.name}
                size="md"
                className="w-12 h-12 shrink-0"
              />
            )}
            {tag.type !== 'user' && (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {getIcon()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-semibold truncate">{tag.name}</CardTitle>
              {tag.sublabel && (
                <p className="text-xs text-muted-foreground mt-0.5">{tag.sublabel}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {tag.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{tag.description}</p>
          )}
          {tag.metadata?.bio && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{tag.metadata.bio}</p>
          )}
          {(tag.metadata?.followers !== undefined || tag.metadata?.posts !== undefined) && (
            <div className="flex gap-4 text-xs text-muted-foreground mb-3">
              {tag.metadata.followers !== undefined && (
                <span>{tag.metadata.followers.toLocaleString()} followers</span>
              )}
              {tag.metadata.posts !== undefined && (
                <span>{tag.metadata.posts.toLocaleString()} posts</span>
              )}
            </div>
          )}
          {/* Action buttons */}
          <div className="flex gap-2">
            {(() => {
              const href = getHref()
              return href ? (
                <Link href={href} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  {tag.type === 'user' ? 'View Profile' : tag.type === 'topic' ? 'View Tag' : 'View'}
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              </Link>
              ) : null
            })()}
            
            {/* Subscription button for topic tags */}
            {tag.type === 'topic' && user && (
              <Button
                variant={isSubscribed ? 'default' : 'outline'}
                size="sm"
                onClick={handleSubscriptionToggle}
                disabled={isSubscribing}
                className={cn(
                  'shrink-0',
                  isSubscribed && 'bg-primary hover:bg-primary/90'
                )}
                title={isSubscribed ? 'Unsubscribe from this tag' : 'Subscribe to this tag'}
              >
                {isSubscribing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : isSubscribed ? (
                  <BellOff className="h-3 w-3" />
                ) : (
                  <Bell className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
