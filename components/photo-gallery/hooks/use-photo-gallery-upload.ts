import { useCallback, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { AlbumImageLegacy } from '../types'

interface UploadState {
  isUploading: boolean
  progress: number
  error: string | null
}

interface UploadOptions {
  maxFileSize?: number // in bytes
  allowedTypes?: string[]
  maxConcurrentUploads?: number
  storagePath?: string
}

export function usePhotoGalleryUpload(options: UploadOptions = {}) {
  const {
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    maxConcurrentUploads = 3,
    storagePath = 'images',
  } = options

  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Validate file
  const validateFile = useCallback(
    (file: File): string | null => {
      if (!allowedTypes.includes(file.type)) {
        return `File type ${file.type} is not supported`
      }

      if (file.size > maxFileSize) {
        return `File size exceeds ${maxFileSize / (1024 * 1024)}MB limit`
      }

      return null
    },
    [allowedTypes, maxFileSize]
  )

  // Upload single file
  const uploadFile = useCallback(
    async (
      file: File,
      albumId?: string,
      entityType?: string,
      entityId?: string
    ): Promise<AlbumImageLegacy> => {
      const error = validateFile(file)
      if (error) {
        throw new Error(error)
      }

      setUploadState((prev) => ({
        ...prev,
        isUploading: true,
        progress: 0,
        error: null,
      }))

      try {
        // Generate unique filename
        const timestamp = Date.now()
        const extension = file.name.split('.').pop()
        const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`
        const filePath = `${storagePath}/${filename}`

        // Upload to storage
        const { data: _uploadData, error: uploadError } = await supabase.storage
          .from(storagePath)
          .upload(filename, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from(storagePath).getPublicUrl(filename)

        // Create image record
        const { data: imageData, error: imageError } = await supabase
          .from('images')
          .insert({
            url: publicUrl,
            filename,
            file_path: filePath,
            size: file.size,
            type: file.type,
            metadata: {
              width: 0, // Will be updated after processing
              height: 0,
              uploaded_at: new Date().toISOString(),
            },
          })
          .select()
          .single()

        if (imageError) throw imageError

        // Create album image record if albumId is provided
        if (albumId) {
          const { error: albumImageError } = await supabase.from('album_images').insert({
            album_id: albumId,
            image_id: imageData.id,
            display_order: 0, // Will be updated after processing
          })

          if (albumImageError) throw albumImageError
        }

        // Create entity image record if entityType and entityId are provided
        if (entityType && entityId) {
          const { error: entityImageError } = await supabase.from('entity_images').insert({
            entity_type: entityType,
            entity_id: entityId,
            image_id: imageData.id,
          })

          if (entityImageError) throw entityImageError
        }

        setUploadState((prev) => ({
          ...prev,
          isUploading: false,
          progress: 100,
        }))

        return {
          id: imageData.id,
          url: publicUrl,
          filename,
          filePath,
          size: file.size,
          type: file.type,
          metadata: imageData.metadata || {},
          albumId,
          entityType,
          entityId,
          createdAt: imageData.created_at || new Date().toISOString(),
          updatedAt: imageData.updated_at || new Date().toISOString(),
        }
      } catch (error) {
        setUploadState((prev) => ({
          ...prev,
          isUploading: false,
          error: error instanceof Error ? error.message : 'Failed to upload file',
        }))
        throw error
      }
    },
    [validateFile, storagePath, supabase]
  )

  // Upload multiple files
  const uploadFiles = useCallback(
    async (
      files: File[],
      albumId?: string,
      entityType?: string,
      entityId?: string
    ): Promise<AlbumImageLegacy[]> => {
      setUploadState((prev) => ({
        ...prev,
        isUploading: true,
        progress: 0,
        error: null,
      }))

      try {
        const results: AlbumImageLegacy[] = []
        const totalFiles = files.length
        let completedFiles = 0

        // Process files in chunks to limit concurrent uploads
        for (let i = 0; i < totalFiles; i += maxConcurrentUploads) {
          const chunk = files.slice(i, i + maxConcurrentUploads)
          const chunkPromises = chunk.map((file) => uploadFile(file, albumId, entityType, entityId))

          const chunkResults = await Promise.all(chunkPromises)
          results.push(...chunkResults)

          completedFiles += chunk.length
          setUploadState((prev) => ({
            ...prev,
            progress: (completedFiles / totalFiles) * 100,
          }))
        }

        setUploadState((prev) => ({
          ...prev,
          isUploading: false,
          progress: 100,
        }))

        return results
      } catch (error) {
        setUploadState((prev) => ({
          ...prev,
          isUploading: false,
          error: error instanceof Error ? error.message : 'Failed to upload files',
        }))
        throw error
      }
    },
    [uploadFile, maxConcurrentUploads]
  )

  // Delete file
  const deleteFile = useCallback(
    async (image: AlbumImageLegacy): Promise<void> => {
      try {
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from(storagePath)
          .remove([image.filename])

        if (storageError) throw storageError

        // Delete image record
        const { error: imageError } = await supabase.from('images').delete().eq('id', image.id)

        if (imageError) throw imageError

        // Delete album image record if exists
        if (image.albumId) {
          const { error: albumImageError } = await supabase
            .from('album_images')
            .delete()
            .eq('image_id', image.id)
            .eq('album_id', image.albumId)

          if (albumImageError) throw albumImageError
        }

        // Delete entity image record if exists
        if (image.entityType && image.entityId) {
          const { error: entityImageError } = await supabase
            .from('entity_images')
            .delete()
            .eq('image_id', image.id)
            .eq('entity_type', image.entityType)
            .eq('entity_id', image.entityId)

          if (entityImageError) throw entityImageError
        }
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to delete file')
      }
    },
    [storagePath, supabase]
  )

  return {
    uploadState,
    uploadFile,
    uploadFiles,
    deleteFile,
  }
}
