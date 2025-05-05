"use client"

/**
 * PageBanner - A reusable carousel banner component
 * 
 * Example usage:
 * 
 * ```tsx
 * // Basic usage - automatically fetches 4 random images from Supabase
 * <PageBanner />
 * 
 * // Custom slides (only if needed)
 * <PageBanner 
 *   slides={[
 *     { imageUrl: "/banner1.jpg", altText: "Banner 1", title: "First slide" },
 *     { imageUrl: "/banner2.jpg", altText: "Banner 2", title: "Second slide" }
 *   ]}
 * />
 * 
 * // Custom aspect ratio (default is 7:2)
 * <PageBanner aspectRatio="aspect-[16/9]" />
 * 
 * // Other customization options
 * <PageBanner 
 *   aspectRatio="aspect-[4/1]"
 *   autoplaySpeed={3000}
 *   showControls={false}
 *   className="rounded-lg"
 * />
 * ```
 */

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database"

interface BannerSlide {
  imageUrl: string
  altText: string
  title?: string
  subtitle?: string
}

interface PageBannerProps {
  slides?: BannerSlide[]
  autoplaySpeed?: number
  aspectRatio?: string
  className?: string
  showControls?: boolean
  showIndicators?: boolean
}

// Helper function to create Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// Function to fetch random images from Supabase
async function fetchRandomImages(count = 4) {
  try {
    const { data, error } = await supabase
      .from('images')
      .select('id, url, alt_text')
      .order('id', { ascending: false })
      .limit(50)
    
    if (error) {
      console.error('Error fetching random images:', error)
      return getFallbackImages(count)
    }
    
    if (!data || data.length === 0) {
      return getFallbackImages(count)
    }
    
    // Shuffle and take the first 'count' images
    const shuffled = data.sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, count)
    
    return selected.map(image => ({
      imageUrl: image.url,
      altText: image.alt_text || `Image ${image.id}`,
    }))
  } catch (error) {
    console.error('Error in fetchRandomImages:', error)
    return getFallbackImages(count)
  }
}

// Provide fallback images in case Supabase is not available
function getFallbackImages(count = 4) {
  const fallbackImages = [
    { imageUrl: "/placeholder.svg", altText: "Book Cover 1" },
    { imageUrl: "/placeholder.svg", altText: "Book Cover 2" },
    { imageUrl: "/placeholder.svg", altText: "Book Cover 3" },
    { imageUrl: "/placeholder.svg", altText: "Book Cover 4" }
  ]
  
  return fallbackImages.slice(0, count)
}

export function PageBanner({
  slides: customSlides,
  autoplaySpeed = 5000,
  aspectRatio = "aspect-[7/2]",
  className = "",
  showControls = true,
  showIndicators = true,
}: PageBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides, setSlides] = useState<BannerSlide[]>([])
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Minimum swipe distance (in px)
  const minSwipeDistance = 50
  
  // Touch handlers for mobile swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe) {
      goToNext()
    } else if (isRightSwipe) {
      goToPrev()
    }
  }

  // Load slides (either custom or from Supabase)
  useEffect(() => {
    const loadSlides = async () => {
      setIsLoading(true)
      
      if (customSlides && customSlides.length > 0) {
        setSlides(customSlides)
      } else {
        const randomImages = await fetchRandomImages(4)
        if (randomImages.length > 0) {
          setSlides(randomImages)
        }
      }
      
      setIsLoading(false)
    }
    
    loadSlides()
  }, [customSlides])

  // Autoplay function
  useEffect(() => {
    if (autoplaySpeed <= 0 || slides.length <= 1) return
    
    const startTimer = () => {
      if (timerRef.current) clearInterval(timerRef.current)
      
      timerRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length)
      }, autoplaySpeed)
    }
    
    startTimer()
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [autoplaySpeed, slides.length, currentSlide])

  // Navigation functions
  const goToSlide = (index: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setCurrentSlide(index)
  }

  const goToPrev = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)
  }

  const goToNext = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setCurrentSlide(prev => (prev + 1) % slides.length)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`page-banner ${aspectRatio} bg-gray-200 flex items-center justify-center ${className}`}>
        <p className="text-gray-500">Loading banner...</p>
      </div>
    )
  }

  // No slides state
  if (slides.length === 0) {
    return (
      <div className={`page-banner ${aspectRatio} bg-gray-200 flex items-center justify-center ${className}`}>
        <p className="text-gray-500">No banner images available</p>
      </div>
    )
  }

  return (
    <div 
      className={`page-banner relative ${aspectRatio} bg-gray-200 overflow-hidden ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <Image
            src={slide.imageUrl}
            alt={slide.altText}
            fill
            className="object-cover"
            priority={index === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Caption */}
          {(slide.title || slide.subtitle) && (
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
              {slide.title && <h2 className="text-xl md:text-3xl font-bold">{slide.title}</h2>}
              {slide.subtitle && <p className="mt-2 text-sm md:text-base">{slide.subtitle}</p>}
            </div>
          )}
        </div>
      ))}

      {/* Control buttons */}
      {showControls && slides.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8 p-1.5"
            onClick={goToPrev}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8 p-1.5"
            onClick={goToNext}
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && slides.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide ? "w-6 bg-white" : "w-2 bg-white/50"
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
} 