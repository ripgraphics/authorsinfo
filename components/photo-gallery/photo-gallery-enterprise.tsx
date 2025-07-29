import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { uploadPhoto } from '@/app/actions/upload-photo'
import { PhotoGalleryHeader } from './photo-gallery-header'
import { PhotoGalleryGrid } from './photo-gallery-grid'
import { PhotoGalleryEmpty } from './photo-gallery-empty'
import { PhotoGalleryLoading } from './photo-gallery-loading'
import './styles.css'

// Types based on actual database schema
interface PhotoAlbum {
  id: string
  name: string
  description?: string
  cover_image_id?: string
  owner_id: string
  is_public: boolean
  view_count: number
  like_count: number
  share_count: number
  entity_id?: string
  entity_type?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  deleted_at?: string
}

interface AlbumImage {
  id: string
  album_id: string
  image_id: string
  display_order: number
  is_cover: boolean
  is_featured: boolean
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

interface Image {
  id: string
  url: string
  alt_text?: string
  created_at: string
  updated_at: string
  thumbnail_url?: string
  medium_url?: string
  large_url?: string
  original_filename?: string
  file_size?: number
  width?: number
  height?: number
  format?: string
  mime_type?: string
  caption?: string
  metadata?: Record<string, any>
  storage_path?: string
  storage_provider?: string
  is_processed?: boolean
  processing_status?: string
  deleted_at?: string
  img_type_id?: string
}

interface PhotoGalleryProps {
  entityId: string
  entityType: 'user' | 'publisher' | 'author' | 'group'
  initialAlbumId?: string
  isEditable?: boolean
  showStats?: boolean
  showShare?: boolean
  maxImages?: number
  className?: string
  onPhotosUploaded?: (photoIds: string[]) => void
}

interface AlbumState {
  isLoading: boolean
  error: string | null
  album: PhotoAlbum | null
  images: (AlbumImage & { image: Image })[]
}

export function PhotoGallery({ 
  entityId, 
  entityType, 
  initialAlbumId, 
  isEditable = true,
  showStats = true,
  showShare = true,
  maxImages = 1000,
  className = '',
  onPhotosUploaded
}: PhotoGalleryProps) {
  const [currentAlbumId, setCurrentAlbumId] = useState<string | undefined>(initialAlbumId)
  const [albumState, setAlbumState] = useState<AlbumState>({
    isLoading: false,
    error: null,
    album: null,
    images: []
  })
  const [showCreateAlbum, setShowCreateAlbum] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')

  const supabase = createClientComponentClient()

  // Load album and images
  const loadAlbum = useCallback(async (albumId: string) => {
    setAlbumState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Get album details
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
          // Album not found, clear current album
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

      // Get album images with image details
      const { data: albumImages, error: imagesError } = await supabase
        .from('album_images')
        .select(`
          *,
          image:images(*)
        `)
        .eq('album_id', albumId)
        .order('display_order', { ascending: true })

      if (imagesError) throw imagesError

      setAlbumState({
        isLoading: false,
        error: null,
        album,
        images: albumImages || []
      })
    } catch (error) {
      console.error('Error loading album:', error)
      setAlbumState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load album'
      }))
    }
  }, [supabase, entityId, entityType])

  // Create new album
  const createAlbum = useCallback(async (name: string, description?: string): Promise<PhotoAlbum> => {
    try {
      const { data, error } = await supabase
        .from('photo_albums')
        .insert({
          name,
          description,
          owner_id: entityId, // Assuming entityId is the user ID for user albums
          entity_id: entityId,
          entity_type: entityType,
          is_public: false,
          metadata: {
            total_images: 0,
            total_size: 0,
            last_modified: new Date().toISOString()
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
  }, [supabase, entityId, entityType])

  // Add image to album
  const addImageToAlbum = useCallback(async (albumId: string, imageId: string, displayOrder?: number) => {
    try {
      const { error } = await supabase
        .from('album_images')
        .insert({
          album_id: albumId,
          image_id: imageId,
          display_order: displayOrder || 0,
          is_cover: false,
          is_featured: false
        })

      if (error) throw error

      // Reload album to get updated images
      await loadAlbum(albumId)
    } catch (error) {
      console.error('Error adding image to album:', error)
      throw error
    }
  }, [supabase, loadAlbum])

  // Remove image from album
  const removeImageFromAlbum = useCallback(async (albumId: string, imageId: string) => {
    try {
      const { error } = await supabase
        .from('album_images')
        .delete()
        .eq('album_id', albumId)
        .eq('image_id', imageId)

      if (error) throw error

      // Reload album to get updated images
      await loadAlbum(albumId)
    } catch (error) {
      console.error('Error removing image from album:', error)
      throw error
    }
  }, [supabase, loadAlbum])

  // Handle file upload
  const handleFileUpload = useCallback(async (files: File[]) => {
    console.log('Upload started with files:', files.length)
    
    try {
      if (!currentAlbumId) {
        console.log('Creating new album...')
        // Create a new album if none exists
        const album = await createAlbum('Photo Album')
        setCurrentAlbumId(album.id)
        await loadAlbum(album.id)
      }

      console.log('Uploading files to album:', currentAlbumId)

      // Track uploaded photo IDs for callback
      const uploadedPhotoIds: string[] = []

      // Upload files to storage and create image records
      for (const file of files) {
        console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type)
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          console.error('Invalid file type:', file.type)
          throw new Error(`Invalid file type: ${file.type}. Only images are allowed.`)
        }
        
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          console.error('File too large:', file.size)
          throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 10MB.`)
        }
        
        // Upload to Cloudinary using server action
        console.log('Uploading to Cloudinary via server action...')

        const uploadResult = await uploadPhoto(file, entityType, entityId, currentAlbumId)

        console.log('File uploaded to Cloudinary successfully:', {
          fileName: file.name,
          publicUrl: uploadResult.url,
          publicId: uploadResult.publicId,
          imageId: uploadResult.imageId
        })
        
        uploadedPhotoIds.push(uploadResult.imageId)
      }

      console.log('All files uploaded successfully')
      
      // Reload the album to show the new images
      if (currentAlbumId) {
        await loadAlbum(currentAlbumId)
      }
      
      // Notify parent component of successful upload
      if (onPhotosUploaded && uploadedPhotoIds.length > 0) {
        onPhotosUploaded(uploadedPhotoIds)
      }
      
    } catch (error) {
      console.error('Error uploading files:', error)
      // Show user-friendly error message
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [currentAlbumId, createAlbum, loadAlbum, addImageToAlbum, supabase, entityType, entityId])

  // Handle image deletion
  const handleImageDelete = useCallback(async (imageId: string) => {
    try {
      await removeImageFromAlbum(currentAlbumId!, imageId)
    } catch (error) {
      console.error('Error deleting image:', error)
    }
  }, [currentAlbumId, removeImageFromAlbum])

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
      console.error('Error creating album:', error)
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
    // Show empty state instead of error for better UX
    return (
      <div className={`photo-gallery-container ${className}`}>
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
      <div className="photo-gallery-empty">
        <div className="photo-gallery-empty-icon">📸</div>
        <div className="photo-gallery-empty-text">No album selected</div>
            <button
              className="photo-gallery-button"
            onClick={() => setShowCreateAlbum(true)}
          >
            Create Album
          </button>
      </div>
    )
  }

  if (albumState.images.length === 0) {
    return (
      <div className={`photo-gallery-container ${className}`}>
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

  return (
    <div className={`photo-gallery-container ${className}`}>
      <PhotoGalleryHeader
        albumId={currentAlbumId}
        entityType={entityType}
        entityId={entityId}
        isEditable={isEditable}
        showStats={showStats}
        showShare={showShare}
        onUpload={handleFileUpload}
      />
      <PhotoGalleryGrid
        images={albumState.images.map(ai => ({
          id: ai.image.id,
          url: ai.image.url,
          filename: ai.image.original_filename || 'image',
          filePath: ai.image.storage_path || '',
          size: ai.image.file_size || 0,
          type: ai.image.mime_type || 'image/jpeg',
          metadata: {
            width: ai.image.width || 0,
            height: ai.image.height || 0,
            uploaded_at: ai.image.created_at,
            ...ai.image.metadata
          },
          albumId: ai.album_id,
          entityType: entityType,
          entityId: entityId,
          altText: ai.image.alt_text,
          caption: ai.image.caption,
          isFeatured: ai.is_featured,
          displayOrder: ai.display_order,
          createdAt: ai.image.created_at,
          updatedAt: ai.image.updated_at
        }))}
        gridCols={3}
        isEditable={isEditable}
        showTags={false}
        onImageClick={(image) => {
          console.log('Image clicked:', image)
          // Handle image click - could open modal, etc.
        }}
        onImageDelete={async (imageId) => {
          await handleImageDelete(imageId.toString())
        }}
        onImageReorder={async (imageId, newOrder) => {
          // Implement reordering if needed
          console.log('Reorder:', imageId, newOrder)
        }}
        onImageTag={async (imageId, tags) => {
          // Implement tagging if needed
          console.log('Tag:', imageId, tags)
        }}
      />
    </div>
  )
} 