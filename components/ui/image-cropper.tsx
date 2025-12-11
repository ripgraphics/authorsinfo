"use client"

import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { X, Loader2, ZoomIn, ZoomOut } from 'lucide-react'

interface ImageCropperProps {
  imageUrl: string
  onCropComplete: (croppedImageBlob: Blob) => void
  onCancel: () => void
  aspectRatio?: number
  targetWidth?: number
  targetHeight?: number
  isProcessing?: boolean
  circularCrop?: boolean
  // Fully customizable text content
  title?: string
  cancelButtonText?: string
  cropButtonText?: string
  processingText?: string
  helpText?: string
  imageAltText?: string
  // Fully customizable styling
  modalWrapperClassName?: string
  modalClassName?: string
  headerClassName?: string
  containerClassName?: string
  footerClassName?: string
  cancelButtonClassName?: string
  cropButtonClassName?: string
  minZoom?: number
  maxZoom?: number
  zoomStep?: number
}

export function ImageCropper({
  imageUrl,
  onCropComplete,
  onCancel,
  aspectRatio = 1344 / 500, // Default aspect ratio (wide/landscape for entity headers)
  targetWidth = 1344,
  targetHeight = 500,
  isProcessing = false,
  circularCrop = false,
  // Fully customizable text content with defaults
  title = "Crop Image",
  cancelButtonText = "Cancel",
  cropButtonText = "Crop Image",
  processingText = "Processing...",
  helpText = "Click and drag to adjust crop area",
  imageAltText = "Crop me",
  // Fully customizable styling with defaults
  modalWrapperClassName = "fixed inset-0 z-50 flex items-center justify-center bg-black/80",
  modalClassName = "relative h-[95vh] max-h-[95vh] w-[95vw] max-w-[95vw] flex flex-col rounded-lg bg-white overflow-hidden",
  headerClassName = "flex-shrink-0 flex items-center justify-between px-3 py-2 border-b",
  containerClassName = "flex-1 min-h-0 overflow-hidden flex items-center justify-center bg-gray-50 p-4",
  footerClassName = "flex-shrink-0 flex items-center justify-between px-3 py-2 border-t bg-white",
  cancelButtonClassName = "h-7 px-3 text-xs",
  cropButtonClassName = "h-7 px-3 text-xs",
  minZoom = 1,
  maxZoom = 3,
  zoomStep = 0.1
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [internalProcessing, setInternalProcessing] = useState(false)

  // Use external isProcessing if provided, otherwise use internal state
  const processing = isProcessing !== undefined ? isProcessing : internalProcessing

  // Handle crop complete from react-easy-crop
  const onCropChange = useCallback((crop: Point) => {
    setCrop(crop)
  }, [])

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(Math.min(Math.max(zoom, minZoom), maxZoom))
  }, [minZoom, maxZoom])

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + zoomStep, maxZoom))
  }, [zoomStep, maxZoom])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - zoomStep, minZoom))
  }, [zoomStep, minZoom])

  const handleZoomSliderChange = useCallback((value: number[]) => {
    setZoom(value[0])
  }, [])

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  // Generate cropped image from croppedAreaPixels
  const generateCroppedImage = useCallback(async () => {
    if (!croppedAreaPixels) return

    setInternalProcessing(true)

    try {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      
      await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = reject
        image.src = imageUrl
      })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      setInternalProcessing(false)
      return
    }

      // Use target dimensions if provided, otherwise use cropped area dimensions
      const outputWidth = targetWidth || croppedAreaPixels.width
      const outputHeight = targetHeight || croppedAreaPixels.height

      canvas.width = outputWidth
      canvas.height = outputHeight

      // Draw the cropped image
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        outputWidth,
        outputHeight
      )

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onCropComplete(blob)
          }
          setInternalProcessing(false)
        },
        'image/jpeg',
        0.95
      )
    } catch (error) {
      console.error('Error generating cropped image:', error)
      setInternalProcessing(false)
    }
  }, [croppedAreaPixels, imageUrl, targetWidth, targetHeight, onCropComplete])

  return (
    <div className={modalWrapperClassName}>
      <div className={modalClassName}>
        {/* Fully Customizable Header */}
        <div className={headerClassName}>
          <h3 className="text-sm font-semibold">{title}</h3>
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

        {/* Fully Customizable Image Cropper Container */}
        <div 
          className={containerClassName}
          style={{ 
            minHeight: 0,
            height: '100%',
            maxHeight: '100%',
            width: '100%',
            maxWidth: '100%',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            cropShape={circularCrop ? 'round' : 'rect'}
            showGrid={true}
            restrictPosition={true}
            style={{
              containerStyle: {
                width: '100%',
                height: '100%',
                position: 'relative'
              },
              cropAreaStyle: {
                border: '2px solid #fff'
              }
            }}
          />
        </div>

        {/* Fully Customizable Footer */}
        <div className={footerClassName}>
          <div className="flex-1 flex flex-col gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center gap-3 px-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={processing || zoom <= minZoom}
                className="h-7 w-7 p-0"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-xs text-gray-500 min-w-[3rem] text-right">
                  {Math.round(zoom * 100)}%
                </span>
                <Slider
                  value={[zoom]}
                  onValueChange={handleZoomSliderChange}
                  min={minZoom}
                  max={maxZoom}
                  step={zoomStep}
                  disabled={processing}
                  className="flex-1"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={processing || zoom >= maxZoom}
                className="h-7 w-7 p-0"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Help Text and Action Buttons */}
            <div className="flex items-center justify-between">
              {helpText && (
          <div className="text-xs text-gray-500">
                  {helpText}
          </div>
              )}
              <div className="flex gap-2 ml-auto">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onCancel} 
              disabled={processing}
                  className={cancelButtonClassName}
            >
                  {cancelButtonText}
            </Button>
            <Button
              size="sm"
              onClick={generateCroppedImage}
                  disabled={!croppedAreaPixels || processing}
                  className={cropButtonClassName}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      {processingText}
                </>
              ) : (
                    cropButtonText
              )}
            </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
