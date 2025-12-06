import { useState, useEffect, useCallback, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { uploadPhoto } from '@/app/actions/upload-photo'
import { usePhotoGalleryAnalytics } from './hooks/use-photo-gallery-analytics'
import { usePhotoGalleryMonetization } from './hooks/use-photo-gallery-monetization'
import { usePhotoGalleryAI } from './hooks/use-photo-gallery-ai'
import { PhotoGalleryHeader } from './photo-gallery-header'
import { PhotoGalleryGrid } from './photo-gallery-grid'
import { PhotoGalleryEmpty } from './photo-gallery-empty'
import { PhotoGalleryLoading } from './photo-gallery-loading'
import { PhotoGalleryAnalytics } from './photo-gallery-analytics'
import { PhotoGalleryMonetization } from './photo-gallery-monetization'
import { PhotoGalleryCommunity } from './photo-gallery-community'
import './styles.css'

// Enterprise-grade types based on actual database schema
interface EnterprisePhotoAlbum {
  id: string
  name: string
  description?: string
  cover_image_id?: string
  owner_id: string
  is_public: boolean
  view_count: number
  like_count: number
  share_count: number
  revenue_generated: number
  entity_id?: string
  entity_type?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  deleted_at?: string
  // Enterprise features
  monetization_enabled: boolean
  premium_content: boolean
  community_features: boolean
  ai_enhanced: boolean
  analytics_enabled: boolean
}

interface EnterpriseAlbumImage {
  id: string
  album_id: string
  image_id: string
  display_order: number
  is_cover: boolean
  is_featured: boolean
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  // Enterprise features
  view_count: number
  like_count: number
  share_count: number
  revenue_generated: number
  ai_tags?: string[]
  community_engagement?: number
  // Related image data from join
  image?: {
    id: string
    url: string
    original_filename?: string
    storage_path?: string
    file_size?: number
    mime_type?: string
    width?: number
    height?: number
    created_at: string
    alt_text?: string
    caption?: string
    updated_at?: string
    metadata?: Record<string, any>
  }
}

interface EnterpriseImage {
  id: string
  url: string
  thumbnail_url?: string
  alt_text?: string
  caption?: string
  storage_provider: string
  storage_path: string
  original_filename: string
  file_size: number
  mime_type: string
  width?: number
  height?: number
  is_processed: boolean
  processing_status: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  // Enterprise features
  ai_analysis?: {
    tags: string[]
    sentiment: string
    content_type: string
    quality_score: number
    engagement_prediction: number
  }
  monetization?: {
    is_premium: boolean
    price?: number
    revenue_share: number
    total_earnings: number
  }
  community?: {
    total_likes: number
    total_comments: number
    total_shares: number
    viral_score: number
  }
}

interface EnterpriseAlbumState {
  isLoading: boolean
  error: string | null
  album: EnterprisePhotoAlbum | null
  images: EnterpriseAlbumImage[]
  analytics: {
    total_views: number
    total_likes: number
    total_shares: number
    total_revenue: number
    engagement_rate: number
    viral_score: number
  }
  monetization: {
    total_earnings: number
    premium_subscribers: number
    revenue_share: number
  }
  community: {
    active_followers: number
    total_interactions: number
    community_score: number
  }
}

interface EnterprisePhotoGalleryProps {
  entityId: string
  entityType: 'user' | 'publisher' | 'author' | 'group'
  initialAlbumId?: string
  isEditable?: boolean
  showStats?: boolean
  showShare?: boolean
  showAnalytics?: boolean
  showMonetization?: boolean
  showCommunity?: boolean
  showAI?: boolean
  maxImages?: number
  className?: string
  // Enterprise features
  enableMonetization?: boolean
  enableAnalytics?: boolean
  enableCommunity?: boolean
  enableAI?: boolean
  premiumFeatures?: boolean
}

export function EnterprisePhotoGallery({ 
  entityId, 
  entityType, 
  initialAlbumId, 
  isEditable = true,
  showStats = true,
  showShare = true,
  showAnalytics = true,
  showMonetization = true,
  showCommunity = true,
  showAI = true,
  maxImages = 1000,
  className = '',
  enableMonetization = true,
  enableAnalytics = true,
  enableCommunity = true,
  enableAI = true,
  premiumFeatures = false
}: EnterprisePhotoGalleryProps) {
  const [currentAlbumId, setCurrentAlbumId] = useState<string | undefined>(initialAlbumId)
  const [albumState, setAlbumState] = useState<EnterpriseAlbumState>({
    isLoading: false,
    error: null,
    album: null,
    images: [],
    analytics: {
      total_views: 0,
      total_likes: 0,
      total_shares: 0,
      total_revenue: 0,
      engagement_rate: 0,
      viral_score: 0
    },
    monetization: {
      total_earnings: 0,
      premium_subscribers: 0,
      revenue_share: 0
    },
    community: {
      active_followers: 0,
      total_interactions: 0,
      community_score: 0
    }
  })
  const [showCreateAlbum, setShowCreateAlbum] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [activeTab, setActiveTab] = useState<'gallery' | 'analytics' | 'monetization' | 'community'>('gallery')

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Enterprise hooks
  const analytics = usePhotoGalleryAnalytics(currentAlbumId || '')
  const monetization = usePhotoGalleryMonetization(currentAlbumId || '')
  const ai = usePhotoGalleryAI(currentAlbumId || '')

  // Load album and images with enterprise features
  const loadAlbum = useCallback(async (albumId: string) => {
    setAlbumState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Get album details with enterprise features
      const { data: album, error: albumError } = await supabase
        .from('photo_albums')
        .select('*')
        .eq('id', albumId)
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .is('deleted_at', null)
        .single()

      if (albumError) {
        if (albumError.code === 'PGRST116') {
          setCurrentAlbumId(undefined)
          setAlbumState(prev => ({ 
            ...prev, 
            isLoading: false, 
            album: null, 
            images: [] 
          }))
          return
        }
        throw albumError
      }

      // Get album images with enterprise features
      const { data: albumImages, error: imagesError } = await supabase
        .from('album_images')
        .select(`
          *,
          image:images(*)
        `)
        .eq('album_id', albumId)
        .order('display_order', { ascending: true })

      if (imagesError) throw imagesError

      // Calculate enterprise analytics
      const analyticsData = {
        total_views: albumImages?.reduce((sum, ai) => sum + (ai.view_count || 0), 0) || 0,
        total_likes: albumImages?.reduce((sum, ai) => sum + (ai.like_count || 0), 0) || 0,
        total_shares: albumImages?.reduce((sum, ai) => sum + (ai.share_count || 0), 0) || 0,
        total_revenue: albumImages?.reduce((sum, ai) => sum + (ai.revenue_generated || 0), 0) || 0,
        engagement_rate: albumImages?.length ? 
          ((albumImages.reduce((sum, ai) => sum + (ai.view_count || 0), 0) / albumImages.length) * 100) : 0,
        viral_score: albumImages?.reduce((sum, ai) => sum + (ai.share_count || 0), 0) || 0
      }

      // Calculate monetization metrics
      const monetizationData = {
        total_earnings: albumImages?.reduce((sum, ai) => sum + (ai.revenue_generated || 0), 0) || 0,
        premium_subscribers: album?.metadata?.premium_subscribers || 0,
        revenue_share: album?.metadata?.revenue_share || 0
      }

      // Calculate community metrics
      const communityData = {
        active_followers: album?.metadata?.active_followers || 0,
        total_interactions: analyticsData.total_likes + analyticsData.total_shares,
        community_score: album?.metadata?.community_score || 0
      }

      setAlbumState({
        isLoading: false,
        error: null,
        album,
        images: albumImages || [],
        analytics: analyticsData,
        monetization: monetizationData,
        community: communityData
      })

      // Track analytics
      if (enableAnalytics) {
        analytics.trackView()
      }

    } catch (error) {
      console.error('Error loading album:', error)
      setAlbumState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load album'
      }))
    }
  }, [supabase, entityId, entityType, analytics, enableAnalytics])

  // Create new album with enterprise features
  const createAlbum = useCallback(async (name: string, description?: string): Promise<EnterprisePhotoAlbum> => {
    try {
      const { data, error } = await supabase
        .from('photo_albums')
        .insert({
          name,
          description,
          owner_id: entityId,
          entity_id: entityId,
          entity_type: entityType,
          is_public: false,
          monetization_enabled: enableMonetization,
          premium_content: premiumFeatures,
          community_features: enableCommunity,
          ai_enhanced: enableAI,
          analytics_enabled: enableAnalytics,
          metadata: {
            total_images: 0,
            total_size: 0,
            last_modified: new Date().toISOString(),
            premium_subscribers: 0,
            revenue_share: 0,
            active_followers: 0,
            community_score: 0
          }
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating album:', error)
      throw error
    }
  }, [supabase, entityId, entityType, enableMonetization, premiumFeatures, enableCommunity, enableAI, enableAnalytics])

  // Handle file upload with enterprise features
  const handleFileUpload = useCallback(async (files: File[]) => {
    console.log('Enterprise upload started with files:', files.length)
    
    try {
      if (!currentAlbumId) {
        console.log('Creating new enterprise album...')
        const album = await createAlbum('Photo Album')
        setCurrentAlbumId(album.id)
        await loadAlbum(album.id)
      }

      console.log('Uploading files to enterprise album:', currentAlbumId)

      for (const file of files) {
        try {
          const result = await uploadPhoto(file, entityType, entityId, currentAlbumId)
          
          // AI analysis if enabled
          if (enableAI && result.imageId) {
            await ai.analyzeImage(result.imageId)
          }

          // Analytics tracking
          if (enableAnalytics) {
            analytics.trackUpload(result.imageId)
          }

          // Monetization tracking
          if (enableMonetization) {
            monetization.trackUpload(result.imageId)
          }

          console.log('Enterprise upload successful:', result)
        } catch (error) {
          console.error('Enterprise upload error:', error)
          throw error
        }
      }

      // Reload album to get updated data
      if (currentAlbumId) {
        await loadAlbum(currentAlbumId)
      }

    } catch (error) {
      console.error('Enterprise upload failed:', error)
      throw error
    }
  }, [currentAlbumId, entityType, entityId, createAlbum, loadAlbum, ai, analytics, monetization, enableAI, enableAnalytics, enableMonetization])

  // Handle album creation
  const handleCreateAlbum = useCallback(async () => {
    if (!newAlbumName.trim()) return

    try {
      const album = await createAlbum(newAlbumName.trim())
      setCurrentAlbumId(album.id)
      await loadAlbum(album.id)
      setShowCreateAlbum(false)
      setNewAlbumName('')
    } catch (error) {
      console.error('Error creating enterprise album:', error)
    }
  }, [newAlbumName, createAlbum, loadAlbum])

  // Load album when currentAlbumId changes
  useEffect(() => {
    if (currentAlbumId) {
      loadAlbum(currentAlbumId)
    }
  }, [currentAlbumId, loadAlbum])

  if (albumState.isLoading) {
    return <PhotoGalleryLoading />
  }

  if (albumState.error) {
    return (
      <div className={`enterprise-photo-gallery-container ${className}`}>
        <PhotoGalleryHeader
          albumId={currentAlbumId}
          entityType={entityType}
          entityId={entityId}
          isEditable={isEditable}
          showStats={showStats}
          showShare={showShare}
          onUpload={handleFileUpload}
        />
        <PhotoGalleryEmpty
          isEditable={isEditable}
          onUpload={handleFileUpload}
        />
      </div>
    )
  }

  if (!currentAlbumId) {
    return (
      <div className="enterprise-photo-gallery-empty">
        <div className="enterprise-photo-gallery-empty-icon">📸</div>
        <div className="enterprise-photo-gallery-empty-text">No album selected</div>
        <button 
          className="enterprise-photo-gallery-button"
          onClick={() => setShowCreateAlbum(true)}
        >
          Create Enterprise Album
        </button>
      </div>
    )
  }

  return (
    <div className={`enterprise-photo-gallery-container ${className}`}>
      <PhotoGalleryHeader
        albumId={currentAlbumId}
        entityType={entityType}
        entityId={entityId}
        isEditable={isEditable}
        showStats={showStats}
        showShare={showShare}
        onUpload={handleFileUpload}
      />

      {/* Enterprise Tab Navigation */}
      <div className="enterprise-tab-navigation">
        <button 
          className={`enterprise-tab ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          Gallery
        </button>
        {showAnalytics && enableAnalytics && (
          <button 
            className={`enterprise-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
        )}
        {showMonetization && enableMonetization && (
          <button 
            className={`enterprise-tab ${activeTab === 'monetization' ? 'active' : ''}`}
            onClick={() => setActiveTab('monetization')}
          >
            Monetization
          </button>
        )}
        {showCommunity && enableCommunity && (
          <button 
            className={`enterprise-tab ${activeTab === 'community' ? 'active' : ''}`}
            onClick={() => setActiveTab('community')}
          >
            Community
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'gallery' && (
        albumState.images.length === 0 ? (
          <PhotoGalleryEmpty
            isEditable={isEditable}
            onUpload={handleFileUpload}
          />
        ) : (
          <PhotoGalleryGrid
            images={albumState.images.map(ai => ({
              id: ai.image?.id || ai.image_id,
              url: ai.image?.url || '',
              filename: ai.image?.original_filename || 'image',
              filePath: ai.image?.storage_path || '',
              size: ai.image?.file_size || 0,
              type: ai.image?.mime_type || 'image/jpeg',
              metadata: {
                width: ai.image?.width || 0,
                height: ai.image?.height || 0,
                uploaded_at: ai.image?.created_at || ai.created_at,
                view_count: ai.view_count,
                like_count: ai.like_count,
                share_count: ai.share_count,
                revenue_generated: ai.revenue_generated,
                ai_tags: ai.ai_tags,
                community_engagement: ai.community_engagement,
                ...(ai.image?.metadata || {})
              },
              albumId: ai.album_id,
              entityType: entityType,
              entityId: entityId,
              altText: ai.image?.alt_text,
              caption: ai.image?.caption,
              isFeatured: ai.is_featured,
              displayOrder: ai.display_order,
              createdAt: ai.image?.created_at || ai.created_at,
              updatedAt: ai.image?.updated_at || ai.updated_at
            }))}
            gridCols={3}
            isEditable={isEditable}
            showTags={enableAI}
            enterpriseFeatures={{
              analytics: enableAnalytics,
              monetization: enableMonetization,
              community: enableCommunity,
              ai: enableAI
            }}
            onImageClick={(image) => {
              console.log('Enterprise image clicked:', image)
              if (enableAnalytics) {
                analytics.trackImageClick(image.id)
              }
            }}
            onImageDelete={async (imageId) => {
              // Implement enterprise delete with analytics
              console.log('Enterprise delete:', imageId)
            }}
            onImageReorder={async (imageId, newOrder) => {
              // Implement enterprise reordering
              console.log('Enterprise reorder:', imageId, newOrder)
            }}
            onImageTag={async (imageId, tags) => {
              // Implement enterprise tagging with AI
              if (enableAI) {
                await ai.tagImage(imageId, tags)
              }
            }}
          />
        )
      )}

      {activeTab === 'analytics' && showAnalytics && enableAnalytics && (
        <PhotoGalleryAnalytics
          analytics={albumState.analytics}
          album={albumState.album}
          images={albumState.images}
          onExport={() => {
            // Implement analytics export
            console.log('Exporting analytics')
          }}
        />
      )}

      {activeTab === 'monetization' && showMonetization && enableMonetization && (
        <PhotoGalleryMonetization
          monetization={albumState.monetization}
          album={albumState.album}
          images={albumState.images}
          onEnableMonetization={() => {
            // Implement monetization enable
            console.log('Enabling monetization')
          }}
        />
      )}

      {activeTab === 'community' && showCommunity && enableCommunity && (
        <PhotoGalleryCommunity
          community={albumState.community}
          album={albumState.album}
          images={albumState.images}
          onShare={() => {
            // Implement community sharing
            console.log('Sharing to community')
          }}
        />
      )}
    </div>
  )
} 