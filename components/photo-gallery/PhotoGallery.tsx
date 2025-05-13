import { useState, useEffect, useCallback } from 'react'
import { usePhotoGalleryAlbum } from './hooks/use-photo-gallery-album'
import { usePhotoGalleryFilters } from './hooks/use-photo-gallery-filters'
import { usePhotoGalleryVirtualization } from './hooks/use-photo-gallery-virtualization'
import { usePhotoGalleryAccessibility } from './hooks/use-photo-gallery-accessibility'
import { usePhotoGalleryOptimization } from './hooks/use-photo-gallery-optimization'
import { usePhotoGalleryUpload } from './hooks/use-photo-gallery-upload'
import { usePhotoGallerySharing } from './hooks/use-photo-gallery-sharing'
import { usePhotoGalleryBatch } from './hooks/use-photo-gallery-batch'
import { usePhotoGalleryEditor } from './hooks/use-photo-gallery-editor'
import { usePhotoGalleryAnalytics } from './hooks/use-photo-gallery-analytics'
import { usePhotoGalleryMetadata } from './hooks/use-photo-gallery-metadata'
import type { AlbumImage } from './types'
import './styles.css'

interface PhotoGalleryProps {
  bookId: string
  initialAlbumId?: string
}

export function PhotoGallery({ bookId, initialAlbumId }: PhotoGalleryProps) {
  const [currentAlbumId, setCurrentAlbumId] = useState<string | undefined>(initialAlbumId)
  const [images, setImages] = useState<AlbumImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateAlbum, setShowCreateAlbum] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')

  // Initialize hooks
  const {
    album,
    loading: albumLoading,
    error: albumError,
    getAlbumImages,
    addImageToAlbum,
    removeImageFromAlbum,
    reorderImages,
    updateAlbumMetadata,
    createAlbum
  } = usePhotoGalleryAlbum({
    autoUpdateMetadata: true,
    maxImages: 1000
  })

  const {
    filters,
    updateFilters,
    filteredImages,
    clearFilters
  } = usePhotoGalleryFilters(images)

  const {
    containerRef,
    virtualItems,
    totalSize,
    scrollToIndex,
    handleScroll,
    getItemStyle,
    handleImageLoad,
  } = usePhotoGalleryVirtualization({
    items: filteredImages,
    itemHeight: 300,
    overscan: 5,
    containerHeight: 800,
    gridCols: 3,
  })

  const {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    registerImageRef,
    getImageAriaAttributes,
    getContainerAriaAttributes
  } = usePhotoGalleryAccessibility(filteredImages, {
    onImageSelect: (index) => {
      // Handle image selection
    },
    onImageDelete: (index) => {
      // Handle image deletion
    },
    onImageEdit: (index) => {
      // Handle image editing
    },
    onImageShare: (index) => {
      // Handle image sharing
    },
    onFullscreenToggle: (index) => {
      // Handle fullscreen toggle
    }
  })

  const {
    getOptimizedImageUrl,
    preloadImages,
    clearCache
  } = usePhotoGalleryOptimization({
    maxCacheSize: 100,
    maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
    imageQuality: 0.8,
    format: 'webp'
  })

  const {
    uploadFile,
    uploadFiles,
    deleteFile,
    uploadState,
    uploadProgress
  } = usePhotoGalleryUpload({
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxConcurrentUploads: 3,
    storagePath: `books/${bookId}/photos`
  })

  const {
    generateShareLink,
    getShareLink,
    incrementViewCount,
    deleteShareLink,
    getSharedImage,
    verifyShareLinkPassword
  } = usePhotoGallerySharing()

  const {
    selectedImages,
    toggleImageSelection,
    clearSelection,
    deleteSelectedImages,
    shareSelectedImages,
    downloadSelectedImages
  } = usePhotoGalleryBatch()

  const {
    editImage,
    applyEdit,
    undoEdit,
    redoEdit,
    getEditHistory,
    clearEditHistory
  } = usePhotoGalleryEditor()

  const {
    trackEvent,
    getAnalytics,
    clearAnalytics
  } = usePhotoGalleryAnalytics()

  const {
    getImageMetadata,
    clearMetadataCache
  } = usePhotoGalleryMetadata({
    extractExif: true,
    extractGps: false
  })

  // Load album and images
  useEffect(() => {
    const loadAlbum = async () => {
      if (currentAlbumId) {
        setIsLoading(true)
        try {
          const albumImages = await getAlbumImages(currentAlbumId)
          setImages(albumImages)
        } catch (error) {
          console.error('Error loading album:', error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    loadAlbum()
  }, [currentAlbumId, getAlbumImages])

  // Apply filters when images change
  useEffect(() => {
    if (updateFilters) {
      updateFilters({ images })
    }
  }, [images, updateFilters])

  // Preload visible images
  useEffect(() => {
    const visibleImages = virtualItems.map(item => filteredImages[item.index])
    preloadImages(visibleImages)
  }, [virtualItems, filteredImages, preloadImages])

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    try {
      if (!currentAlbumId) {
        // Create a new album if none exists
        const album = await createAlbum('Book Photos')
        setCurrentAlbumId(album.id)
      }

      const uploadedImages = await uploadFiles(Array.from(files))
      if (currentAlbumId) {
        for (const image of uploadedImages) {
          await addImageToAlbum(currentAlbumId, image.id)
        }
        // Reload album images
        const albumImages = await getAlbumImages(currentAlbumId)
        setImages(albumImages)
      }
    } catch (error) {
      console.error('Error uploading files:', error)
    }
  }, [currentAlbumId, uploadFiles, addImageToAlbum, createAlbum, getAlbumImages])

  // Handle image selection
  const handleImageSelect = useCallback((image: AlbumImage) => {
    toggleImageSelection(image)
    trackEvent({
      type: 'click',
      albumId: currentAlbumId,
      imageId: image.id
    })
  }, [toggleImageSelection, trackEvent, currentAlbumId])

  // Handle image deletion
  const handleImageDelete = useCallback(async (image: AlbumImage) => {
    try {
      await deleteFile(image.id)
      if (currentAlbumId) {
        await removeImageFromAlbum(currentAlbumId, image.id)
      }
      trackEvent({
        type: 'delete',
        albumId: currentAlbumId,
        imageId: image.id
      })
    } catch (error) {
      console.error('Error deleting image:', error)
    }
  }, [currentAlbumId, deleteFile, removeImageFromAlbum, trackEvent])

  // Handle image editing
  const handleImageEdit = useCallback(async (image: AlbumImage, edit: any) => {
    try {
      const editedImage = await editImage(image, edit)
      trackEvent({
        type: 'edit',
        albumId: currentAlbumId,
        imageId: image.id
      })
      return editedImage
    } catch (error) {
      console.error('Error editing image:', error)
    }
  }, [editImage, trackEvent, currentAlbumId])

  // Handle image sharing
  const handleImageShare = useCallback(async (image: AlbumImage) => {
    try {
      const shareLink = await generateShareLink(image.id)
      trackEvent({
        type: 'share',
        albumId: currentAlbumId,
        imageId: image.id
      })
      return shareLink
    } catch (error) {
      console.error('Error sharing image:', error)
    }
  }, [generateShareLink, trackEvent, currentAlbumId])

  // Handle album creation
  const handleCreateAlbum = useCallback(async () => {
    try {
      const album = await createAlbum(newAlbumName)
      setCurrentAlbumId(album.id)
      setShowCreateAlbum(false)
      setNewAlbumName('')
    } catch (error) {
      console.error('Error creating album:', error)
    }
  }, [createAlbum, newAlbumName])

  if (isLoading || albumLoading) {
    return (
      <div className="photo-gallery-loading">
        Loading photos...
      </div>
    )
  }

  if (albumError) {
    return (
      <div className="photo-gallery-error">
        Error loading photos: {albumError.message}
      </div>
    )
  }

  if (!currentAlbumId) {
    return (
      <div className="photo-gallery-empty">
        <div className="photo-gallery-empty-icon">📸</div>
        <div className="photo-gallery-empty-text">No photo album yet</div>
        {showCreateAlbum ? (
          <div className="photo-gallery-create-album">
            <input
              type="text"
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              placeholder="Enter album name"
              className="photo-gallery-input"
            />
            <button
              onClick={handleCreateAlbum}
              className="photo-gallery-button"
              disabled={!newAlbumName.trim()}
            >
              Create Album
            </button>
            <button
              onClick={() => setShowCreateAlbum(false)}
              className="photo-gallery-button photo-gallery-button-secondary"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCreateAlbum(true)}
            className="photo-gallery-button"
          >
            Create Album
          </button>
        )}
      </div>
    )
  }

  if (!images.length) {
    return (
      <div className="photo-gallery-empty">
        <div className="photo-gallery-empty-icon">📸</div>
        <div className="photo-gallery-empty-text">No photos yet</div>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
          id="photo-upload"
        />
        <label
          htmlFor="photo-upload"
          className="photo-gallery-upload-button"
        >
          Add Photos
        </label>
      </div>
    )
  }

  return (
    <div className="photo-gallery" {...getContainerAriaAttributes()}>
      <div
        ref={containerRef}
        className="photo-gallery-grid"
        style={{ height: totalSize }}
        onKeyDown={handleKeyDown}
      >
        {virtualItems.map((virtualItem) => {
          const image = filteredImages[virtualItem.index]
          return (
            <div
              key={image.id}
              ref={registerImageRef(virtualItem.index)}
              className="photo-gallery-item"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: virtualItem.size,
                height: virtualItem.size,
                transform: `translateY(${virtualItem.start}px)`
              }}
              {...getImageAriaAttributes(virtualItem.index)}
            >
              <img
                src={getOptimizedImageUrl(image.url)}
                alt={image.altText || ''}
                loading="lazy"
                onClick={() => handleImageSelect(image)}
              />
            </div>
          )
        })}
      </div>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        className="hidden"
        id="photo-upload"
      />
      <label
        htmlFor="photo-upload"
        className="photo-gallery-upload-button"
      >
        Add Photos
      </label>

      {selectedImages.length > 0 && (
        <div className="photo-gallery-selection-mode">
          {selectedImages.length} photos selected
        </div>
      )}

      {uploadState === 'uploading' && (
        <div className="photo-gallery-upload-progress">
          Uploading... {Math.round(uploadProgress * 100)}%
        </div>
      )}
    </div>
  )
} 