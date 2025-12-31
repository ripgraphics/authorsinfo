'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { uploadImage } from '@/app/actions/upload'
import { linkImagesToAlbum } from '@/app/actions/album-images'
import { Plus, Loader2, Camera, Image as ImageIcon } from 'lucide-react'

export type EntityType = 'user' | 'publisher' | 'author' | 'group' | 'book' | 'event' | 'content'
export type UploadContext = 'avatar' | 'cover' | 'gallery' | 'album' | 'banner' | 'thumbnail'

interface EnterpriseImageUploadConfig {
  maxFiles?: number
  maxFileSize?: number // in bytes
  allowedTypes?: string[]
  enableCompression?: boolean
  enableWatermark?: boolean
  enableAnalytics?: boolean
  enableModeration?: boolean
  targetWidth?: number
  targetHeight?: number
}

interface EnterpriseImageUploadProps {
  entityId: string
  entityType: EntityType
  context: UploadContext
  albumId?: string
  onUploadComplete?: (imageIds: string[]) => void
  onUploadStart?: () => void
  onUploadError?: (error: Error) => void
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showIcon?: boolean
  buttonText?: string
  disabled?: boolean
  isOwner?: boolean
  config?: EnterpriseImageUploadConfig
}

const DEFAULT_CONFIG: EnterpriseImageUploadConfig = {
  maxFiles: 10,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'],
  enableCompression: true,
  enableWatermark: false,
  enableAnalytics: true,
  enableModeration: true,
  targetWidth: 1200,
  targetHeight: 1200,
}

export function EnterpriseImageUpload({
  entityId,
  entityType,
  context,
  albumId,
  onUploadComplete,
  onUploadStart,
  onUploadError,
  className = '',
  variant = 'default',
  size = 'sm',
  showIcon = true,
  buttonText,
  disabled = false,
  isOwner = true,
  config = {},
}: EnterpriseImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Merge default config with provided config
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  // Don't show upload button if user is not the owner
  if (!isOwner) {
    return null
  }

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!finalConfig.allowedTypes!.includes(file.type)) {
      return `File type ${file.type} is not allowed. Allowed types: ${finalConfig.allowedTypes!.join(', ')}`
    }

    // Check file size
    if (file.size > finalConfig.maxFileSize!) {
      const maxSizeMB = (finalConfig.maxFileSize! / 1024 / 1024).toFixed(1)
      return `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds maximum of ${maxSizeMB}MB`
    }

    return null
  }

  const getCloudinaryFolder = (): string => {
    // Enterprise-grade folder structure
    if (albumId) {
      return `${entityType}_${context}_album_${albumId}`
    }
    return `${entityType}_${context}`
  }

  const getImageAltText = (index?: number): string => {
    const suffix = index !== undefined ? ` ${index + 1}` : ''
    if (albumId) {
      return `${context} image${suffix} for ${entityType} album ${albumId}`
    }
    return `${context} image${suffix} for ${entityType} ${entityId}`
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    if (files.length === 0) return

    // Validate number of files
    if (files.length > finalConfig.maxFiles!) {
      toast({
        title: 'Too many files',
        description: `Maximum ${finalConfig.maxFiles} files allowed`,
        variant: 'destructive',
      })
      return
    }

    // Validate each file
    for (const file of files) {
      const error = validateFile(file)
      if (error) {
        toast({
          title: 'Invalid file',
          description: error,
          variant: 'destructive',
        })
        return
      }
    }

    setIsUploading(true)
    setUploadProgress(0)
    onUploadStart?.()

    const uploadedImageIds: string[] = []
    const totalFiles = files.length
    const folder = getCloudinaryFolder()

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Update progress
        const progress = ((i + 1) / totalFiles) * 100
        setUploadProgress(progress)

        // Convert file to base64
        const reader = new FileReader()
        reader.readAsDataURL(file)

        await new Promise<void>((resolve, reject) => {
          reader.onload = async () => {
            try {
              const base64Image = reader.result as string
              // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
              const base64Data = base64Image.split(',')[1]

              const altText = getImageAltText(i)

              // Upload using the working uploadImage action with proper enterprise folder structure
              const result = await uploadImage(
                base64Data,
                folder,
                altText,
                finalConfig.targetWidth,
                finalConfig.targetHeight
              )

              if (result && result.imageId) {
                uploadedImageIds.push(result.imageId)
              }
              resolve()
            } catch (error) {
              reject(error)
            }
          }

          reader.onerror = () => {
            reject(new Error('Failed to read file'))
          }
        })
      }

      // If uploading to an album, link the images to the album
      if (albumId && uploadedImageIds.length > 0) {
        const linkResult = await linkImagesToAlbum(uploadedImageIds, albumId, entityId, entityType)

        if (!linkResult.success) {
          console.error('Failed to link images to album:', linkResult.error)
          toast({
            title: 'Partial success',
            description: `Images uploaded but failed to add to album: ${linkResult.error}`,
            variant: 'destructive',
          })
          return
        }
      }

      // Success notification
      toast({
        title: 'Upload successful',
        description: `Successfully uploaded ${uploadedImageIds.length} image${uploadedImageIds.length !== 1 ? 's' : ''}${albumId ? ' to album' : ''}`,
      })

      // Call completion callback
      onUploadComplete?.(uploadedImageIds)
    } catch (error) {
      console.error('Error uploading images:', error)

      const errorMessage = error instanceof Error ? error.message : 'Failed to upload images'

      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive',
      })

      onUploadError?.(error instanceof Error ? error : new Error(errorMessage))
    } finally {
      setIsUploading(false)
      setUploadProgress(0)

      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const getButtonText = () => {
    if (buttonText) return buttonText
    if (isUploading) return 'Uploading...'

    // Context-aware button text
    switch (context) {
      case 'avatar':
        return 'Upload Avatar'
      case 'cover':
        return 'Upload Cover'
      case 'gallery':
        return 'Add Photos'
      case 'album':
        return 'Add to Album'
      case 'banner':
        return 'Upload Banner'
      case 'thumbnail':
        return 'Upload Thumbnail'
      default:
        return 'Upload Image'
    }
  }

  const getIcon = () => {
    if (isUploading) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    if (showIcon) {
      // Context-aware icons
      switch (context) {
        case 'avatar':
        case 'cover':
          return <Camera className="h-4 w-4" />
        case 'gallery':
        case 'album':
          return <Plus className="h-4 w-4" />
        default:
          return <ImageIcon className="h-4 w-4" />
      }
    }
    return null
  }

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className={`enterprise-image-upload ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple={context === 'gallery' || context === 'album'}
        accept={finalConfig.allowedTypes!.join(',')}
        onChange={handleFileSelect}
        disabled={isUploading || disabled}
      />
      <Button
        variant={variant}
        size={size}
        className="enterprise-image-upload-button flex items-center gap-2 cursor-pointer"
        disabled={isUploading || disabled}
        onClick={handleButtonClick}
      >
        {getIcon()}
        {getButtonText()}
      </Button>

      {/* Progress indicator */}
      {isUploading && uploadProgress > 0 && (
        <div className="enterprise-image-upload-progress mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(uploadProgress)}% complete
          </p>
        </div>
      )}
    </div>
  )
}
