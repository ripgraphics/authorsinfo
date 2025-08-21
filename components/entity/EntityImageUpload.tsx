"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Camera, Crop } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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

      // For cropped images, we'll upload directly to Cloudinary without the widget
      if (croppedImage) {
        // Create FormData for direct upload
        const formData = new FormData()
        formData.append('file', fileToUpload)
        formData.append('upload_preset', 'authorsinfo_webp')
        formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '')
        formData.append('quality', '95')
        formData.append('transformation', 'f_webp')

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData
          }
        )

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload to Cloudinary')
        }

        const uploadResult = await uploadResponse.json()

        // Insert into images table
        const { data: imageData, error: imageError } = await supabase
          .from('images')
          .insert({
            url: uploadResult.secure_url,
            alt_text: `${type} for ${entityType} ${entityId}`,
            img_type_id: IMAGE_TYPE_IDS[entityType][type],
            storage_provider: 'cloudinary',
            storage_path: `authorsinfo/${entityType}_${type}`,
            original_filename: fileToUpload.name,
            file_size: fileToUpload.size,
            mime_type: fileToUpload.type,
            is_processed: true,
            processing_status: 'completed'
          })
          .select()
          .single()

        if (imageError) {
          throw new Error(`Failed to insert image record: ${imageError.message}`)
        }

        // Update entity profile
        const { error: updateError } = await supabase
          .from(`${entityType}s`)
          .update({
            [`${type}_image_id`]: imageData.id
          })
          .eq('id', entityId)

        if (updateError) {
          throw new Error(`Failed to update ${entityType} profile: ${updateError.message}`)
        }

        // Optionally delete old image from Cloudinary (only if it's a Cloudinary URL)
        if (oldImageUrl && oldImageUrl.includes('cloudinary.com')) {
          try {
            // Extract public ID from Cloudinary URL
            const urlParts = oldImageUrl.split('/')
            const filename = urlParts[urlParts.length - 1]
            const publicId = filename.split('.')[0] // Remove file extension
            
            // Delete from Cloudinary
            await fetch('/api/cloudinary/delete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ publicId })
            })
            
            console.log('Old image deleted from Cloudinary:', publicId)
          } catch (deleteError) {
            console.warn('Failed to delete old image from Cloudinary:', deleteError)
            // Don't fail the upload if deletion fails
          }
        }

        onImageChange(uploadResult.secure_url)
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
      } else {
        // Use Cloudinary widget for non-cropped images
        const widget = window.cloudinary.createUploadWidget(
          {
            cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
            uploadPreset: 'authorsinfo_webp',
            sources: ['local'],
            resourceType: 'image',
            maxFiles: 1,
            maxFileSize: 5000000, // 5MB
            clientAllowedFormats: ['image'],
            showAdvancedOptions: false,
            transformation: [{ format: 'webp' }],
            styles: {
              palette: {
                window: '#FFFFFF',
                windowBorder: '#90A0B3',
                tabIcon: '#0078FF',
                menuIcons: '#5A616A',
                textDark: '#000000',
                textLight: '#FFFFFF',
                link: '#0078FF',
                action: '#FF620C',
                inactiveTabIcon: '#0E2F5A',
                error: '#F44235',
                inProgress: '#0078FF',
                complete: '#20B832',
                sourceBg: '#E4EBF1'
              }
            }
          },
          async (error: any, result: any) => {
            if (error) {
              console.error('Upload error:', error)
              toast({
                title: "Error",
                description: "Failed to upload image. Please try again.",
                variant: "destructive"
              })
              setIsUploading(false)
              return
            }

            if (result.event === 'success') {
              try {
                // Store the old image URL for potential cleanup
                const oldImageUrl = currentImageUrl

                // Insert into images table
                const { data: imageData, error: imageError } = await supabase
                  .from('images')
                  .insert({
                    url: result.info.secure_url,
                    alt_text: `${type} for ${entityType} ${entityId}`,
                    img_type_id: IMAGE_TYPE_IDS[entityType][type],
                    storage_provider: 'cloudinary',
                    storage_path: `authorsinfo/${entityType}_${type}`,
                    original_filename: fileToUpload?.name || 'uploaded-image.jpg',
                    file_size: fileToUpload?.size || 0,
                    mime_type: fileToUpload?.type || 'image/jpeg',
                    is_processed: true,
                    processing_status: 'completed'
                  })
                  .select()
                  .single()

                if (imageError) {
                  throw new Error(`Failed to insert image record: ${imageError.message}`)
                }

                // Update entity profile
                const { error: updateError } = await supabase
                  .from(`${entityType}s`)
                  .update({
                    [`${type}_image_id`]: imageData.id
                  })
                  .eq('id', entityId)

                if (updateError) {
                  throw new Error(`Failed to update ${entityType} profile: ${updateError.message}`)
                }

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
                      imageId: imageData.id,
                      isCover: true,
                      isFeatured: true,
                      metadata: {
                        aspect_ratio: type === 'cover' ? 16/9 : 1,
                        uploaded_via: 'entity_image_upload',
                        original_filename: fileToUpload?.name || 'uploaded-image.jpg',
                        file_size: fileToUpload?.size || 0
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
                    // Extract public ID from Cloudinary URL
                    const urlParts = oldImageUrl.split('/')
                    const filename = urlParts[urlParts.length - 1]
                    const publicId = filename.split('.')[0] // Remove file extension
                    
                    // Delete from Cloudinary
                    await fetch('/api/cloudinary/delete', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ publicId })
                    })
                    
                    console.log('Old image deleted from Cloudinary:', publicId)
                  } catch (deleteError) {
                    console.warn('Failed to delete old image from Cloudinary:', deleteError)
                    // Don't fail the upload if deletion fails
                  }
                }

                onImageChange(result.info.secure_url)
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
                console.error(`Error saving image data:`, error)
                toast({
                  title: "Error",
                  description: error.message || `Failed to save image data. Please try again.`,
                  variant: "destructive"
                })
              }
            }
            setIsUploading(false)
          }
        )

        // Open the widget
        widget.open()
      }
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

            {/* Crop Button - Only show for cover images when a file is selected */}
            {type === 'cover' && preview && !showCropper && (
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