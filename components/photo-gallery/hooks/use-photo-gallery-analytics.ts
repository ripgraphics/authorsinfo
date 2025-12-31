import { useCallback, useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface AnalyticsEvent {
  type: 'view' | 'click' | 'share' | 'download' | 'like' | 'upload' | 'delete' | 'edit'
  albumId: string
  imageId?: string
  metadata?: Record<string, any>
}

interface AnalyticsData {
  total_views: number
  total_likes: number
  total_shares: number
  total_revenue: number
  engagement_rate: number
  viral_score: number
  unique_visitors: number
  average_session_duration: number
  conversion_rate: number
  top_performing_content: string[]
  audience_demographics: Record<string, any>
  geographic_data: Record<string, any>
  device_breakdown: Record<string, any>
  traffic_sources: Record<string, any>
  real_time_activity: any[]
}

export function usePhotoGalleryAnalytics(albumId: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    total_views: 0,
    total_likes: 0,
    total_shares: 0,
    total_revenue: 0,
    engagement_rate: 0,
    viral_score: 0,
    unique_visitors: 0,
    average_session_duration: 0,
    conversion_rate: 0,
    top_performing_content: [],
    audience_demographics: {},
    geographic_data: {},
    device_breakdown: {},
    traffic_sources: {},
    real_time_activity: [],
  })

  const [isLoading, setIsLoading] = useState(false)

  // Track analytics event
  const trackEvent = useCallback(
    async (event: AnalyticsEvent) => {
      try {
        // Store analytics event in database
        const { error } = await supabase.from('photo_analytics').insert({
          album_id: event.albumId,
          image_id: event.imageId,
          event_type: event.type,
          metadata: {
            user_agent: navigator.userAgent,
            referrer: document.referrer,
            timestamp: new Date().toISOString(),
            ...event.metadata,
          },
        })

        if (error) {
          console.error('Analytics tracking error:', error)
        }
      } catch (error) {
        console.error('Failed to track analytics event:', error)
      }
    },
    [supabase]
  )

  // Track album view
  const trackView = useCallback(async () => {
    await trackEvent({
      type: 'view',
      albumId,
      metadata: {
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        session_id: sessionStorage.getItem('session_id'),
        page_url: window.location.href,
      },
    })
  }, [albumId, trackEvent])

  // Track image click
  const trackImageClick = useCallback(
    async (imageId: string) => {
      await trackEvent({
        type: 'click',
        albumId,
        imageId,
        metadata: {
          click_position: 'gallery',
          interaction_type: 'view',
        },
      })
    },
    [albumId, trackEvent]
  )

  // Track image share
  const trackShare = useCallback(
    async (platform: string, imageId?: string) => {
      await trackEvent({
        type: 'share',
        albumId,
        imageId,
        metadata: { platform },
      })
    },
    [albumId, trackEvent]
  )

  // Track image download
  const trackDownload = useCallback(
    async (imageId: string) => {
      await trackEvent({
        type: 'download',
        albumId,
        imageId,
        metadata: {
          download_type: 'direct',
          file_size: 0, // Would be calculated from actual file
        },
      })
    },
    [albumId, trackEvent]
  )

  // Track image like
  const trackLike = useCallback(
    async (imageId: string) => {
      await trackEvent({
        type: 'like',
        albumId,
        imageId,
        metadata: {
          like_type: 'user_like',
          timestamp: new Date().toISOString(),
        },
      })
    },
    [albumId, trackEvent]
  )

  // Track upload
  const trackUpload = useCallback(
    async (imageId: string) => {
      await trackEvent({
        type: 'upload',
        albumId,
        imageId,
        metadata: {
          upload_method: 'cloudinary',
          upload_timestamp: new Date().toISOString(),
        },
      })
    },
    [albumId, trackEvent]
  )

  // Track delete
  const trackDelete = useCallback(
    async (imageId: string) => {
      await trackEvent({
        type: 'delete',
        albumId,
        imageId,
        metadata: {
          delete_reason: 'user_action',
          delete_timestamp: new Date().toISOString(),
        },
      })
    },
    [albumId, trackEvent]
  )

  // Track edit
  const trackEdit = useCallback(
    async (imageId: string, editType: string) => {
      await trackEvent({
        type: 'edit',
        albumId,
        imageId,
        metadata: {
          edit_type: editType,
          edit_timestamp: new Date().toISOString(),
        },
      })
    },
    [albumId, trackEvent]
  )

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    if (!albumId) return

    setIsLoading(true)
    try {
      // Get basic analytics from album_images table
      const { data: albumImages, error } = await supabase
        .from('album_images')
        .select(
          `
          *,
          image:images(*)
        `
        )
        .eq('album_id', albumId)

      if (error) throw error

      // Calculate analytics
      const totalViews = albumImages?.reduce((sum, ai) => sum + (ai.view_count || 0), 0) || 0
      const totalLikes = albumImages?.reduce((sum, ai) => sum + (ai.like_count || 0), 0) || 0
      const totalShares = albumImages?.reduce((sum, ai) => sum + (ai.share_count || 0), 0) || 0
      const totalRevenue =
        albumImages?.reduce((sum, ai) => sum + (ai.revenue_generated || 0), 0) || 0
      const engagementRate = albumImages?.length ? (totalViews / albumImages.length) * 100 : 0

      // Get top performing content
      const topContent =
        albumImages
          ?.sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
          .slice(0, 5)
          .map((ai) => ai.image?.original_filename || 'Unknown') || []

      setAnalyticsData({
        total_views: totalViews,
        total_likes: totalLikes,
        total_shares: totalShares,
        total_revenue: totalRevenue,
        engagement_rate: engagementRate,
        viral_score: totalShares,
        unique_visitors: 0, // Would be calculated from analytics table
        average_session_duration: 0, // Would be calculated from analytics table
        conversion_rate: 0, // Would be calculated from analytics table
        top_performing_content: topContent,
        audience_demographics: {},
        geographic_data: {},
        device_breakdown: {},
        traffic_sources: {},
        real_time_activity: [],
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [albumId, supabase])

  // Load analytics on mount and when albumId changes
  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  // Export analytics data
  const exportAnalytics = useCallback(
    async (format: 'csv' | 'json' | 'pdf') => {
      try {
        // Implementation would generate and download analytics report
        console.log(`Exporting analytics in ${format} format`)

        // Mock export functionality
        const data = {
          album_id: albumId,
          analytics: analyticsData,
          export_date: new Date().toISOString(),
          format,
        }

        if (format === 'json') {
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `analytics-${albumId}-${new Date().toISOString().split('T')[0]}.json`
          a.click()
          URL.revokeObjectURL(url)
        }
      } catch (error) {
        console.error('Error exporting analytics:', error)
      }
    },
    [albumId, analyticsData]
  )

  // Get real-time analytics
  const getRealTimeAnalytics = useCallback(async () => {
    try {
      // Implementation would fetch real-time analytics data
      const { data, error } = await supabase
        .from('photo_analytics')
        .select('*')
        .eq('album_id', albumId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error getting real-time analytics:', error)
      return []
    }
  }, [albumId, supabase])

  return {
    // Tracking functions
    trackView,
    trackImageClick,
    trackShare,
    trackDownload,
    trackLike,
    trackUpload,
    trackDelete,
    trackEdit,

    // Data and state
    analyticsData,
    isLoading,

    // Utility functions
    loadAnalytics,
    exportAnalytics,
    getRealTimeAnalytics,
  }
}
