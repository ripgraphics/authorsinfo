"use client"

import React, { useState, useRef, useCallback } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'
import { X, Loader2, ZoomIn, ZoomOut } from 'lucide-react'
import { Slider } from '@/components/ui/slider'

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
  const [zoom, setZoom] = useState(1)
  const imgRef = useRef<HTMLImageElement>(null)
  const cropContainerRef = useRef<HTMLDivElement>(null)

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
      setZoom(1) // Reset zoom when new image loads
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

    // Account for zoom in scale calculations
    const displayedWidth = imgRef.current.width / zoom
    const displayedHeight = imgRef.current.height / zoom
    const scaleX = imgRef.current.naturalWidth / displayedWidth
    const scaleY = imgRef.current.naturalHeight / displayedHeight

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
        <div ref={cropContainerRef} className="max-h-[60vh] overflow-auto flex items-center justify-center">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            minWidth={50}
            minHeight={50}
            ruleOfThirds
            circularCrop={circularCrop}
            className="max-w-full mx-auto"
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
                cursor: 'crosshair',
                margin: '0 auto',
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
              }}
              onLoad={onImageLoad}
              onError={onImageError}
              onClick={handleImageClick}
            />
          </ReactCrop>
        </div>

        {/* Zoom Controls */}
        <div className="mt-4 flex items-center gap-4 px-4">
          <ZoomOut className="h-4 w-4 text-gray-600" />
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.1}
            onValueChange={(value) => setZoom(value[0])}
            className="flex-1"
            disabled={!imageLoaded || processing}
          />
          <ZoomIn className="h-4 w-4 text-gray-600" />
          <span className="text-sm text-gray-600 w-12 text-right">{Math.round(zoom * 100)}%</span>
        </div>

        {/* Instructions */}
        <div className="mt-2 text-center text-sm text-gray-600">
          Click and drag to create a new crop area, drag the corners to adjust, or use the zoom slider above.
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