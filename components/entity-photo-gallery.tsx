import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  ImageIcon, 
  Plus, 
  Settings, 
  Eye, 
  Heart, 
  Share2,
  Camera,
  Images,
  Album,
  Upload
} from 'lucide-react'
import { EnterprisePhotoGallery } from './photo-gallery/enterprise-photo-gallery'
import { PhotoAlbumCreator } from './photo-album-creator'


// Entity album types
type EntityAlbumType = 
  | 'book_cover_album'
  | 'book_avatar_album' 
  | 'book_entity_header_album'
  | 'book_gallery_album'
  | 'author_avatar_album'
  | 'author_entity_header_album'
  | 'author_gallery_album'
  | 'publisher_avatar_album'
  | 'publisher_entity_header_album'
  | 'publisher_gallery_album'
  | 'user_avatar_album'
  | 'user_gallery_album'

// Entity types
type EntityType = 'book' | 'author' | 'publisher' | 'user'

interface EntityImage {
  image_id: string
  image_url: string
  thumbnail_url?: string
  alt_text?: string
  caption?: string
  display_order: number
  is_cover: boolean
  is_featured: boolean
  album_id: string
  album_name: string
  album_type: string
  metadata?: Record<string, any>
}

interface EntityAlbum {
  id: string
  name: string
  description?: string
  album_type: EntityAlbumType
  image_count: number
  is_system_album: boolean
  auto_generated: boolean
  is_public: boolean
  view_count: number
  like_count: number
  share_count: number
  created_at: string
  updated_at: string
}

interface EntityPhotoGalleryProps {
  entityId: string
  entityType: EntityType
  entityName?: string
  isOwner?: boolean
  className?: string
  showUploadButtons?: boolean
  showAlbumManagement?: boolean
  maxImagesPerAlbum?: number
}

