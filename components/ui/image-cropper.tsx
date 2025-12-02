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
  circularCrop?: boolean
}

export function ImageCropper({
  imageUrl,
  onCropComplete,
  onCancel,
  aspectRatio = 1344 / 500, // Default aspect ratio
  targetWidth = 1344,
  targetHeight = 500,
  isProcessing = false,
  circularCrop = false
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [internalProcessing, setInternalProcessing] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const cropContainerRef = useRef<HTMLDivElement>(null)

  // Use external isProcessing if provided, otherwise use internal state
  const processing = isProcessing !== undefined ? isProcessing : internalProcessing

  // Function to initialize crop - use full width for tall images
  const initializeCrop = useCallback(
    (mediaWidth: number, mediaHeight: number) => {
      // Calculate if image is tall (height > width / aspectRatio means crop height > image height)
      const cropHeightAtFullWidth = mediaWidth / aspectRatio
      const isTallImage = mediaHeight > cropHeightAtFullWidth
      
      if (isTallImage) {
        // For tall images: use full width, position at top
        return makeAspectCrop(
          {
            unit: '%',
            width: 100,
            x: 0,
            y: 0,
          },
          aspectRatio,
          mediaWidth,
          mediaHeight,
        )
      } else {
        // For wide images: center the crop
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
      }
    },
    [aspectRatio],
  )

  // Handle image load
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setImageLoaded(true)
      if (aspectRatio) {
        const { width, height } = e.currentTarget
        setCrop(initializeCrop(width, height))
      }
    },
    [aspectRatio, initializeCrop],
  )

  // Handle image error
  const onImageError = useCallback(() => {
    setImageLoaded(false)
    console.error('Failed to load image')
  }, [])

  // Handle click outside crop area to start new crop
  const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current || !imageLoaded || processing) return
    
    const img = imgRef.current
    const rect = img.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Check if click is within image bounds
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return
    
    // Convert click position to percentage
    const percentX = (x / rect.width) * 100
    const percentY = (y / rect.height) * 100
    
    // Check if click is outside the current crop area
    if (crop) {
      const cropLeft = crop.x
      const cropTop = crop.y
      const cropRight = crop.x + crop.width
      const cropBottom = crop.y + crop.height
      
      // If click is outside crop area, create new crop from click position
      if (
        percentX < cropLeft ||
        percentX > cropRight ||
        percentY < cropTop ||
        percentY > cropBottom
      ) {
        // Create a new crop starting from the click position
        const newCrop = makeAspectCrop(
          {
            unit: '%',
            x: Math.max(0, Math.min(percentX, 100)),
            y: Math.max(0, Math.min(percentY, 100)),
            width: 30, // Start with 30% width
          },
          aspectRatio,
          img.width,
          img.height,
        )
        setCrop(newCrop)
      }
    } else {
      // No existing crop, create one from click position
      const newCrop = makeAspectCrop(
        {
          unit: '%',
          x: Math.max(0, Math.min(percentX, 100)),
          y: Math.max(0, Math.min(percentY, 100)),
          width: 30, // Start with 30% width
        },
        aspectRatio,
        img.width,
        img.height,
      )
      setCrop(newCrop)
    }
  }, [crop, imageLoaded, processing, aspectRatio])

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
      <div className="relative max-h-[90vh] max-w-[90vw] flex flex-col rounded-lg bg-white overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b">
          <h3 className="text-sm font-semibold">Crop Image</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-6 w-6 p-0"
            disabled={processing}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Scrollable Image Cropper Container */}
        <div 
          ref={cropContainerRef} 
          className="flex-1 overflow-auto flex items-start justify-center bg-gray-50"
          style={{ minHeight: 0 }}
        >
          <div className="p-2">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              minWidth={50}
              minHeight={50}
              ruleOfThirds
              circularCrop={circularCrop}
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
                  height: 'auto',
                  display: 'block',
                  cursor: 'crosshair',
                  margin: '0 auto',
                }}
                onLoad={onImageLoad}
                onError={onImageError}
                onClick={handleImageClick}
              />
            </ReactCrop>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-t bg-white">
          <div className="text-xs text-gray-500">
            Click and drag to adjust crop area
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onCancel} 
              disabled={processing}
              className="h-7 px-3 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={generateCroppedImage}
              disabled={!completedCrop || !imageLoaded || processing}
              className="h-7 px-3 text-xs"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Processing...
                </>
              ) : (
                'Crop Image'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 