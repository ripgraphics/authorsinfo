'use client'

import React, { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ContentSection } from '@/components/ui/content-section'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { PhotoAlbumCreator } from './photo-album-creator'
import { AlbumSettingsDialog } from './album-settings-dialog'
import { EnterprisePhotoGrid } from './photo-gallery/enterprise-photo-grid'
import { EnterpriseImageUpload } from '@/components/ui/enterprise-image-upload'
import { addCacheBusting } from '@/lib/utils/image-url-validation'
import { ReusableModal } from '@/components/ui/reusable-modal'
import { CloseButton } from '@/components/ui/close-button'
import {
  FolderPlus,
  Settings,
  Lock,
  Globe,
  Image as ImageIcon,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getUserIdFromPermalink } from '@/lib/utils/profile-url-client'

interface EntityPhotoAlbumsProps {
  entityId: string
  entityType: 'user' | 'publisher' | 'author' | 'group' | 'book' | 'event' | 'content'
  isOwnEntity?: boolean
  entityDisplayInfo?: {
    id: string
    name: string
    type: 'user' | 'author' | 'publisher' | 'group' | 'event' | 'book'
    author_image?: { url: string }
    publisher_image?: { url: string }
    bookCount?: number
    member_count?: number
    location?: string
    bio?: string
  } // Optional override for entity display with hover card functionality
}

interface Album {
  id: string
  name: string
  description?: string
  is_public: boolean
  cover_image_id?: string
  cover_image_url?: string
  photo_count: number
  created_at: string
  updated_at: string
  metadata?: any
  allowed_viewers?: string[]
  is_post_album?: boolean
  album_type?: 'regular' | 'posts' | 'post'
  enhancedData?: any // Store the full enhanced data from /api/entity-images
}

