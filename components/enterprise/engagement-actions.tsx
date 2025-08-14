"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Eye,
  TrendingUp,
  Zap
} from "lucide-react"

interface EngagementActionsProps {
  entityId: string
  entityType: 'user' | 'book' | 'author' | 'publisher' | 'group'
  initialEngagementCount?: number
  isLiked?: boolean
  isCommented?: boolean
  isShared?: boolean
  isPremium?: boolean
  monetization?: {
    price?: number
    currency?: string
    revenue_share?: number
  }
  onEngagement?: (action: 'like' | 'comment' | 'share', entityId: string, entityType: string) => Promise<void>
  className?: string
}

export function EngagementActions({
  entityId,
  entityType,
  initialEngagementCount = 0,
  isLiked = false,
  isCommented = false,
  isShared = false,
  isPremium = false,
  monetization,
  onEngagement,
  className = ""
}: EngagementActionsProps) {
  const [engagementCount, setEngagementCount] = useState(initialEngagementCount)
  const [liked, setLiked] = useState(isLiked)
  const [commented, setCommented] = useState(isCommented)
  const [shared, setShared] = useState(isShared)
  const [loading, setLoading] = useState<string | null>(null)

  const handleEngagement = useCallback(async (action: 'like' | 'comment' | 'share') => {
    if (loading) return

    setLoading(action)
    try {
      // Optimistic update
      switch (action) {
        case 'like':
          setLiked(!liked)
          setEngagementCount(prev => liked ? prev - 1 : prev + 1)
          break
        case 'comment':
          setCommented(!commented)
          setEngagementCount(prev => commented ? prev - 1 : prev + 1)
          break
        case 'share':
          setShared(!shared)
          setEngagementCount(prev => shared ? prev - 1 : prev + 1)
          break
      }

      // Call the engagement handler
      if (onEngagement) {
        await onEngagement(action, entityId, entityType)
      }

      // Track analytics
      await trackEngagementAnalytics(action, entityId, entityType)
    } catch (error) {
      console.error(`Error handling ${action}:`, error)
      // Revert optimistic update on error
      switch (action) {
        case 'like':
          setLiked(liked)
          setEngagementCount(prev => liked ? prev + 1 : prev - 1)
          break
        case 'comment':
          setCommented(commented)
          setEngagementCount(prev => commented ? prev + 1 : prev - 1)
          break
        case 'share':
          setShared(shared)
          setEngagementCount(prev => shared ? prev + 1 : prev - 1)
          break
      }
    } finally {
      setLoading(null)
    }
  }, [loading, liked, commented, shared, entityId, entityType, onEngagement])

  const trackEngagementAnalytics = async (action: string, entityId: string, entityType: string) => {
    try {
      await fetch('/api/analytics/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          entity_id: entityId,
          entity_type: entityType,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Error tracking engagement analytics:', error)
    }
  }

  return (
    <div className={`enterprise-engagement-actions flex items-center gap-4 pt-3 border-t border-gray-100 ${className}`}>
      {/* Like Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        className={`enterprise-engagement-like-button gap-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 ${
          liked ? 'text-blue-600 bg-blue-50' : ''
        }`}
        onClick={() => handleEngagement('like')}
        disabled={loading === 'like'}
      >
        <Heart className={`enterprise-engagement-like-icon h-4 w-4 ${
          liked ? 'fill-current' : ''
        }`} />
        <span className="enterprise-engagement-like-text">Like</span>
      </Button>

      {/* Comment Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        className={`enterprise-engagement-comment-button gap-2 text-gray-600 hover:text-green-600 hover:bg-green-50 ${
          commented ? 'text-green-600 bg-green-50' : ''
        }`}
        onClick={() => handleEngagement('comment')}
        disabled={loading === 'comment'}
      >
        <MessageSquare className={`enterprise-engagement-comment-icon h-4 w-4 ${
          commented ? 'fill-current' : ''
        }`} />
        <span className="enterprise-engagement-comment-text">Comment</span>
      </Button>

      {/* Share Button */}
      <Button 
        variant="ghost" 
        size="sm"
        className={`enterprise-engagement-share-button gap-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 ${
          shared ? 'text-purple-600 bg-purple-50' : ''
        }`}
        onClick={() => handleEngagement('share')}
        disabled={loading === 'share'}
      >
        <Share2 className={`enterprise-engagement-share-icon h-4 w-4 ${
          shared ? 'fill-current' : ''
        }`} />
        <span className="enterprise-engagement-share-text">
          {shared ? 'Shared' : 'Share'}
        </span>
      </Button>

      {/* Engagement Count Badge */}
      {engagementCount > 0 && (
        <Badge variant="secondary" className="enterprise-engagement-count-badge text-xs ml-auto">
          <Eye className="enterprise-engagement-count-icon h-3 w-3 mr-1" />
          {engagementCount}
        </Badge>
      )}

      {/* Premium Monetization Badge */}
      {isPremium && monetization && (
        <Badge variant="default" className="enterprise-engagement-premium-badge bg-yellow-500 text-white ml-auto">
          <Zap className="enterprise-engagement-premium-icon h-3 w-3 mr-1" />
          ${monetization.price}
        </Badge>
      )}

      {/* Loading State */}
      {loading && (
        <div className="enterprise-engagement-loading absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="enterprise-engagement-loading-spinner animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  )
} 