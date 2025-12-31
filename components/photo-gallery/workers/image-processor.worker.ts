interface OptimizeMessage {
  id: string
  type: 'optimize'
  imageUrl: string
  width: number
  height: number
  quality: number
  format: 'jpeg' | 'webp' | 'avif'
}

interface OptimizedImage {
  url: string
  width: number
  height: number
  size: number
  format: string
}

// Load image and get its dimensions
async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

// Calculate new dimensions while maintaining aspect ratio
function calculateDimensions(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = img

  if (width > maxWidth) {
    height = (maxWidth * height) / width
    width = maxWidth
  }

  if (height > maxHeight) {
    width = (maxHeight * width) / height
    height = maxHeight
  }

  return { width: Math.round(width), height: Math.round(height) }
}

// Process image using canvas
async function processImage(
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number,
  format: string
): Promise<OptimizedImage> {
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  // Draw image
  ctx.drawImage(img, 0, 0, width, height)

  // Convert to blob
  const blob = await canvas.convertToBlob({
    type: `image/${format}`,
    quality: quality / 100,
  })

  // Create object URL
  const url = URL.createObjectURL(blob)

  return {
    url,
    width,
    height,
    size: blob.size,
    format,
  }
}

// Handle messages from main thread
self.addEventListener('message', async (event: MessageEvent) => {
  const message = event.data as OptimizeMessage

  if (message.type === 'optimize') {
    try {
      const img = await loadImage(message.imageUrl)
      const dimensions = calculateDimensions(img, message.width, message.height)
      const result = await processImage(
        img,
        dimensions.width,
        dimensions.height,
        message.quality,
        message.format
      )

      self.postMessage({
        id: message.id,
        result,
      })
    } catch (error) {
      self.postMessage({
        id: message.id,
        error: error instanceof Error ? error.message : 'Failed to optimize image',
      })
    }
  }
})