export function EntityPhotoAlbums({
  entityId,
  entityType = 'user',
  isOwnEntity = false,
  entityDisplayInfo,
}: EntityPhotoAlbumsProps) {
  const [albums, setAlbums] = useState<Album[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [selectedAlbumForSettings, setSelectedAlbumForSettings] = useState<Album | null>(null)

  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = supabaseClient

  useEffect(() => {
    loadAlbums()
  }, [entityId])

  // Force refresh when album refresh event is triggered
  useEffect(() => {
    const handleAlbumRefresh = () => {
      console.log('🔄 Album refresh event received, reloading albums...')
      loadAlbums()
    }

    window.addEventListener('albumRefresh', handleAlbumRefresh)

    return () => {
      window.removeEventListener('albumRefresh', handleAlbumRefresh)
    }
  }, [entityId])

  // Listen for cover image changes to refresh albums
  useEffect(() => {
    const handleCoverImageChange = () => {
      console.log('🖼️ Cover image changed event received, refreshing albums')
      loadAlbums()
    }

    window.addEventListener('entityImageChanged', handleCoverImageChange)

    return () => {
      window.removeEventListener('entityImageChanged', handleCoverImageChange)
    }
  }, [])

  // Listen for album refresh events (when photos are updated)
  useEffect(() => {
    const handleAlbumRefresh = () => {
      console.log('🔄 Album refresh event received, reloading albums...')
      loadAlbums()
    }

    window.addEventListener('albumRefresh', handleAlbumRefresh)

    return () => {
      window.removeEventListener('albumRefresh', handleAlbumRefresh)
    }
  }, [])

  // Update selectedAlbum when albums are refreshed - SUPABASE IS SOURCE OF TRUTH
  // If selectedAlbum no longer exists in albums, clear it
  useEffect(() => {
    if (selectedAlbum) {
      if (albums.length === 0) {
        // Albums cleared - clear selection (Supabase source of truth)
        console.log('🔄 Albums cleared - clearing selectedAlbum (Supabase source of truth)')
        setSelectedAlbum(null)
      } else {
        const updatedAlbum = albums.find((album) => album.id === selectedAlbum.id)
        if (updatedAlbum) {
          console.log('🔄 Updating selectedAlbum with refreshed data from Supabase')
          setSelectedAlbum(updatedAlbum)
        } else {
          // Selected album no longer exists in Supabase - clear it
          console.log('🔄 Selected album no longer exists in Supabase - clearing selection')
          setSelectedAlbum(null)
        }
      }
    }
  }, [albums, selectedAlbum])

  const loadAlbums = async () => {
    setIsLoading(true)
    try {
      // Convert permalink to UUID if this is a user entity
      let actualEntityId = entityId
      if (entityType === 'user') {
        const userUUID = await getUserIdFromPermalink(entityId)
        if (!userUUID) {
          console.error('User not found for entityId:', entityId)
          setAlbums([])
          return
        }
        actualEntityId = userUUID
      }

      // For non-user entities, use the enhanced /api/entity-images endpoint
      if (entityType !== 'user') {
        try {
          console.log('🖼️ Loading albums via /api/entity-images for entity:', {
            entityId: actualEntityId,
            entityType,
          })

          // Load entity_header albums with cache-busting
          const headerResponse = await fetch(
            `/api/entity-images?entityId=${actualEntityId}&entityType=${entityType}&albumPurpose=entity_header&_cb=${Date.now()}`
          )
          const headerData = await headerResponse.json()

          // Load avatar albums with cache-busting
          const avatarResponse = await fetch(
            `/api/entity-images?entityId=${actualEntityId}&entityType=${entityType}&albumPurpose=avatar&_cb=${Date.now()}`
          )
          const avatarData = await avatarResponse.json()

          console.log('🖼️ Header albums response:', headerData)
          console.log('🖼️ Avatar albums response:', avatarData)

          const allAlbums = [...(headerData.albums || []), ...(avatarData.albums || [])]

          // ALWAYS clear albums first to ensure Supabase is the source of truth
          // If API returns empty, we show empty - no stale data
          if (allAlbums.length === 0) {
            console.log('🖼️ No albums found in API response - clearing albums state')
            setAlbums([])
            setSelectedAlbum(null)
            setIsLoading(false)
            return
          }

          // Transform the enhanced album data to match our Album interface
          const formattedAlbums: Album[] = allAlbums.map((album: any) => ({
            id: album.id,
            name: album.name,
            description: album.description,
            is_public: album.is_public,
            cover_image_id: album.cover_image_id,
            cover_image_url:
              album.images?.find((img: any) => img.is_cover)?.image?.url ||
              album.images?.[0]?.image?.url,
            photo_count: album.images?.length || 0,
            created_at: album.created_at,
            updated_at: album.updated_at,
            metadata: album.metadata,
            entity_type: album.entity_type,
            // Store the full enhanced data for the photo grid
            enhancedData: album,
          }))

          console.log('🖼️ Formatted albums:', formattedAlbums)
          setAlbums(formattedAlbums)
          // Clear selected album if it's no longer in the list (Supabase source of truth)
          if (selectedAlbum && !formattedAlbums.find((a) => a.id === selectedAlbum.id)) {
            console.log('🖼️ Selected album no longer exists - clearing selection')
            setSelectedAlbum(null)
          }
          setIsLoading(false)
          return
        } catch (apiError) {
          console.error('❌ Error loading albums via API, falling back to direct query:', apiError)
          // Fall back to direct query if API fails
        }
      }

      // Fallback: Load regular albums via direct Supabase query (for user entities or API failures)
      let query = supabase.from('photo_albums').select(`
          id,
          name,
          description,
          is_public,
          cover_image_id,
          created_at,
          updated_at,
          metadata,
          entity_type
        `)

      // For user entities, query by owner_id; for other entities, query by entity_id
      if (entityType === 'user') {
        query = query.eq('owner_id', actualEntityId)
      } else {
        query = query.eq('entity_id', actualEntityId).eq('entity_type', entityType)
      }

      query = query
        .not('entity_type', 'like', '%_posts') // Exclude post albums for now
        .order('created_at', { ascending: false })

      // If not own profile, only show public albums or albums shared with current user
      if (!isOwnEntity && user) {
        query = query.or(`is_public.eq.true,album_shares.shared_with.eq.${user.id}`)
      }

      const { data: regularAlbums, error: regularError } = await query
      if (regularError) throw regularError

      // Load post albums for this entity
      const postAlbumType = `${entityType}_posts`
      let postAlbumsQuery = supabase
        .from('photo_albums')
        .select(
          `
          id,
          name,
          description,
          is_public,
          cover_image_id,
          created_at,
          updated_at,
          metadata,
          entity_type
        `
        )
        .eq('entity_type', postAlbumType)
        .eq('entity_id', actualEntityId)
        .order('created_at', { ascending: false })

      // If not own profile, only show public post albums
      if (!isOwnEntity && user) {
        postAlbumsQuery = postAlbumsQuery.eq('is_public', true)
      }

      const { data: postAlbums, error: postError } = await postAlbumsQuery
      if (postError) throw postError

      // Combine regular albums and post albums
      const allAlbums = [...(regularAlbums || []), ...(postAlbums || [])]

      // Get album image counts separately to avoid complex joins
      const albumIds = allAlbums.map((album: any) => (album as any).id)
      const albumImageCounts: { [key: string]: number } = {}
      const albumCoverImages: { [key: string]: string } = {}

      if (albumIds.length > 0) {
        // Get image counts for each album
        const { data: imageCounts } = await supabase
          .from('album_images')
          .select('album_id, images(id, url, thumbnail_url)')
          .in('album_id', albumIds)

        if (imageCounts) {
          // Count images per album and get cover images
          imageCounts.forEach((item: any) => {
            const albumId = item.album_id
            albumImageCounts[albumId] = (albumImageCounts[albumId] || 0) + 1

            // Use first image as cover if no cover is set
            if (!albumCoverImages[albumId] && item.images) {
              albumCoverImages[albumId] = item.images.thumbnail_url || item.images.url
            }
          })
        }
      }

      const formattedAlbums: Album[] = allAlbums.map((album: any) => ({
        id: album.id,
        name: album.name,
        description: album.description,
        is_public: album.is_public,
        cover_image_id: album.cover_image_id,
        cover_image_url: albumCoverImages[album.id],
        photo_count: albumImageCounts[album.id] || 0,
        created_at: album.created_at,
        updated_at: album.updated_at,
        metadata: album.metadata,
        is_post_album: album.entity_type?.includes('_posts') || false,
        album_type: album.metadata?.album_type || 'regular',
      }))

      setAlbums(formattedAlbums)
    } catch (error) {
      console.error('Error loading albums:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAlbumCreated = () => {
    loadAlbums()
  }

  const handleAlbumSettings = (album: Album) => {
    setSelectedAlbumForSettings(album)
    setIsSettingsOpen(true)
  }

  const handleSettingsUpdated = () => {
    loadAlbums()
    setIsSettingsOpen(false)
    setSelectedAlbumForSettings(null)
  }

  // Placeholder for future functionality
  const _handlePhotosUploaded = (photoIds: string[]) => {
    console.log('Photos uploaded to album:', photoIds)
    // Refresh albums to update photo counts
    loadAlbums()
  }

  const handleAlbumClick = (album: Album) => {
    setSelectedAlbum(album)
  }

  const getPrivacyIcon = (album: Album) => {
    if (album.is_public) {
      return <Globe className="h-3 w-3" />
    }
    return <Lock className="h-3 w-3" />
  }

  // Placeholder for future functionality
  const _getPrivacyLabel = (album: Album) => {
    if (album.is_public) {
      return 'Public'
    }
    return 'Private'
  }

  // Placeholder for future functionality
  const _formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <ContentSection
        title="Photo Albums"
        headerRight={
          isOwnEntity ? (
            <PhotoAlbumCreator
              onAlbumCreated={handleAlbumCreated}
              entityType={entityType as 'user' | 'publisher' | 'author' | 'group'}
              entityId={entityId}
              trigger={
                <Button className="user-photo-albums-create-button flex items-center gap-2">
                  <FolderPlus className="h-4 w-4" />
                  Create An Album
                </Button>
              }
            />
          ) : undefined
        }
      >
        <div className="user-photo-albums-loading-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="user-photo-albums-loading-card animate-pulse">
              <CardContent className="user-photo-albums-loading-content p-4">
                <div className="user-photo-albums-loading-thumbnail aspect-square bg-muted rounded-lg mb-4" />
                <div className="user-photo-albums-loading-text space-y-2">
                  <div className="user-photo-albums-loading-title-skeleton h-4 bg-muted rounded-sm w-3/4" />
                  <div className="user-photo-albums-loading-description-skeleton h-3 bg-muted rounded-sm w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ContentSection>
    )
  }

  return (
    <ContentSection
      title="Photo Albums"
      headerRight={
        isOwnEntity ? (
          <PhotoAlbumCreator
            onAlbumCreated={handleAlbumCreated}
            entityType={entityType as 'user' | 'publisher' | 'author' | 'group'}
            entityId={entityId}
            trigger={
              <Button className="user-photo-albums-create-button flex items-center gap-2">
                <FolderPlus className="h-4 w-4" />
                {albums.length === 0 ? 'Create Your First Album' : 'Create An Album'}
              </Button>
            }
          />
        ) : undefined
      }
    >
      {albums.length === 0 ? (
        <div className="user-photo-albums-empty-content text-center">
          <div className="user-photo-albums-empty-state flex flex-col items-center space-y-4">
            <div className="user-photo-albums-empty-icon w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="user-photo-albums-empty-text">
              <h3 className="user-photo-albums-empty-title text-lg font-semibold">No albums yet</h3>
              <p className="user-photo-albums-empty-description text-muted-foreground">
                {isOwnEntity
                  ? 'Create your first photo album to get started'
                  : entityType === 'event' || entityType === 'book'
                    ? `This ${entityType} does not have any albums yet`
                    : `This ${entityType} hasn't created any albums yet`}
              </p>
            </div>
            {isOwnEntity && (
              <PhotoAlbumCreator
                onAlbumCreated={handleAlbumCreated}
                entityType={entityType as 'user' | 'publisher' | 'author' | 'group'}
                entityId={entityId}
                trigger={
                  <Button className="user-photo-albums-create-first-button flex items-center gap-2">
                    <FolderPlus className="h-4 w-4" />
                    Create Your First Album
                  </Button>
                }
              />
            )}
          </div>
        </div>
      ) : (
        <div className="user-photo-albums-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {albums.map((album) => (
            <Card
              key={album.id}
              className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] relative overflow-hidden"
              onClick={() => handleAlbumClick(album)}
            >
              {/* Album Cover Image */}
              <div className="aspect-square overflow-hidden relative">
                {album.cover_image_url ? (
                  <Image
                    src={addCacheBusting(album.cover_image_url) || album.cover_image_url || ''}
                    alt={album.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Album Info Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-semibold text-sm mb-1 truncate">{album.name}</h3>
                  <p className="text-xs text-gray-200 mb-2 line-clamp-2">{album.description}</p>

                  {/* Album Type Badge */}
                  {album.is_post_album && (
                    <div className="flex gap-2 mb-2">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          album.album_type === 'posts'
                            ? 'bg-blue-500 text-white'
                            : 'bg-green-500 text-white'
                        }`}
                      >
                        {album.album_type === 'posts' ? 'Posts Album' : 'Post Album'}
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      {album.photo_count} photo{album.photo_count !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      {getPrivacyIcon(album)}
                      {album.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              {isOwnEntity && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAlbumSettings(album)
                    }}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Album Viewer Modal */}
      <ReusableModal
        open={!!selectedAlbum}
        onOpenChange={(open) => !open && setSelectedAlbum(null)}
        title={selectedAlbum?.name ?? ''}
        description={selectedAlbum?.description}
        contentClassName="max-w-6xl max-h-[90vh] flex flex-col p-0"
        headerRight={
          <div className="flex items-center gap-2 flex-shrink-0">
            {isOwnEntity && selectedAlbum && (
              <EnterpriseImageUpload
                entityType={entityType}
                entityId={entityId}
                context="album"
                albumId={selectedAlbum.id}
                onUploadComplete={(imageIds: string[]) => {
                  loadAlbums() // Refresh albums after upload
                  toast({
                    title: 'Success',
                    description: `Added ${imageIds.length} photo${imageIds.length !== 1 ? 's' : ''} to album`,
                  })
                }}
                variant="default"
                size="sm"
                buttonText="Add Photos"
              />
            )}
            <CloseButton onClick={() => setSelectedAlbum(null)} className="relative top-0 right-0" />
          </div>
        }
      >
        {selectedAlbum && (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col -mx-4 -mt-2">
            <EnterprisePhotoGrid
              albumId={selectedAlbum.id}
              entityId={entityId}
              entityType={entityType}
              isOwner={isOwnEntity}
              onCoverImageChange={() => {
                window.dispatchEvent(new CustomEvent('entityImageChanged'))
              }}
              maxHeight="100%"
              enhancedAlbumData={selectedAlbum.enhancedData}
              entityDisplayInfo={entityDisplayInfo}
            />
          </div>
        )}
      </ReusableModal>

      {/* Album Settings Dialog */}
      {selectedAlbumForSettings && (
        <AlbumSettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => {
            setIsSettingsOpen(false)
            setSelectedAlbumForSettings(null)
          }}
          album={selectedAlbumForSettings}
          photos={[]} // TODO: Load photos for this album
          onSettingsUpdated={handleSettingsUpdated}
        />
      )}
    </ContentSection>
  )
}
