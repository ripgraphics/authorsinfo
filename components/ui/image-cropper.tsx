"use client"

import React, { useState, useRef, useCallback } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'
import { X, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'

interface ImageCropperProps {
  imageUrl: string
  onCropComplete: (croppedImageBlob: Blob) => void
  onCancel: () => void
  aspectRatio?: number
  targetWidth?: number
  targetHeight?: number
}

export function ImageCropper({
  imageUrl,
  onCropComplete,
  onCancel,
  aspectRatio = 1344 / 500, // Default aspect ratio
  targetWidth = 1344,
  targetHeight = 500
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(1)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const imgRef = useRef<HTMLImageElement>(null)

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

  // Constrain crop to image bounds
  const constrainCrop = useCallback((newCrop: Crop): Crop => {
    if (!imageDimensions.width || !imageDimensions.height) return newCrop;

    const maxWidth = imageDimensions.width;
    const maxHeight = imageDimensions.height;

    let { x, y, width, height } = newCrop;

    // Ensure minimum size
    const minSize = 50;
    if (width < minSize) width = minSize;
    if (height < minSize) height = minSize;

    // Ensure crop doesn't go outside image bounds - more aggressive constraints
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + width > maxWidth) {
      x = Math.max(0, maxWidth - width);
      if (x < 0) {
        width = maxWidth;
        x = 0;
      }
    }
    if (y + height > maxHeight) {
      y = Math.max(0, maxHeight - height);
      if (y < 0) {
        height = maxHeight;
        y = 0;
      }
    }

    // Final bounds check
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + width > maxWidth) width = maxWidth - x;
    if (y + height > maxHeight) height = maxHeight - y;

    return { ...newCrop, x, y, width, height };
  }, [imageDimensions]);

  // Handle image load
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setImageLoaded(true);
      const { width, height } = e.currentTarget;
      setImageDimensions({ width, height });
      if (aspectRatio) {
        const centeredCrop = centerAspectCrop(width, height);
        setCrop(centeredCrop);
      }
    },
    [aspectRatio, centerAspectCrop],
  );

  // Handle image error
  const onImageError = useCallback(() => {
    setImageLoaded(false)
    console.error('Failed to load image')
  }, [])

  // Generate cropped image
  const generateCroppedImage = async () => {
    if (!imgRef.current || !completedCrop) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    const scaleX = imgRef.current.naturalWidth / imgRef.current.width
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height

    canvas.width = targetWidth
    canvas.height = targetHeight

    // Apply rotation and scale transformations
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(scale, scale)
    ctx.translate(-canvas.width / 2, -canvas.height / 2)

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

      ctx.restore()

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onCropComplete(blob)
          }
        },
        'image/jpeg',
        0.95
      )
    } catch (error) {
      console.error('Error drawing image to canvas:', error)
      // If CORS error, try to create a new image with crossOrigin
      if (error instanceof Error && error.message.includes('tainted')) {
        try {
          // Create a new image element with crossOrigin
          const newImg = new Image()
          newImg.crossOrigin = 'anonymous'
          
          newImg.onload = () => {
            const newCanvas = document.createElement('canvas')
            const newCtx = newCanvas.getContext('2d')
            
            if (!newCtx) return
            
            newCanvas.width = targetWidth
            newCanvas.height = targetHeight
            
            // Apply transformations
            newCtx.save()
            newCtx.translate(newCanvas.width / 2, newCanvas.height / 2)
            newCtx.rotate((rotation * Math.PI) / 180)
            newCtx.scale(scale, scale)
            newCtx.translate(-newCanvas.width / 2, -newCanvas.height / 2)
            
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
            
            newCtx.restore()
            
            newCanvas.toBlob(
              (blob) => {
                if (blob) {
                  onCropComplete(blob)
                }
              },
              'image/jpeg',
              0.95
            )
          }
          
          newImg.onerror = () => {
            console.error('Failed to load image with crossOrigin')
            // Fallback: try to fetch the image and create a blob URL
            fetch(imageUrl)
              .then(response => response.blob())
              .then(blob => {
                const url = URL.createObjectURL(blob)
                const fallbackImg = new Image()
                fallbackImg.onload = () => {
                  const fallbackCanvas = document.createElement('canvas')
                  const fallbackCtx = fallbackCanvas.getContext('2d')
                  
                  if (!fallbackCtx) return
                  
                  fallbackCanvas.width = targetWidth
                  fallbackCanvas.height = targetHeight
                  
                  fallbackCtx.save()
                  fallbackCtx.translate(fallbackCanvas.width / 2, fallbackCanvas.height / 2)
                  fallbackCtx.rotate((rotation * Math.PI) / 180)
                  fallbackCtx.scale(scale, scale)
                  fallbackCtx.translate(-fallbackCanvas.width / 2, -fallbackCanvas.height / 2)
                  
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
                  
                  fallbackCtx.restore()
                  
                  fallbackCanvas.toBlob(
                    (blob) => {
                      if (blob) {
                        onCropComplete(blob)
                      }
                    },
                    'image/jpeg',
                    0.95
                  )
                }
                fallbackImg.src = url
              })
              .catch(fetchError => {
                console.error('Failed to fetch image:', fetchError)
              })
          }
          
          newImg.src = imageUrl
        } catch (fallbackError) {
          console.error('Fallback error:', fallbackError)
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
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Controls */}
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRotation((r) => r - 90)}
            className="h-8 px-2"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
            className="h-8 px-2"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale((s) => Math.min(3, s + 0.1))}
            className="h-8 px-2"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <span className="ml-2 text-sm text-gray-600">
            {Math.round(scale * 100)}% | {rotation}°
          </span>
        </div>

        {/* Image Cropper */}
        <div className="max-h-[60vh] overflow-auto">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => {
              const constrainedCrop = constrainCrop(percentCrop);
              setCrop(constrainedCrop);
            }}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            minWidth={50}
            minHeight={50}
            keepSelection
            ruleOfThirds
            className="max-w-full"
            disabled={!imageLoaded}
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
          Drag the corners to adjust the crop area. The crop must stay within the image bounds.
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={generateCroppedImage}
            disabled={!completedCrop || !imageLoaded}
          >
            Crop Image
          </Button>
        </div>
      </div>
    </div>
  )
} 