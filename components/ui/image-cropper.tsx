"use client"

import React, { useState, useRef, useCallback } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'
import { X, Loader2 } from 'lucide-react'

interface ImageCropperProps {
  imageUrl: string
  onCropComplete: (croppedImageBlob: Blob) => void
  onCancel: () => void
  aspectRatio?: number
  targetWidth?: number
  targetHeight?: number
  isProcessing?: boolean
}

export function ImageCropper({
  imageUrl,
  onCropComplete,
  onCancel,
  aspectRatio = 1344 / 500, // Default aspect ratio
  targetWidth = 1344,
  targetHeight = 500,
  isProcessing = false
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [internalProcessing, setInternalProcessing] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Use external isProcessing if provided, otherwise use internal state
  const processing = isProcessing !== undefined ? isProcessing : internalProcessing

  // Function to center the crop on the image
  const centerAspectCrop = useCallback(
    (mediaWidth: number, mediaHeight: number) => {
      return centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          aspectRatio,
          mediaWidth,
          mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
      )
    },
    [aspectRatio],
  )

  // Handle image load
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setImageLoaded(true)
      if (aspectRatio) {
        const { width, height } = e.currentTarget
        setCrop(centerAspectCrop(width, height))
      }
    },
    [aspectRatio, centerAspectCrop],
  )

  // Handle image error
  const onImageError = useCallback(() => {
    setImageLoaded(false)
    console.error('Failed to load image')
  }, [])

  // Generate cropped image
  const generateCroppedImage = async () => {
    if (!imgRef.current || !completedCrop) return

    setInternalProcessing(true)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      setInternalProcessing(false)
      return
    }

    const scaleX = imgRef.current.naturalWidth / imgRef.current.width
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height

    canvas.width = targetWidth
    canvas.height = targetHeight

    try {
      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        targetWidth,
        targetHeight,
      )

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onCropComplete(blob)
          }
          // Don't reset processing state here - let parent component handle it
        },
        'image/jpeg',
        0.95
      )
    } catch (error) {
      console.error('Error drawing image to canvas:', error)
      setInternalProcessing(false)
      // If CORS error, try to create a new image with crossOrigin
      if (error instanceof Error && error.message.includes('tainted')) {
        try {
          // Create a new image element with crossOrigin
          const newImg = new Image()
          newImg.crossOrigin = 'anonymous'
          
          newImg.onload = () => {
            const newCanvas = document.createElement('canvas')
            const newCtx = newCanvas.getContext('2d')
            
            if (!newCtx) {
              setInternalProcessing(false)
              return
            }
            
            newCanvas.width = targetWidth
            newCanvas.height = targetHeight
            
            newCtx.drawImage(
              newImg,
              completedCrop.x * scaleX,
              completedCrop.y * scaleY,
              completedCrop.width * scaleX,
              completedCrop.height * scaleY,
              0,
              0,
              targetWidth,
              targetHeight,
            )
            
            newCanvas.toBlob(
              (blob) => {
                if (blob) {
                  onCropComplete(blob)
                }
                // Don't reset processing state here - let parent component handle it
              },
              'image/jpeg',
              0.95
            )
          }
          
          newImg.onerror = () => {
            console.error('Failed to load image with crossOrigin')
            setInternalProcessing(false)
            // Fallback: try to fetch the image and create a blob URL
            fetch(imageUrl)
              .then(response => response.blob())
              .then(blob => {
                const url = URL.createObjectURL(blob)
                const fallbackImg = new Image()
                fallbackImg.onload = () => {
                  const fallbackCanvas = document.createElement('canvas')
                  const fallbackCtx = fallbackCanvas.getContext('2d')
                  
                  if (!fallbackCtx) {
                    setInternalProcessing(false)
                    return
                  }
                  
                  fallbackCanvas.width = targetWidth
                  fallbackCanvas.height = targetHeight
                  
                  fallbackCtx.drawImage(
                    fallbackImg,
                    completedCrop.x * scaleX,
                    completedCrop.y * scaleY,
                    completedCrop.width * scaleX,
                    completedCrop.height * scaleY,
                    0,
                    0,
                    targetWidth,
                    targetHeight,
                  )
                  
                  fallbackCanvas.toBlob(
                    (blob) => {
                      if (blob) {
                        onCropComplete(blob)
                      }
                      // Don't reset processing state here - let parent component handle it
                    },
                    'image/jpeg',
                    0.95
                  )
                }
                fallbackImg.src = url
              })
              .catch(fetchError => {
                console.error('Failed to fetch image:', fetchError)
                setInternalProcessing(false)
              })
          }
          
          newImg.src = imageUrl
        } catch (fallbackError) {
          console.error('Fallback error:', fallbackError)
          setInternalProcessing(false)
        }
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg bg-white p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Crop Image</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
            disabled={processing}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Image Cropper */}
        <div className="max-h-[60vh] overflow-auto">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            minWidth={50}
            minHeight={50}
            keepSelection
            ruleOfThirds
            className="max-w-full"
            disabled={!imageLoaded || processing}
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imageUrl}
              crossOrigin="anonymous"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'block',
              }}
              onLoad={onImageLoad}
              onError={onImageError}
            />
          </ReactCrop>
        </div>

        {/* Instructions */}
        <div className="mt-2 text-center text-sm text-gray-600">
          Drag the corners to adjust the crop area.
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={generateCroppedImage}
            disabled={!completedCrop || !imageLoaded || processing}
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Crop Image'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 