"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Camera, Crop, ImageIcon } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { clearCache } from '@/lib/request-utils'
import { isValidCloudinaryUrl, validateAndSanitizeImageUrl } from '@/lib/utils/image-url-validation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ImageCropper } from '@/components/ui/image-cropper'
import { cn } from '@/lib/utils'

declare global {
  interface Window {
    cloudinary: any;
  }
}

interface EntityImageUploadProps {
  entityId: string
  entityType: 'author' | 'publisher' | 'book' | 'group' | 'user' | 'event' | 'photo'
  currentImageUrl?: string
  onImageChange: (newImageUrl: string, newImageId?: string) => void
  type: 'avatar' | 'bookCover' | 'entityHeaderCover'
  className?: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  // Fully reusable props - all optional with smart defaults
  aspectRatio?: number // Crop aspect ratio (defaults based on type)
  targetWidth?: number // Output width in pixels
  targetHeight?: number // Output height in pixels
  previewAspectRatio?: string // CSS aspect ratio class for preview (e.g., 'aspect-[2/3]')
  dialogMaxWidth?: string // Dialog max width class (default: 'max-w-4xl' for cover, 'sm:max-w-[425px]' for avatar)
  circularCrop?: boolean // Enable circular crop (default: true for avatar, false for cover)
}

const IMAGE_TYPE_IDS = {
  user: {
    avatar: 33, // user_avatar
    entityHeaderCover: 32,  // user_cover (entity header)
  },
  group: {
    avatar: 35, // group_avatar
    entityHeaderCover: 34,  // group_cover (entity header)
  },
  author: {
    avatar: 37, // author_avatar
    entityHeaderCover: 36,  // author_cover (entity header)
  },
  publisher: {
    avatar: 39, // publisher_avatar
    entityHeaderCover: 38,  // publisher_cover (entity header)
  },
  book: {
    avatar: 41, // book_avatar
    entityHeaderCover: 40,  // book_cover (entity header)
    bookCover: 40,  // book_cover (actual book cover - uses same ID but different purpose)
  },
  event: {
    avatar: 43, // event_avatar
    entityHeaderCover: 42,  // event_cover (entity header)
  },
  photo: {
    avatar: 45, // photo_avatar
    entityHeaderCover: 44,  // photo_cover (entity header)
  }
}

