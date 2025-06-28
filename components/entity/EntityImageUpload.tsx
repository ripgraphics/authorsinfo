"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Camera } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

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
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      // Create upload widget
      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          uploadPreset: 'authorsinfo',
          sources: ['local'],
          resourceType: 'image',
          maxFiles: 1,
          maxFileSize: 5000000, // 5MB
          clientAllowedFormats: ['image'],
          showAdvancedOptions: false,
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
              // Insert into images table
              const { data: imageData, error: imageError } = await supabase
                .from('images')
                .insert({
                  url: result.info.secure_url,
                  alt_text: `${type} for ${entityType} ${entityId}`,
                  img_type_id: IMAGE_TYPE_IDS[entityType][type],
                  storage_provider: 'cloudinary',
                  storage_path: `authorsinfo/${entityType}_${type}`,
                  original_filename: selectedFile.name,
                  file_size: selectedFile.size,
                  mime_type: selectedFile.type,
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

              onImageChange(result.info.secure_url)
              toast({
                title: "Success",
                description: `${entityType} ${type} has been updated successfully.`
              })
              
              // Close modal and reset state
              onOpenChange(false)
              setSelectedFile(null)
              setPreview(null)
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={type === 'cover' ? "cover-upload-modal" : "sm:max-w-[425px]"}>
        <DialogHeader>
          <DialogTitle>Change {entityType} {type}</DialogTitle>
        </DialogHeader>
        <div className={type === 'cover' ? "cover-upload-content" : "flex flex-col items-center space-y-6 py-4"}>
          <div className={type === 'cover' ? "cover-upload-preview-container" : "relative w-32 h-32 rounded-full overflow-hidden border-2 border-border"}>
            <img
              src={preview || currentImageUrl || "/placeholder.svg"}
              alt={`${entityType} ${type}`}
              className={type === 'cover' ? "cover-preview-image" : "w-full h-full object-cover"}
            />
          </div>
          <div className={type === 'cover' ? "cover-upload-input-container" : "w-full space-y-2"}>
            <Label htmlFor={type}>Upload new {type}</Label>
            <Input
              id={type}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
        </div>
        <div className={type === 'cover' ? "cover-upload-actions" : "flex justify-end gap-2"}>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setSelectedFile(null)
              setPreview(null)
            }}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 