export function EntityPhotoGallery({
  entityId,
  entityType,
  entityName,
  isOwner = false,
  className = '',
  showUploadButtons = true,
  showAlbumManagement = true,
  maxImagesPerAlbum = 100
}: EntityPhotoGalleryProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // State management
  const [albums, setAlbums] = useState<EntityAlbum[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState<EntityAlbum | null>(null)
  const [images, setImages] = useState<EntityImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'covers' | 'avatars' | 'headers' | 'gallery'>('overview')


  // Load entity albums
  const loadEntityAlbums = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('photo_albums')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform data to match EntityAlbum interface
      const transformedAlbums = (data || []).map(album => ({
        id: album.id,
        name: album.name,
        description: album.description,
        album_type: album.album_type as EntityAlbumType,
        image_count: 0, // Will be updated later
        is_system_album: album.is_system_album || false,
        auto_generated: album.auto_generated || false,
        is_public: album.is_public,
        view_count: album.view_count || 0,
        like_count: album.like_count || 0,
        share_count: album.share_count || 0,
        created_at: album.created_at,
        updated_at: album.updated_at
      }))

      setAlbums(transformedAlbums)
    } catch (error) {
      console.error('Error loading entity albums:', error)
      toast({
        title: "Error",
        description: "Failed to load entity albums",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [entityId, entityType, supabase, toast])

  // Load images for selected album
  const loadAlbumImages = useCallback(async (albumId: string) => {
    try {
      const { data, error } = await supabase
        .from('album_images')
        .select(`
          *,
          images (*)
        `)
        .eq('album_id', albumId)
        .order('display_order', { ascending: true })

      if (error) throw error

      // Transform data to match EntityImage interface
      const transformedImages = (data || []).map(item => ({
        image_id: item.image_id,
        image_url: item.images?.url || '',
        thumbnail_url: item.images?.thumbnail_url,
        alt_text: item.images?.alt_text,
        caption: item.images?.caption,
        display_order: item.display_order,
        is_cover: item.is_cover,
        is_featured: item.is_featured,
        album_id: item.album_id,
        album_name: '', // Will be filled by parent component
        album_type: '', // Will be filled by parent component
        metadata: item.metadata
      }))

      setImages(transformedImages)
    } catch (error) {
      console.error('Error loading album images:', error)
    }
  }, [supabase])



  // Handle image upload
  const handleImageUpload = useCallback(async (
    albumType: EntityAlbumType,
    aspectRatio: number = 1,
    isCover: boolean = false
  ) => {
    // Create a file input for image upload
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        // Get Cloudinary signature for signed upload
        const signatureResponse = await fetch('/api/cloudinary/signature', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            folder: `${entityType}_${albumType.replace('_album', '')}`
          })
        })

        if (!signatureResponse.ok) {
          throw new Error('Failed to get Cloudinary signature')
        }

        const signatureData = await signatureResponse.json()

        // Create FormData for signed upload to Cloudinary
        const formData = new FormData()
        formData.append('file', file)
        formData.append('api_key', signatureData.apiKey)
        formData.append('timestamp', signatureData.timestamp.toString())
        formData.append('signature', signatureData.signature)
        formData.append('folder', signatureData.folder)
        formData.append('cloud_name', signatureData.cloudName)
        formData.append('quality', '95')
        formData.append('fetch_format', 'auto')

        const uploadUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: formData
        })

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          throw new Error(`Failed to upload to Cloudinary: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`)
        }

        const uploadResult = await uploadResponse.json()

        if (!uploadResult.secure_url) {
          throw new Error('No secure URL returned from Cloudinary')
        }

        // Insert into images table using server action
        const imageInsertResponse = await fetch('/api/insert-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: uploadResult.secure_url,
            alt_text: `Entity image for ${entityType} ${entityName || entityId}`,
            storage_provider: 'cloudinary',
            storage_path: `authorsinfo/${entityType}_${albumType.replace('_album', '')}`,
            original_filename: file.name,
            file_size: file.size,
            mime_type: file.type
          })
        })

        if (!imageInsertResponse.ok) {
          const errorText = await imageInsertResponse.text()
          throw new Error(`Failed to insert image record: ${errorText}`)
        }

        const imageInsertResult = await imageInsertResponse.json()
        const imageData = imageInsertResult.data

        // Add image to entity album
        const albumResponse = await fetch('/api/entity-images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entityId,
            entityType,
            albumType,
            imageId: imageData.id,
            isCover,
            isFeatured: false,
            metadata: {
              aspect_ratio: aspectRatio,
              uploaded_via: 'entity_photo_gallery',
              original_filename: file.name,
              file_size: file.size
            }
          })
        })

        if (!albumResponse.ok) {
          const errorText = await albumResponse.text()
          throw new Error(`Failed to add image to album: ${errorText}`)
        }

        toast({
          title: "Success",
          description: "Image uploaded and added to album successfully"
        })
        
        // Reload albums and images
        await loadEntityAlbums()
        if (selectedAlbum) {
          await loadAlbumImages(selectedAlbum.id)
        }

      } catch (error) {
        console.error('Error uploading image:', error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to upload image",
          variant: "destructive"
        })
      }
    }
    input.click()
  }, [entityId, entityType, entityName, selectedAlbum, loadEntityAlbums, loadAlbumImages, toast])

  // Get album by type
  const getAlbumByType = useCallback((albumType: EntityAlbumType) => {
    return albums.find(album => album.album_type === albumType)
  }, [albums])

  // Get album purpose display name
  const getAlbumPurposeName = useCallback((albumType: EntityAlbumType) => {
    switch (albumType) {
      case 'book_cover_album':
      case 'author_entity_header_album':
        return 'Cover Images'
      case 'book_avatar_album':
      case 'author_avatar_album':
        return 'Avatar Images'
      case 'book_entity_header_album':
        return 'Header Images'
      case 'book_gallery_album':
      case 'author_gallery_album':
        return 'Gallery Images'
      default:
        return 'Images'
    }
  }, [])

  // Load data on mount
  useEffect(() => {
    loadEntityAlbums()
  }, [loadEntityAlbums])

  // Load images when album is selected
  useEffect(() => {
    if (selectedAlbum) {
      loadAlbumImages(selectedAlbum.id)
    }
  }, [selectedAlbum, loadAlbumImages])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Entity Images</h2>
          {entityName && (
            <p className="text-muted-foreground">
              Image management for {entityName}
            </p>
          )}
        </div>
        
        {isOwner && showAlbumManagement && (
          <div className="flex items-center gap-2">
            <PhotoAlbumCreator
              onAlbumCreated={loadEntityAlbums}
              entityType={entityType}
              entityId={entityId}
              trigger={
                <Button size="sm" variant="default">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Album
                </Button>
              }
            />
          </div>
        )}
      </div>

      {/* Album Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Album className="h-5 w-5" />
            Image Albums
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {albums.map((album) => (
              <Card key={album.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">{album.name}</h3>
                    {album.is_system_album && (
                      <Badge variant="secondary" className="text-xs">System</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      {album.image_count} images
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {album.view_count} views
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => setSelectedAlbum(album)}
                    >
                      View Album
                    </Button>
                    
                    {isOwner && showUploadButtons && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleImageUpload(
                          album.album_type as EntityAlbumType,
                          album.album_type.includes('avatar') ? 1 : 16/9,
                          album.album_type.includes('cover') || album.album_type.includes('header')
                        )}
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Add Image
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Upload Section */}
      {isOwner && showUploadButtons && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Quick Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Cover Image Upload */}
              <Button
                variant="default"
                className="h-20 flex-col gap-2"
                onClick={() => handleImageUpload(
                  entityType === 'book' ? 'book_cover_album' : 'author_entity_header_album',
                  16/9,
                  true
                )}
              >
                <ImageIcon className="h-6 w-6" />
                <span className="text-xs">Cover Image</span>
              </Button>

              {/* Avatar Upload */}
              <Button
                variant="default"
                className="h-20 flex-col gap-2"
                onClick={() => handleImageUpload(
                  entityType === 'book' ? 'book_avatar_album' : 'author_avatar_album',
                  1,
                  true
                )}
              >
                <ImageIcon className="h-6 w-6" />
                <span className="text-xs">Avatar</span>
              </Button>

              {/* Entity Header Upload */}
              {entityType === 'book' && (
                <Button
                  variant="default"
                  className="h-20 flex-col gap-2"
                  onClick={() => handleImageUpload('book_entity_header_album', 16/9, true)}
                >
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-xs">Header Image</span>
                </Button>
              )}

              {/* Gallery Upload */}
              <Button
                variant="default"
                className="h-20 flex-col gap-2"
                onClick={() => handleImageUpload(
                  entityType === 'book' ? 'book_gallery_album' : 'author_gallery_album',
                  4/3,
                  false
                )}
              >
                <Images className="h-6 w-6" />
                <span className="text-xs">Gallery</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Album Gallery */}
      {selectedAlbum && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedAlbum.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {getAlbumPurposeName(selectedAlbum.album_type as EntityAlbumType)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAlbum(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <EnterprisePhotoGallery
              entityId={entityId}
              entityType={entityType}
              initialAlbumId={selectedAlbum.id}
              isEditable={isOwner}
              showStats={true}
              showShare={true}
              maxImages={maxImagesPerAlbum}
              className="min-h-[400px]"
            />
          </CardContent>
        </Card>
      )}


    </div>
  )
} 