export function EntityImageUpload({
  entityId,
  entityType,
  currentImageUrl,
  onImageChange,
  type,
  className = '',
  isOpen,
  onOpenChange,
  aspectRatio: propAspectRatio,
  targetWidth: propTargetWidth,
  targetHeight: propTargetHeight,
  previewAspectRatio: propPreviewAspectRatio,
  dialogMaxWidth: propDialogMaxWidth,
  circularCrop: propCircularCrop
}: EntityImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [croppedImage, setCroppedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    // Load Cloudinary Upload Widget script
    const script = document.createElement('script')
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  // Reset modal state when it opens
  useEffect(() => {
    if (isOpen) {
      // Clean up any existing blob URLs to prevent memory leaks
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
      if (croppedImage && croppedImage.startsWith('blob:')) {
        URL.revokeObjectURL(croppedImage)
      }
      
      // Reset all state to ensure fresh start
      setSelectedFile(null)
      setPreview(null)
      setCroppedImage(null)
      setShowCropper(false)
      setIsUploading(false)
    }
  }, [isOpen])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)
      setCroppedImage(null) // Reset cropped image when new file is selected
    }
  }

  const handleCrop = (croppedImageBlob: Blob) => {
    const croppedImageUrl = URL.createObjectURL(croppedImageBlob)
    setCroppedImage(croppedImageUrl)
    setShowCropper(false)
  }

  const handleCropCancel = () => {
    setShowCropper(false)
  }

  const handleUpload = async () => {
    const imageToUpload = croppedImage || preview
    if (!imageToUpload) {
      console.error('❌ [UPLOAD] No image to upload')
      return
    }

    console.log(`🚀 [UPLOAD] Starting upload process for ${entityType} ${entityId}, type: ${type}`)
    setIsUploading(true)
    try {
      // If we have a cropped image, we need to convert it to a file first
      let fileToUpload = selectedFile
      if (croppedImage) {
        // Convert blob URL to file
        const response = await fetch(croppedImage)
        const blob = await response.blob()
        fileToUpload = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' })
      }

      if (!fileToUpload) {
        throw new Error('No file to upload')
      }

      // Store the old image URL for potential cleanup
      const oldImageUrl = currentImageUrl

      // Always use server-side API route for uploads (works for both cropped and non-cropped)
      // Map component type to API imageType (both bookCover and entityHeaderCover use 'cover' for column mapping)
      const imageType = type === 'bookCover' || type === 'entityHeaderCover' ? 'cover' : type
      console.log(`📤 [UPLOAD] Preparing upload to Cloudinary...`)
      console.log(`📤 [UPLOAD] File name: ${fileToUpload.name}, size: ${fileToUpload.size} bytes`)
      console.log(`📤 [UPLOAD] Entity: ${entityType} ${entityId}, imageType: ${imageType}, originalType: ${type}`)
      
      const formData = new FormData()
      formData.append('file', fileToUpload)
      formData.append('entityType', entityType)
      formData.append('entityId', entityId)
      formData.append('imageType', imageType)
      formData.append('originalType', type) // Pass original type so upload route can determine correct folder

      console.log(`📤 [UPLOAD] Calling POST /api/upload/entity-image...`)
      const uploadResponse = await fetch('/api/upload/entity-image', {
        method: 'POST',
        body: formData
      })
      
      console.log(`📤 [UPLOAD] Upload response status: ${uploadResponse.status} ${uploadResponse.statusText}`)

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        console.error(`❌ [UPLOAD] Cloudinary upload failed:`, errorData)
        throw new Error(errorData.error || 'Failed to upload to Cloudinary')
      }

      const uploadResult = await uploadResponse.json()
      console.log(`✅ [UPLOAD] Cloudinary upload successful`)
      console.log(`✅ [UPLOAD] Image URL: ${uploadResult.url}`)
      console.log(`✅ [UPLOAD] Image ID: ${uploadResult.image_id}`)
      console.log(`✅ [UPLOAD] Public ID: ${uploadResult.public_id}`)

      // Validate that the upload result contains a valid Cloudinary URL
      if (!uploadResult.url || !isValidCloudinaryUrl(uploadResult.url)) {
        console.error('❌ Invalid URL received from upload API:', uploadResult.url)
        throw new Error('Invalid image URL received from server. Please try again.')
      }

      // CRITICAL: Verify that image_id exists - this confirms the image was saved to Supabase
      if (!uploadResult.image_id) {
        console.error('❌ Upload API did not return image_id - image may not be in database')
        throw new Error('Image upload failed: Image was not saved to database. Please try again.')
      }

      console.log(`✅ Upload successful: Image ID ${uploadResult.image_id} saved to Supabase`)

      // VERIFY: Confirm the image actually exists in the database before proceeding
      try {
        const verifyResponse = await fetch(`/api/debug/table-schema?table=images`)
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json()
          const imageExists = verifyData.allData?.some((img: any) => img.id === uploadResult.image_id)
          if (!imageExists) {
            console.error('❌ Verification failed: Image not found in database after upload')
            throw new Error('Image upload verification failed: Image was not found in database. Please try again.')
          }
          console.log(`✅ Verification passed: Image ${uploadResult.image_id} confirmed in database`)
        }
      } catch (verifyError) {
        console.warn('⚠️ Could not verify image in database (verification endpoint may not be available):', verifyError)
        // Continue anyway - the upload API should have verified it
      }

      // Add image to entity album
      // Map component type to API albumPurpose
      const albumPurpose = type === 'bookCover' ? 'cover' : type === 'entityHeaderCover' ? 'entity_header' : type
      
      console.log(`📁 [ALBUM] Starting album addition process`)
      console.log(`📁 [ALBUM] Image ID: ${uploadResult.image_id}`)
      console.log(`📁 [ALBUM] Entity: ${entityType} ${entityId}`)
      console.log(`📁 [ALBUM] Album Purpose: ${albumPurpose}`)
      
      try {
        console.log(`📁 [ALBUM] Calling POST /api/entity-images...`)
        const albumResponse = await fetch('/api/entity-images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entityId: entityId,
            entityType: entityType,
            albumPurpose: albumPurpose,
            imageId: uploadResult.image_id,
            isCover: true,
            isFeatured: true,
            metadata: {
              aspect_ratio: (type === 'bookCover' || type === 'entityHeaderCover') ? 16/9 : 1,
              uploaded_via: 'entity_image_upload',
              original_filename: fileToUpload.name,
              file_size: fileToUpload.size
            }
          })
        })

        console.log(`📁 [ALBUM] Response status: ${albumResponse.status} ${albumResponse.statusText}`)

        if (!albumResponse.ok) {
          let errorText: string
          try {
            const errorJson = await albumResponse.json()
            errorText = errorJson.error || errorJson.message || JSON.stringify(errorJson)
          } catch {
            errorText = await albumResponse.text() || `HTTP ${albumResponse.status} ${albumResponse.statusText}`
          }
          
          console.error('❌ [ALBUM] Failed to add image to album:', errorText)
          console.error('❌ [ALBUM] Image ID:', uploadResult.image_id)
          console.error('❌ [ALBUM] Entity:', { entityId, entityType, albumPurpose })
          console.error('❌ [ALBUM] Full response:', { status: albumResponse.status, statusText: albumResponse.statusText })
          
          // CRITICAL: Throw ALL errors - album creation is required for the upload to be considered successful
          throw new Error(`Failed to add image to album: ${errorText}`)
        }
        
        const albumResult = await albumResponse.json()
        console.log(`✅ [ALBUM] Image added to album successfully:`, albumResult)
        console.log(`✅ [ALBUM] Album ID: ${albumResult.albumId || 'N/A'}`)
        console.log(`✅ [ALBUM] Image ID in album: ${albumResult.imageId || 'N/A'}`)
      } catch (albumErr) {
        // ALWAYS throw album errors - album creation is critical
        console.error('❌ [ALBUM] CRITICAL ERROR: Album addition failed completely')
        console.error('❌ [ALBUM] Error details:', albumErr)
        console.error('❌ [ALBUM] Image ID:', uploadResult.image_id)
        console.error('❌ [ALBUM] Entity:', { entityId, entityType, albumPurpose })
        
        // Re-throw with a clear error message
        const errorMessage = albumErr instanceof Error 
          ? albumErr.message 
          : `Unknown error: ${String(albumErr)}`
        
        throw new Error(`Album creation failed: ${errorMessage}. Image was uploaded but may not appear in albums.`)
      }

      // Optionally delete old image from Cloudinary (only if it's a Cloudinary URL)
      if (oldImageUrl && oldImageUrl.includes('cloudinary.com')) {
        try {
          // Extract public ID from Cloudinary URL (including folder path)
          const urlParts = oldImageUrl.split('/')
          const uploadIndex = urlParts.findIndex(part => part === 'upload')
          if (uploadIndex > -1 && uploadIndex < urlParts.length - 1) {
            const pathParts = urlParts.slice(uploadIndex + 1)
            const filename = pathParts[pathParts.length - 1]
            const publicIdWithoutExt = filename.split('.')[0]
            
            let publicId = publicIdWithoutExt
            if (pathParts.length > 1) {
              const folderPath = pathParts.slice(0, -1).join('/')
              publicId = `${folderPath}/${publicIdWithoutExt}`
            }
            
            await fetch('/api/cloudinary/delete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ publicId })
            })
            
            console.log('Old image deleted from Cloudinary:', publicId)
          }
        } catch (deleteError) {
          console.warn('Failed to delete old image from Cloudinary:', deleteError)
          // Don't fail the upload if deletion fails
        }
      }

      // Validate and sanitize the URL before passing to callback
      const validatedUrl = validateAndSanitizeImageUrl(uploadResult.url)
      if (!validatedUrl) {
        throw new Error('Invalid image URL. Please try uploading again.')
      }

      // FINAL VERIFICATION: Ensure we have both URL and image_id before proceeding
      if (!uploadResult.image_id) {
        console.error('❌ CRITICAL: Upload completed but image_id is missing')
        throw new Error('Image upload failed: Image was not properly saved to database. Please try again.')
      }

      console.log(`✅ Upload verification complete: Image ${uploadResult.image_id} is in Supabase database`)

      // Clear preview state immediately after successful upload
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
      if (croppedImage && croppedImage.startsWith('blob:')) {
        URL.revokeObjectURL(croppedImage)
      }

      // Only pass validated Cloudinary URL to callback - image is confirmed in database
      // Album addition has already succeeded at this point (or we would have thrown)
      console.log(`✅ [UPLOAD] All steps completed successfully - calling onImageChange`)
      onImageChange(validatedUrl, uploadResult.image_id)
      
      // Clear cache for entity images to force fresh data on next load
      clearCache(`entity-avatar-${entityType}-${entityId}`)
      clearCache(`entity-header-${entityType}-${entityId}`)
      
      // Dispatch event to trigger EntityHeader to refetch images
      window.dispatchEvent(new CustomEvent('entityImageChanged', {
        detail: { entityType, entityId, imageType: type }
      }))
      
      // Dispatch event to refresh albums
      window.dispatchEvent(new CustomEvent('albumRefresh'))
      
      console.log(`✅ [UPLOAD] Upload complete - showing success toast`)
      toast({
        title: "Success",
        description: `${entityType} ${type} has been updated successfully and added to album.`
      })
      
      // Close modal and reset state
      onOpenChange(false)
      setSelectedFile(null)
      setPreview(null)
      setCroppedImage(null)
      setShowCropper(false)
    } catch (error: any) {
      console.error(`❌ [UPLOAD] Upload failed with error:`, error)
      console.error(`❌ [UPLOAD] Error message:`, error?.message || String(error))
      console.error(`❌ [UPLOAD] Error stack:`, error?.stack)
      
      // Extract the actual error message
      let errorMessage = 'Unknown error occurred'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.message) {
        errorMessage = error.message
      } else {
        errorMessage = String(error)
      }
      
      console.error(`❌ [UPLOAD] Showing error toast with message: ${errorMessage}`)
      toast({
        title: "Upload Failed",
        description: errorMessage || `Failed to upload ${type}. Please try again.`,
        variant: "destructive"
      })
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setSelectedFile(null)
    setPreview(null)
    setCroppedImage(null)
    setShowCropper(false)
  }

  // Fully reusable: Use provided props or smart defaults based on type
  const aspectRatio = propAspectRatio ?? (
    type === 'avatar' 
      ? 1 
      : type === 'bookCover'
        ? 2 / 3  // Book cover aspect ratio (2:3)
        : 1344 / 500  // Entity header cover aspect ratio (wide/landscape)
  )
  const targetWidth = propTargetWidth ?? (
    type === 'avatar' 
      ? 400 
      : type === 'bookCover'
        ? 800  // Book cover width (2:3 ratio)
        : 1344  // Entity header cover width (wide/landscape)
  )
  const targetHeight = propTargetHeight ?? (
    type === 'avatar' 
      ? 400 
      : type === 'bookCover'
        ? 1200  // Book cover height (2:3 ratio: 800 * 1.5 = 1200)
        : 500  // Entity header cover height (wide/landscape)
  )
  const circularCrop = propCircularCrop ?? (type === 'avatar')
  const previewAspectRatio = propPreviewAspectRatio ?? (
    type === 'avatar' 
      ? undefined 
      : type === 'bookCover'
        ? 'aspect-[2/3]'  // Book cover preview aspect ratio
        : 'aspect-[1344/500]'  // Entity header cover preview (wide/landscape)
  )
  const dialogMaxWidth = propDialogMaxWidth ?? ((type === 'bookCover' || type === 'entityHeaderCover') ? 'max-w-4xl' : 'sm:max-w-[425px]')

  // If showing cropper, ImageCropper creates its own modal - don't wrap in Dialog
  if (showCropper && preview) {
    return (
      <ImageCropper
        imageUrl={preview}
        aspectRatio={aspectRatio}
        onCropComplete={handleCrop}
        onCancel={handleCropCancel}
        circularCrop={circularCrop}
        targetWidth={targetWidth}
        targetHeight={targetHeight}
      />
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${dialogMaxWidth} flex flex-col`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '400px',
          height: 'clamp(400px, 80vh, 80vh)',
          maxHeight: '80vh'
        }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            Change {entityType} {type === 'bookCover' ? 'book cover' : type === 'entityHeaderCover' ? 'header cover' : type}
          </DialogTitle>
        </DialogHeader>
        
            {/* Preview - Takes available space */}
        <div 
          className={`flex-1 min-h-0 flex items-center justify-center ${(type === 'bookCover' || type === 'entityHeaderCover') ? "py-6" : "py-4"}`}
        >
          <div 
            className={cn(
              (type === 'bookCover' || type === 'entityHeaderCover')
                ? `w-full rounded-lg border-2 border-border bg-gray-50 flex items-center justify-center p-4`
                : type === 'avatar' && (croppedImage || preview)
                  ? "relative w-32 h-32 rounded-full overflow-hidden border-2 border-border"
                  : "relative w-32 h-32 overflow-hidden",
              // When no image is selected, style like the file input field
              !(croppedImage || preview) && cn(
                "w-full rounded-md border border-input bg-background",
                "cursor-pointer hover:bg-accent/50 transition-colors",
                "flex items-center justify-center",
                type === 'bookCover' || type === 'entityHeaderCover' ? "h-full min-h-[200px]" : "h-10"
              )
            )}
            style={(type === 'bookCover' || type === 'entityHeaderCover') ? {
              width: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'stretch',
              flex: '1 1 auto',
              minHeight: 0
            } : undefined}
            onClick={() => {
              // If no image is selected, clicking the preview area should open file picker
              if (!(croppedImage || preview) && fileInputRef.current) {
                fileInputRef.current.click()
              }
            }}
          >
            {(croppedImage || preview) ? (
              <img
                src={croppedImage || preview}
                alt={`${entityType} ${type} preview`}
                className={(type === 'bookCover' || type === 'entityHeaderCover') ? "" : "w-full h-full object-cover"}
                style={(type === 'bookCover' || type === 'entityHeaderCover') ? {
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block'
                } : undefined}
              />
            ) : (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span className="text-sm">Choose File</span>
                <span className="text-sm text-muted-foreground/70">No file chosen</span>
              </div>
            )}
          </div>
            </div>

        {/* Footer with File Input and Action Buttons */}
        <div className="flex-shrink-0 space-y-3 pt-4 border-t">
            {/* File Input - Hidden, triggered by preview area click */}
          <div className="w-full">
              <Input
                ref={fileInputRef}
                id={type}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
                className="cursor-pointer"
              />
            </div>

          {/* Action Buttons Row */}
          <div className="flex items-center justify-between gap-2">
            {/* Crop Button - Show for both cover and avatar images when a file is selected */}
            <div>
              {(type === 'bookCover' || type === 'entityHeaderCover' || type === 'avatar') && preview && !showCropper && (
                <Button
                  size="sm"
                  onClick={() => setShowCropper(true)}
                  disabled={isUploading}
                  className="flex items-center gap-2 h-8"
                >
                  <Crop className="h-4 w-4" />
                  Crop & Adjust
                </Button>
            )}
          </div>

            {/* Cancel and Upload buttons */}
            <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isUploading}
            className="h-8"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleUpload}
            disabled={!preview && !croppedImage || isUploading}
            className="h-8"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 