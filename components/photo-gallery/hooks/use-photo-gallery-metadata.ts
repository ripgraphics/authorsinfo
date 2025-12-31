import { useCallback, useState } from 'react'
import { AlbumImage } from '../types'

interface ExifData {
  make?: string
  model?: string
  software?: string
  dateTime?: string
  exposureTime?: string
  fNumber?: number
  iso?: number
  focalLength?: number
  flash?: boolean
  gps?: {
    latitude?: number
    longitude?: number
    altitude?: number
  }
}

interface ImageMetadata {
  width: number
  height: number
  size: number
  type: string
  exif?: ExifData
}

interface MetadataOptions {
  extractExif?: boolean
  extractGps?: boolean
}

export function usePhotoGalleryMetadata(options: MetadataOptions = {}) {
  const { extractExif = true, extractGps = true } = options

  const [metadataCache, setMetadataCache] = useState<Map<string, ImageMetadata>>(new Map())

  // Get image metadata
  const getImageMetadata = useCallback(
    async (image: AlbumImage, file?: File): Promise<ImageMetadata> => {
      const cached = metadataCache.get(image.id)
      if (cached) return cached

      try {
        const metadata: ImageMetadata = {
          width: 0,
          height: 0,
          size: 0,
          type: '',
        }

        if (file) {
          metadata.size = file.size
          metadata.type = file.type

          // Get image dimensions
          const img = new Image()
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = URL.createObjectURL(file)
          })
          metadata.width = img.width
          metadata.height = img.height

          // Extract EXIF data if available
          if (extractExif && file.type.startsWith('image/')) {
            try {
              const exifData = await extractExifData(file)
              if (exifData) {
                metadata.exif = exifData
              }
            } catch (error) {
              console.warn('Failed to extract EXIF data:', error)
            }
          }
        } else {
          // Fetch image metadata from URL
          const response = await fetch((image as any).url || '')
          const blob = await response.blob()
          metadata.size = blob.size
          metadata.type = blob.type

          // Get image dimensions
          const img = new Image()
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = (image as any).url || ''
          })
          metadata.width = img.width
          metadata.height = img.height
        }

        // Cache metadata
        setMetadataCache((prev) => {
          const next = new Map(prev)
          next.set(image.id, metadata)
          return next
        })

        return metadata
      } catch (error) {
        console.error('Failed to get image metadata:', error)
        throw error
      }
    },
    [metadataCache, extractExif]
  )

  // Extract EXIF data from image file
  const extractExifData = useCallback(
    async (file: File): Promise<ExifData | undefined> => {
      if (!extractExif) return undefined

      try {
        // Create a FileReader to read the file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer()
        const view = new DataView(arrayBuffer)
        let offset = 0

        // Check for JPEG marker
        if (view.getUint16(offset) !== 0xffd8) {
          return undefined
        }

        offset += 2
        const exifData: ExifData = {}

        // Look for EXIF marker
        while (offset < view.byteLength) {
          if (view.getUint16(offset) === 0xffe1) {
            const exifLength = view.getUint16(offset + 2)
            const tiffOffset = offset + 10

            // Check for EXIF header
            if (view.getUint32(tiffOffset) === 0x45786966) {
              const bigEndian = view.getUint16(tiffOffset + 4) === 0x4d4d
              const ifdOffset = tiffOffset + 6

              // Read IFD entries
              const numEntries = view.getUint16(ifdOffset, !bigEndian)
              let entryOffset = ifdOffset + 2

              for (let i = 0; i < numEntries; i++) {
                const tag = view.getUint16(entryOffset, !bigEndian)
                const type = view.getUint16(entryOffset + 2, !bigEndian)
                const count = view.getUint32(entryOffset + 4, !bigEndian)
                const valueOffset = entryOffset + 8

                // Extract basic EXIF data
                switch (tag) {
                  case 0x010f: // Make
                    exifData.make = readString(view, valueOffset, count, bigEndian)
                    break
                  case 0x0110: // Model
                    exifData.model = readString(view, valueOffset, count, bigEndian)
                    break
                  case 0x0131: // Software
                    exifData.software = readString(view, valueOffset, count, bigEndian)
                    break
                  case 0x9003: // DateTimeOriginal
                    exifData.dateTime = readString(view, valueOffset, count, bigEndian)
                    break
                }

                entryOffset += 12
              }
            }
          }
          offset += 2 + view.getUint16(offset + 2)
        }

        return exifData
      } catch (error) {
        console.error('Failed to extract EXIF data:', error)
        return undefined
      }
    },
    [extractExif]
  )

  // Read string from DataView
  const readString = useCallback(
    (view: DataView, offset: number, length: number, bigEndian: boolean): string => {
      let result = ''
      for (let i = 0; i < length; i++) {
        result += String.fromCharCode(view.getUint8(offset + i))
      }
      return result
    },
    []
  )

  // Clear metadata cache
  const clearMetadataCache = useCallback(() => {
    setMetadataCache(new Map())
  }, [])

  return {
    getImageMetadata,
    clearMetadataCache,
  }
}
