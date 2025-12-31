import { useCallback, useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface MonetizationEvent {
  type: 'purchase' | 'subscription' | 'tip' | 'ad_revenue' | 'sponsorship' | 'merchandise'
  albumId: string
  imageId?: string
  amount: number
  currency: string
  metadata?: Record<string, any>
}

interface MonetizationData {
  total_earnings: number
  premium_subscribers: number
  revenue_share: number
  monthly_recurring_revenue: number
  lifetime_value: number
  conversion_rate: number
  average_order_value: number
  top_revenue_sources: string[]
  revenue_trends: Record<string, any>
  payment_methods: Record<string, any>
  subscription_tiers: Record<string, any>
  revenue_goals: Record<string, any>
}

interface MonetizationSettings {
  enable_premium_content: boolean
  enable_subscriptions: boolean
  enable_tips: boolean
  enable_advertising: boolean
  enable_sponsorships: boolean
  enable_merchandise: boolean
  revenue_share_percentage: number
  minimum_payout: number
  payment_schedule: string
  tax_settings: Record<string, any>
}

export function usePhotoGalleryMonetization(albumId: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [monetizationData, setMonetizationData] = useState<MonetizationData>({
    total_earnings: 0,
    premium_subscribers: 0,
    revenue_share: 0,
    monthly_recurring_revenue: 0,
    lifetime_value: 0,
    conversion_rate: 0,
    average_order_value: 0,
    top_revenue_sources: [],
    revenue_trends: {},
    payment_methods: {},
    subscription_tiers: {},
    revenue_goals: {},
  })

  const [settings, setSettings] = useState<MonetizationSettings>({
    enable_premium_content: false,
    enable_subscriptions: false,
    enable_tips: false,
    enable_advertising: false,
    enable_sponsorships: false,
    enable_merchandise: false,
    revenue_share_percentage: 70,
    minimum_payout: 50,
    payment_schedule: 'monthly',
    tax_settings: {},
  })

  const [isLoading, setIsLoading] = useState(false)

  // Track monetization event
  const trackEvent = useCallback(
    async (event: MonetizationEvent) => {
      try {
        // Store monetization event in database
        const { error } = await supabase.from('photo_monetization').insert({
          album_id: event.albumId,
          image_id: event.imageId,
          event_type: event.type,
          amount: event.amount,
          currency: event.currency,
          metadata: {
            timestamp: new Date().toISOString(),
            ...event.metadata,
          },
        })

        if (error) {
          console.error('Monetization tracking error:', error)
        }
      } catch (error) {
        console.error('Failed to track monetization event:', error)
      }
    },
    [supabase]
  )

  // Track upload for potential monetization
  const trackUpload = useCallback(
    async (imageId: string) => {
      // Check if image should be monetized based on settings
      if (settings.enable_premium_content) {
        await trackEvent({
          type: 'purchase',
          albumId,
          imageId,
          amount: 0, // Would be calculated based on content value
          currency: 'USD',
          metadata: {
            upload_type: 'premium_content',
            monetization_status: 'pending',
          },
        })
      }
    },
    [albumId, settings.enable_premium_content, trackEvent]
  )

  // Enable premium content
  const enablePremiumContent = useCallback(
    async (imageId: string, price: number) => {
      try {
        const { error } = await supabase
          .from('album_images')
          .update({
            metadata: {
              is_premium: true,
              price: price,
              monetization_enabled: true,
            },
          })
          .eq('image_id', imageId)
          .eq('album_id', albumId)

        if (error) throw error

        await trackEvent({
          type: 'purchase',
          albumId,
          imageId,
          amount: price,
          currency: 'USD',
          metadata: {
            action: 'enable_premium',
            price: price,
          },
        })

        console.log('Premium content enabled for image:', imageId)
      } catch (error) {
        console.error('Error enabling premium content:', error)
      }
    },
    [albumId, trackEvent, supabase]
  )

  // Process subscription payment
  const processSubscription = useCallback(
    async (tier: string, amount: number) => {
      try {
        await trackEvent({
          type: 'subscription',
          albumId,
          amount: amount,
          currency: 'USD',
          metadata: {
            subscription_tier: tier,
            billing_cycle: 'monthly',
          },
        })

        // Update subscription count
        setMonetizationData((prev) => ({
          ...prev,
          premium_subscribers: prev.premium_subscribers + 1,
          monthly_recurring_revenue: prev.monthly_recurring_revenue + amount,
        }))

        console.log('Subscription processed:', tier, amount)
      } catch (error) {
        console.error('Error processing subscription:', error)
      }
    },
    [albumId, trackEvent]
  )

  // Process tip payment
  const processTip = useCallback(
    async (amount: number, message?: string) => {
      try {
        await trackEvent({
          type: 'tip',
          albumId,
          amount: amount,
          currency: 'USD',
          metadata: {
            tip_message: message,
            tip_type: 'reader_support',
          },
        })

        console.log('Tip processed:', amount, message)
      } catch (error) {
        console.error('Error processing tip:', error)
      }
    },
    [albumId, trackEvent]
  )

  // Process ad revenue
  const processAdRevenue = useCallback(
    async (amount: number, adType: string) => {
      try {
        await trackEvent({
          type: 'ad_revenue',
          albumId,
          amount: amount,
          currency: 'USD',
          metadata: {
            ad_type: adType,
            revenue_share: settings.revenue_share_percentage,
          },
        })

        console.log('Ad revenue processed:', amount, adType)
      } catch (error) {
        console.error('Error processing ad revenue:', error)
      }
    },
    [albumId, trackEvent, settings.revenue_share_percentage]
  )

  // Process sponsorship
  const processSponsorship = useCallback(
    async (amount: number, sponsor: string) => {
      try {
        await trackEvent({
          type: 'sponsorship',
          albumId,
          amount: amount,
          currency: 'USD',
          metadata: {
            sponsor: sponsor,
            sponsorship_type: 'content_sponsorship',
          },
        })

        console.log('Sponsorship processed:', amount, sponsor)
      } catch (error) {
        console.error('Error processing sponsorship:', error)
      }
    },
    [albumId, trackEvent]
  )

  // Process merchandise sale
  const processMerchandiseSale = useCallback(
    async (amount: number, product: string) => {
      try {
        await trackEvent({
          type: 'merchandise',
          albumId,
          amount: amount,
          currency: 'USD',
          metadata: {
            product: product,
            sale_type: 'direct_sale',
          },
        })

        console.log('Merchandise sale processed:', amount, product)
      } catch (error) {
        console.error('Error processing merchandise sale:', error)
      }
    },
    [albumId, trackEvent]
  )

  // Load monetization data
  const loadMonetization = useCallback(async () => {
    if (!albumId) return

    setIsLoading(true)
    try {
      // Get monetization data from album_images table
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

      // Calculate monetization metrics
      const totalEarnings =
        albumImages?.reduce((sum, ai) => sum + (ai.revenue_generated || 0), 0) || 0
      const premiumContent = albumImages?.filter((ai) => ai.metadata?.is_premium).length || 0
      const averageOrderValue = albumImages?.length ? totalEarnings / albumImages.length : 0

      // Get revenue sources
      const revenueSources =
        albumImages
          ?.filter((ai) => ai.revenue_generated > 0)
          .map((ai) => ai.image?.original_filename || 'Unknown')
          .slice(0, 5) || []

      setMonetizationData({
        total_earnings: totalEarnings,
        premium_subscribers: premiumContent,
        revenue_share: settings.revenue_share_percentage,
        monthly_recurring_revenue: 0, // Would be calculated from subscription data
        lifetime_value: totalEarnings,
        conversion_rate: 0, // Would be calculated from analytics
        average_order_value: averageOrderValue,
        top_revenue_sources: revenueSources,
        revenue_trends: {},
        payment_methods: {},
        subscription_tiers: {},
        revenue_goals: {},
      })
    } catch (error) {
      console.error('Error loading monetization data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [albumId, supabase, settings.revenue_share_percentage])

  // Load monetization on mount and when albumId changes
  useEffect(() => {
    loadMonetization()
  }, [loadMonetization])

  // Update monetization settings
  const updateSettings = useCallback(
    async (newSettings: Partial<MonetizationSettings>) => {
      try {
        const updatedSettings = { ...settings, ...newSettings }
        setSettings(updatedSettings)

        // Update settings in database
        const { error } = await supabase
          .from('photo_albums')
          .update({
            metadata: {
              ...updatedSettings,
            },
          })
          .eq('id', albumId)

        if (error) throw error

        console.log('Monetization settings updated:', newSettings)
      } catch (error) {
        console.error('Error updating monetization settings:', error)
      }
    },
    [albumId, settings, supabase]
  )

  // Generate revenue report
  const generateRevenueReport = useCallback(
    async (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
      try {
        // Implementation would generate comprehensive revenue report
        console.log(`Generating ${period} revenue report`)

        const report = {
          album_id: albumId,
          period: period,
          data: monetizationData,
          generated_at: new Date().toISOString(),
        }

        // Export report
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `revenue-report-${albumId}-${period}-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Error generating revenue report:', error)
      }
    },
    [albumId, monetizationData]
  )

  // Calculate payout amount
  const calculatePayout = useCallback(() => {
    const revenueShare = monetizationData.total_earnings * (settings.revenue_share_percentage / 100)
    return Math.max(0, revenueShare - settings.minimum_payout)
  }, [monetizationData.total_earnings, settings.revenue_share_percentage, settings.minimum_payout])

  return {
    // Tracking functions
    trackUpload,
    enablePremiumContent,
    processSubscription,
    processTip,
    processAdRevenue,
    processSponsorship,
    processMerchandiseSale,

    // Data and state
    monetizationData,
    settings,
    isLoading,

    // Utility functions
    loadMonetization,
    updateSettings,
    generateRevenueReport,
    calculatePayout,
  }
}
