import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/hooks/useAuth'
import { PhotoAlbumCreator } from './photo-album-creator'
import { AlbumSettingsDialog } from './album-settings-dialog'
import { EnterprisePhotoGrid } from './photo-gallery/enterprise-photo-grid'
import { 
  FolderPlus, 
  Settings, 
  Eye, 
  Users, 
  Lock, 
  Globe, 
  Image as ImageIcon,
  Calendar,
  Heart,
  Share2
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface UserPhotoAlbumsProps {
  userId: string
  isOwnProfile?: boolean
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
  metadata?: {
    privacy_level?: string
    show_in_feed?: boolean
    allowed_viewers?: string[]
  }
}

export function UserPhotoAlbums({ userId, isOwnProfile = false }: UserPhotoAlbumsProps) {
  const [albums, setAlbums] = useState<Album[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [selectedAlbumForSettings, setSelectedAlbumForSettings] = useState<Album | null>(null)
  
  const { user } = useAuth()
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadAlbums()
  }, [userId])

  const loadAlbums = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('photo_albums')
        .select(`
          id,
          name,
          description,
          is_public,
          cover_image_id,
          created_at,
          updated_at,
          metadata
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      // If not own profile, only show public albums or albums shared with current user
      if (!isOwnProfile && user) {
        query = query.or(`is_public.eq.true,album_shares.shared_with.eq.${user.id}`)
      }

      const { data, error } = await query

      if (error) throw error

      // Get album image counts separately to avoid complex joins
      const albumIds = (data || []).map(album => album.id)
      let albumImageCounts: { [key: string]: number } = {}
      let albumCoverImages: { [key: string]: string } = {}

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

      const formattedAlbums: Album[] = (data || []).map((album: any) => ({
        id: album.id,
        name: album.name,
        description: album.description,
        is_public: album.is_public,
        cover_image_id: album.cover_image_id,
        cover_image_url: albumCoverImages[album.id],
        photo_count: albumImageCounts[album.id] || 0,
        created_at: album.created_at,
        updated_at: album.updated_at,
        metadata: album.metadata
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

  const handlePhotosUploaded = (photoIds: string[]) => {
    console.log('Photos uploaded to album:', photoIds)
    // Refresh albums to update photo counts
    loadAlbums()
  }

  const getPrivacyIcon = (album: Album) => {
    const privacyLevel = album.metadata?.privacy_level || (album.is_public ? 'public' : 'private')
    
    switch (privacyLevel) {
      case 'public':
        return <Globe className="h-4 w-4" />
      case 'friends':
        return <Users className="h-4 w-4" />
      case 'private':
        return <Lock className="h-4 w-4" />
      case 'custom':
        return <Eye className="h-4 w-4" />
      default:
        return album.is_public ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />
    }
  }

  const getPrivacyLabel = (album: Album) => {
    const privacyLevel = album.metadata?.privacy_level || (album.is_public ? 'public' : 'private')
    
    switch (privacyLevel) {
      case 'public':
        return 'Public'
      case 'friends':
        return 'Friends Only'
      case 'private':
        return 'Private'
      case 'custom':
        return 'Custom'
      default:
        return album.is_public ? 'Public' : 'Private'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Photo Albums</h2>
          {isOwnProfile && <PhotoAlbumCreator onAlbumCreated={handleAlbumCreated} />}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="aspect-square bg-muted rounded-lg mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Photo Albums</h2>
        {isOwnProfile && (
          <PhotoAlbumCreator 
            onAlbumCreated={handleAlbumCreated}
            entityType="user"
            entityId={userId}
            trigger={
              <Button className="flex items-center gap-2">
                <FolderPlus className="h-4 w-4" />
                {albums.length === 0 ? "Create Your First Album" : "Create An Album"}
              </Button>
            }
          />
        )}
      </div>

      {albums.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No albums yet</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile 
                    ? "Create your first photo album to get started"
                    : "This user hasn't created any albums yet"
                  }
                </p>
              </div>
              {isOwnProfile && (
                <PhotoAlbumCreator 
                  onAlbumCreated={handleAlbumCreated}
                  entityType="user"
                  entityId={userId}
                  trigger={
                    <Button className="flex items-center gap-2">
                      <FolderPlus className="h-4 w-4" />
                      Create Your First Album
                    </Button>
                  }
                />
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <Card key={album.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
              <div 
                className="aspect-video relative overflow-hidden cursor-pointer group"
                onClick={() => setSelectedAlbum(album)}
              >
                {album.cover_image_url ? (
                  <Image
                    src={album.cover_image_url}
                    alt={album.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                
                {/* Privacy Badge */}
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {getPrivacyIcon(album)}
                    {getPrivacyLabel(album)}
                  </Badge>
                </div>

                {/* Photo Count */}
                <div className="absolute bottom-2 right-2">
                  <Badge variant="default" className="bg-black/70 text-white">
                    {album.photo_count} {album.photo_count === 1 ? 'photo' : 'photos'}
                  </Badge>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/90 text-black hover:bg-white"
                    >
                      View Album
                    </Button>
                  </div>
                </div>
              </div>

              <CardContent className="p-4 flex flex-col flex-1">
                <div className="space-y-2 flex-1">
                  <h3 className="font-semibold text-lg truncate">{album.name}</h3>
                  {album.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {album.description}
                    </p>
                  )}
                </div>

                {/* Footer - Always at bottom */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(album.created_at)}
                    </div>
                    
                    {album.metadata?.show_in_feed && (
                      <Badge variant="outline" className="text-xs">
                        In Feed
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedAlbum(album)}
                    >
                      View Album
                    </Button>
                    
                    {isOwnProfile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAlbumSettings(album)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Album Viewer Modal */}
      {selectedAlbum && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg w-full max-w-6xl h-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-xl font-semibold">{selectedAlbum.name}</h2>
                {selectedAlbum.description && (
                  <p className="text-muted-foreground">{selectedAlbum.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedAlbum(null)}
              >
                ×
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <EnterprisePhotoGrid
                albumId={selectedAlbum.id}
                entityId={userId}
                entityType="user"
                isOwner={isOwnProfile}
                maxHeight="calc(90vh - 120px)"
              />
            </div>
          </div>
        </div>
      )}

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
    </div>
  )
} 