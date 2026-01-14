'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Image as ImageIcon, BookOpen } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { EntityImageUpload } from '@/components/entity/EntityImageUpload'

interface BookImageManagerProps {
  bookId: string
  bookTitle: string
  canEdit: boolean
  onImageAdded?: () => void
}

type ImageType = 'book_cover_front' | 'book_cover_back' | 'book_gallery'

export function BookImageManager({
  bookId,
  bookTitle,
  canEdit,
  onImageAdded,
}: BookImageManagerProps) {
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<ImageType>('book_cover_front')
  const [isFrontCoverUploadOpen, setIsFrontCoverUploadOpen] = useState(false)
  const [isBackCoverUploadOpen, setIsBackCoverUploadOpen] = useState(false)
  const { toast } = useToast()

  if (!canEdit) {
    return null
  }

  const uploadSingleFile = async (file: File, imageType: ImageType, showToast = true) => {
    if (!file.type.startsWith('image/')) {
      if (showToast) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file',
          variant: 'destructive',
        })
      }
      throw new Error('Invalid file type')
    }

    // Determine image type for entity-image API
    const entityImageType = imageType === 'book_cover_front' 
      ? 'bookCover' 
      : imageType === 'book_cover_back'
      ? 'bookCoverBack'
      : 'bookGallery'

    // Prepare FormData for entity-image API
    const formData = new FormData()
    formData.append('file', file)
    formData.append('entityType', 'book')
    formData.append('entityId', bookId)
    formData.append('imageType', entityImageType)
    formData.append('originalType', imageType === 'book_cover_front' || imageType === 'book_cover_back' ? 'bookCover' : 'bookGallery')

    // Upload using entity-image API
    const uploadResponse = await fetch('/api/upload/entity-image', {
      method: 'POST',
      body: formData,
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json()
      throw new Error(error.error || 'Failed to upload image')
    }

    const uploadResult = await uploadResponse.json()

    if (!uploadResult.success || !uploadResult.image_id) {
      throw new Error('Upload succeeded but no image ID returned')
    }

    // Always add to book album using book images API
    // This ensures proper categorization with image_type
    const addResponse = await fetch(`/api/books/${bookId}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageId: uploadResult.image_id,
        imageType: imageType,
        altText: imageType === 'book_cover_back' 
          ? `${bookTitle} : book back cover`
          : imageType === 'book_cover_front'
          ? `${bookTitle} : book cover`
          : `${bookTitle} : gallery image`,
      }),
    })

    if (!addResponse.ok) {
      const error = await addResponse.json()
      // If image already exists in album, that's okay - just update the type
      if (error.error?.includes('already exists') || error.error?.includes('duplicate')) {
        // Try to update existing record
        const { data: existing } = await (supabase.from('album_images') as any)
          .select('id')
          .eq('image_id', uploadResult.image_id)
          .eq('entity_id', bookId)
          .maybeSingle()
        
        if (existing) {
          await (supabase.from('album_images') as any)
            .update({ image_type: imageType })
            .eq('id', (existing as any).id)
        }
      } else {
        throw new Error(error.error || 'Failed to add image to book')
      }
    }

    if (showToast) {
      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      })
    }
  }

  const handleFileUpload = async (file: File, imageType: ImageType) => {
    try {
      setUploading(true)
      await uploadSingleFile(file, imageType, true)
      
      // Trigger refresh
      window.dispatchEvent(new CustomEvent('entityImageChanged'))
      if (onImageAdded) {
        onImageAdded()
      }
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, imageType: ImageType) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Reset input
    e.target.value = ''

    // For gallery, handle multiple files
    if (imageType === 'book_gallery' && files.length > 1) {
      setUploading(true)
      let successCount = 0
      let errorCount = 0

      // Upload files sequentially to avoid overwhelming the server
      for (let i = 0; i < files.length; i++) {
        try {
          await uploadSingleFile(files[i], imageType, false)
          successCount++
        } catch (error) {
          errorCount++
          console.error(`Error uploading file ${i + 1}:`, error)
        }
      }

      setUploading(false)

      // Show summary toast
      if (successCount > 0 && errorCount === 0) {
        toast({
          title: 'Success',
          description: `Successfully uploaded ${successCount} image${successCount > 1 ? 's' : ''}`,
        })
      } else if (successCount > 0 && errorCount > 0) {
        toast({
          title: 'Partial success',
          description: `Uploaded ${successCount} image${successCount > 1 ? 's' : ''}, ${errorCount} failed`,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Upload failed',
          description: `Failed to upload ${errorCount} image${errorCount > 1 ? 's' : ''}`,
          variant: 'destructive',
        })
      }

      // Trigger refresh
      window.dispatchEvent(new CustomEvent('entityImageChanged'))
      if (onImageAdded) {
        onImageAdded()
      }
    } else {
      // Single file upload (covers or single gallery image)
      handleFileUpload(files[0], imageType)
    }
  }

  // Handle front cover upload completion from EntityImageUpload
  const handleFrontCoverUploadComplete = async (newImageUrl: string, newImageId?: string) => {
    if (!newImageId) {
      toast({
        title: 'Error',
        description: 'Image uploaded but no image ID returned',
        variant: 'destructive',
      })
      return
    }

    try {
      // Update books.cover_image_id
      const { error: updateError } = await (supabase.from('books') as any)
        .update({ cover_image_id: newImageId })
        .eq('id', bookId)

      if (updateError) {
        console.error('Error updating book cover_image_id:', updateError)
        throw new Error(`Failed to update book cover: ${updateError.message}`)
      }

      // Add to book album with image_type: 'book_cover_front'
      const addResponse = await fetch(`/api/books/${bookId}/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId: newImageId,
          imageType: 'book_cover_front',
          altText: `${bookTitle} : book cover`,
        }),
      })

      if (!addResponse.ok) {
        const error = await addResponse.json()
        console.warn('Failed to add front cover to album (non-critical):', error)
        // Don't throw - the image is uploaded and cover_image_id is updated
      }

      toast({
        title: 'Success',
        description: 'Front cover uploaded and cropped successfully',
      })

      // Trigger refresh
      window.dispatchEvent(new CustomEvent('entityImageChanged'))
      if (onImageAdded) {
        onImageAdded()
      }

      // Close the upload modal
      setIsFrontCoverUploadOpen(false)
    } catch (error: any) {
      console.error('Error handling front cover upload:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete front cover upload',
        variant: 'destructive',
      })
    }
  }

  // Handle back cover upload completion from EntityImageUpload
  const handleBackCoverUploadComplete = async (newImageUrl: string, newImageId?: string) => {
    if (!newImageId) {
      toast({
        title: 'Error',
        description: 'Image uploaded but no image ID returned',
        variant: 'destructive',
      })
      return
    }

    try {
      // Add to book album with image_type: 'book_cover_back'
      const addResponse = await fetch(`/api/books/${bookId}/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId: newImageId,
          imageType: 'book_cover_back',
          altText: `${bookTitle} : book back cover`,
        }),
      })

      if (!addResponse.ok) {
        const error = await addResponse.json()
        // If image already exists in album, that's okay - just update the type
        if (error.error?.includes('already exists') || error.error?.includes('duplicate')) {
          // Try to update existing record
          const { data: existing } = await (supabase.from('album_images') as any)
            .select('id')
            .eq('image_id', newImageId)
            .eq('entity_id', bookId)
            .maybeSingle()
          
          if (existing) {
            await (supabase.from('album_images') as any)
              .update({ image_type: 'book_cover_back' })
              .eq('id', (existing as any).id)
          }
        } else {
          throw new Error(error.error || 'Failed to add back cover to book')
        }
      }

      toast({
        title: 'Success',
        description: 'Back cover uploaded and cropped successfully',
      })

      // Trigger refresh
      window.dispatchEvent(new CustomEvent('entityImageChanged'))
      if (onImageAdded) {
        onImageAdded()
      }

      // Close the upload modal
      setIsBackCoverUploadOpen(false)
    } catch (error: any) {
      console.error('Error handling back cover upload:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete back cover upload',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Book Images</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ImageType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="book_cover_front">Front Cover</TabsTrigger>
            <TabsTrigger value="book_cover_back">Back Cover</TabsTrigger>
            <TabsTrigger value="book_gallery">Gallery</TabsTrigger>
          </TabsList>

          <TabsContent value="book_cover_front" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload the front cover image for this book
              </p>
              <Button
                onClick={() => setIsFrontCoverUploadOpen(true)}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Front Cover'}
              </Button>
            </div>
            <EntityImageUpload
              entityId={bookId}
              entityType="book"
              onImageChange={handleFrontCoverUploadComplete}
              type="bookCover"
              isOpen={isFrontCoverUploadOpen}
              onOpenChange={setIsFrontCoverUploadOpen}
            />
          </TabsContent>

          <TabsContent value="book_cover_back" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload the back cover image for this book
              </p>
              <Button
                onClick={() => setIsBackCoverUploadOpen(true)}
                disabled={uploading}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Back Cover'}
              </Button>
            </div>
            <EntityImageUpload
              entityId={bookId}
              entityType="book"
              onImageChange={handleBackCoverUploadComplete}
              type="bookCoverBack"
              isOpen={isBackCoverUploadOpen}
              onOpenChange={setIsBackCoverUploadOpen}
            />
          </TabsContent>

          <TabsContent value="book_gallery" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload additional images (sample pages, interior spreads, etc.)
              </p>
              <label htmlFor="gallery-upload">
                <Button asChild disabled={uploading} variant="outline">
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Gallery Image'}
                  </span>
                </Button>
                <input
                  id="gallery-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'book_gallery')}
                  disabled={uploading}
                  multiple
                />
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                You can select multiple images at once
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
