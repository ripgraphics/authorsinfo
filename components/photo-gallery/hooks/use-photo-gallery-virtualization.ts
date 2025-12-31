import { useCallback, useState, useEffect, useRef } from 'react'
import { AlbumImage } from '../types'

interface VirtualizationState {
  visibleRange: {
    start: number
    end: number
  }
  itemHeight: number
  containerHeight: number
  scrollTop: number
}

interface VirtualizationOptions {
  items: AlbumImage[]
  itemHeight: number
  overscan?: number
  containerHeight?: number
  gridCols?: number
}

export function usePhotoGalleryVirtualization(options: VirtualizationOptions) {
  const {
    items,
    itemHeight,
    overscan = 3,
    containerHeight = window.innerHeight,
    gridCols = 3,
  } = options

  const [virtualizationState, setVirtualizationState] = useState<VirtualizationState>({
    visibleRange: { start: 0, end: 0 },
    itemHeight,
    containerHeight,
    scrollTop: 0,
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Calculate visible range based on scroll position
  const calculateVisibleRange = useCallback(
    (scrollTop: number) => {
      const start = Math.floor(scrollTop / itemHeight) - overscan
      const visibleItems = Math.ceil(containerHeight / itemHeight) + 2 * overscan
      const end = start + visibleItems

      return {
        start: Math.max(0, start),
        end: Math.min(items.length, end),
      }
    },
    [itemHeight, overscan, containerHeight, items.length]
  )

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return

    const scrollTop = containerRef.current.scrollTop
    const visibleRange = calculateVisibleRange(scrollTop)

    setVirtualizationState((prev) => ({
      ...prev,
      visibleRange,
      scrollTop,
    }))
  }, [calculateVisibleRange])

  // Initialize intersection observer for lazy loading
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            const src = img.getAttribute('data-src')
            if (src) {
              img.src = src
              img.removeAttribute('data-src')
              observerRef.current?.unobserve(img)
            }
          }
        })
      },
      {
        root: containerRef.current,
        rootMargin: '50px',
        threshold: 0.1,
      }
    )

    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  // Update visible range when container height changes
  useEffect(() => {
    const updateContainerHeight = () => {
      if (!containerRef.current) return

      const newHeight = containerRef.current.clientHeight
      setVirtualizationState((prev) => ({
        ...prev,
        containerHeight: newHeight,
        visibleRange: calculateVisibleRange(prev.scrollTop),
      }))
    }

    const resizeObserver = new ResizeObserver(updateContainerHeight)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [calculateVisibleRange])

  // Get visible images
  const getVisibleImages = useCallback(() => {
    const { start, end } = virtualizationState.visibleRange
    return items.slice(start, end)
  }, [items, virtualizationState.visibleRange])

  // Calculate item position
  const getItemStyle = useCallback(
    (index: number) => {
      const row = Math.floor(index / gridCols)
      const col = index % gridCols
      const top = row * itemHeight
      const left = (col * 100) / gridCols

      return {
        position: 'absolute',
        top: `${top}px`,
        left: `${left}%`,
        width: `${100 / gridCols}%`,
        height: `${itemHeight}px`,
      }
    },
    [itemHeight, gridCols]
  )

  // Calculate total height
  const getTotalHeight = useCallback(() => {
    const rows = Math.ceil(items.length / gridCols)
    return rows * itemHeight
  }, [items.length, gridCols, itemHeight])

  // Handle image load
  const handleImageLoad = useCallback((img: HTMLImageElement) => {
    if (img.getAttribute('data-src')) {
      observerRef.current?.observe(img)
    }
  }, [])

  return {
    containerRef,
    virtualItems: getVisibleImages(),
    totalSize: getTotalHeight(),
    scrollToIndex: (index: number) => {
      if (containerRef.current) {
        const row = Math.floor(index / gridCols)
        containerRef.current.scrollTop = row * itemHeight
      }
    },
    handleScroll,
    getItemStyle,
    handleImageLoad,
  }
}
