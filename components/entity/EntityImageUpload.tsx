"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Camera, Crop } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { clearCache } from '@/lib/request-utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ImageCropper } from '@/components/ui/image-cropper'

declare global {
  interface Window {
    cloudinary: any;
  }
}

interface EntityImageUploadProps {
  entityId: string
  entityType: 'author' | 'publisher' | 'book' | 'group' | 'user' | 'event' | 'photo'
  currentImageUrl?: string
  onImageChange: (newImageUrl: string) => void
  type: 'avatar' | 'cover'
  className?: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const IMAGE_TYPE_IDS = {
  user: {
    avatar: 33, // user_avatar
    cover: 32,  // user_cover
  },
  group: {
    avatar: 35, // group_avatar
    cover: 34,  // group_cover
  },
  author: {
    avatar: 37, // author_avatar
    cover: 36,  // author_cover
  },
  publisher: {
    avatar: 39, // publisher_avatar
    cover: 38,  // publisher_cover
  },
  book: {
    avatar: 41, // book_avatar
    cover: 40,  // book_cover
  },
  event: {
    avatar: 43, // event_avatar
    cover: 42,  // event_cover
  },
  photo: {
    avatar: 45, // photo_avatar
    cover: 44,  // photo_cover
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
  onOpenChange
}: EntityImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [croppedImage, setCroppedImage] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

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
    if (!imageToUpload) return

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
      const formData = new FormData()
      formData.append('file', fileToUpload)
      formData.append('entityType', entityType)
      formData.append('entityId', entityId)
      formData.append('imageType', type)

      const uploadResponse = await fetch('/api/upload/entity-image', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to upload to Cloudinary')
      }

      const uploadResult = await uploadResponse.json()

      // Add image to entity album
      const albumPurpose = type
      try {
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
              aspect_ratio: type === 'cover' ? 16/9 : 1,
              uploaded_via: 'entity_image_upload',
              original_filename: fileToUpload.name,
              file_size: fileToUpload.size
            }
          })
        })

        if (!albumResponse.ok) {
          const errorText = await albumResponse.text()
          console.error('Failed to add image to album:', errorText)
          // Don't throw error here, just log it
        }
      } catch (albumError) {
        console.error('Error adding image to album:', albumError)
        // Don't fail the upload if album addition fails
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

      onImageChange(uploadResult.url)
      
      // Clear cache for entity images to force fresh data on next load
      clearCache(`entity-avatar-${entityType}-${entityId}`)
      clearCache(`entity-header-${entityType}-${entityId}`)
      
      // Dispatch event to trigger EntityHeader to refetch images
      window.dispatchEvent(new CustomEvent('entityImageChanged', {
        detail: { entityType, entityId, imageType: type }
      }))
      
      toast({
        title: "Success",
        description: `${entityType} ${type} has been updated successfully.`
      })
      
      // Close modal and reset state
      onOpenChange(false)
      setSelectedFile(null)
      setPreview(null)
      setCroppedImage(null)
      setShowCropper(false)
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error)
      toast({
        title: "Error",
        description: error.message || `Failed to upload ${type}. Please try again.`,
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

  // Determine aspect ratio based on type
  const getAspectRatio = () => {
    return type === 'cover' ? 1344 / 500 : 1 // 1344:500 for cover (matches EntityHeader), 1:1 for avatar
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={type === 'cover' ? "max-w-4xl" : "sm:max-w-[425px]"}>
        <DialogHeader>
          <DialogTitle>Change {entityType} {type}</DialogTitle>
        </DialogHeader>
        
        {showCropper && preview ? (
          <ImageCropper
            imageUrl={preview}
            aspectRatio={getAspectRatio()}
            onCropComplete={handleCrop}
            onCancel={handleCropCancel}
            circularCrop={type === 'avatar'}
            targetWidth={type === 'avatar' ? 400 : undefined}
            targetHeight={type === 'avatar' ? 400 : undefined}
          />
        ) : (
          <div className={type === 'cover' ? "space-y-6" : "flex flex-col items-center space-y-6 py-4"}>
            {/* Preview */}
            <div className={type === 'cover' ? "w-full aspect-[1344/500] rounded-lg overflow-hidden border-2 border-border" : "relative w-32 h-32 rounded-full overflow-hidden border-2 border-border"}>
              <img
                src={croppedImage || preview || currentImageUrl || "/placeholder.svg"}
                alt={`${entityType} ${type}`}
                className={type === 'cover' ? "w-full h-full object-cover" : "w-full h-full object-cover"}
              />
            </div>

            {/* File Input */}
            <div className="w-full space-y-2">
              <Label htmlFor={type}>Upload new {type}</Label>
              <Input
                id={type}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>

            {/* Crop Button - Show for both cover and avatar images when a file is selected */}
            {(type === 'cover' || type === 'avatar') && preview && !showCropper && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowCropper(true)}
                  disabled={isUploading}
                  className="flex items-center gap-2"
                >
                  <Crop className="h-4 w-4" />
                  Crop & Adjust Image
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!preview && !croppedImage || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 