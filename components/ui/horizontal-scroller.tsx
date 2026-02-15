'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface ScrollerItem {
  id: string
  label: string
  disabled?: boolean
  icon?: React.ReactNode
  action?: () => void
  content?: React.ReactNode
}

interface HorizontalScrollerProps {
  items: ScrollerItem[]
  activeId?: string
  onItemClick?: (id: string) => void
  className?: string
  itemClassName?: string
  containerClassName?: string
  isTab?: boolean
  showChevrons?: boolean
}

export function HorizontalScroller({
  items,
  activeId,
  onItemClick,
  className = '',
  itemClassName = '',
  containerClassName = '',
  isTab = false,
  showChevrons = true,
}: HorizontalScrollerProps) {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Check if mobile on mount and on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Check scroll position for chevron visibility
  const checkScroll = () => {
    if (!containerRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5)
  }

  // Monitor scroll state on mount, resize, and content changes
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    setTimeout(checkScroll, 0)

    container.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)

    const resizeObserver = new ResizeObserver(checkScroll)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
      resizeObserver.disconnect()
    }
  }, [isMobile])

  // Scroll active item into view on mount and when activeId changes
  useEffect(() => {
    if (!isMobile || !containerRef.current || !activeId) return

    const container = containerRef.current
    const activeElement = container.querySelector(`[data-item-id="${activeId}"]`) as HTMLElement

    if (activeElement) {
      setTimeout(() => {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }, 0)
    }
  }, [activeId, isMobile])

  const handleScrollLeft = () => {
    if (containerRef.current) {
      const container = containerRef.current
      const scrollAmount = container.clientWidth * 0.8
      container.scrollTo({
        left: container.scrollLeft - scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const handleScrollRight = () => {
    if (containerRef.current) {
      const container = containerRef.current
      const scrollAmount = container.clientWidth * 0.8
      container.scrollTo({
        left: container.scrollLeft + scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const handleItemClick = (item: ScrollerItem) => {
    if (item.disabled) return

    if (item.action) {
      item.action()
    }

    if (onItemClick) {
      onItemClick(item.id)
    }

    if (isTab) {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', item.id)
      router.replace(url.pathname + url.search, { scroll: false })
    }
  }

  // Mobile horizontal scrolling version
  if (isMobile) {
    return (
      <div className={`horizontal-scroller-mobile relative w-full ${className}`}>
        {showChevrons && (
          <>
            {/* Left Chevron */}
            <button
              onClick={handleScrollLeft}
              aria-label="Scroll left"
              className={`absolute left-0 top-0 bottom-0 z-20 flex items-center justify-center w-10 bg-gradient-to-r from-white via-white to-transparent transition-opacity duration-300 ${
                canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <ChevronLeft className="h-5 w-5 text-app-theme-blue flex-shrink-0" />
            </button>

            {/* Right Chevron */}
            <button
              onClick={handleScrollRight}
              aria-label="Scroll right"
              className={`absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-10 bg-gradient-to-l from-white via-white to-transparent transition-opacity duration-300 ${
                canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <ChevronRight className="h-5 w-5 text-app-theme-blue flex-shrink-0" />
            </button>

            {/* Left Gradient Fade */}
            <div
              className={`absolute left-10 top-0 bottom-0 w-[30px] bg-gradient-to-r from-white to-transparent pointer-events-none transition-opacity duration-300 ${
                canScrollLeft ? 'opacity-80' : 'opacity-0'
              }`}
              aria-hidden="true"
            />

            {/* Right Gradient Fade */}
            <div
              className={`absolute right-10 top-0 bottom-0 w-[30px] bg-gradient-to-l from-white to-transparent pointer-events-none transition-opacity duration-300 ${
                canScrollRight ? 'opacity-80' : 'opacity-0'
              }`}
              aria-hidden="true"
            />
          </>
        )}

        {/* Scrollable Items Container */}
        <div
          ref={containerRef}
          className={`flex overflow-x-auto scroll-smooth gap-1 px-0 py-0 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${containerClassName}`}
          role={isTab ? 'tablist' : undefined}
        >
          {items.map((item) => (
            <div
              key={item.id}
              data-item-id={item.id}
              onClick={() => handleItemClick(item)}
              className={`flex-shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium h-12 min-w-[90px] whitespace-nowrap transition-colors cursor-pointer ${
                activeId === item.id
                  ? 'bg-app-theme-blue text-primary-foreground'
                  : 'text-primary hover:bg-app-theme-blue hover:text-primary-foreground'
              } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${itemClassName}`}
              role={isTab ? 'tab' : undefined}
              aria-selected={isTab ? activeId === item.id : undefined}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              {item.label && <span className="truncate">{item.label}</span>}
              {item.content && item.content}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Desktop grid version
  return (
    <div
      className={`horizontal-scroller-desktop grid h-auto mt-0 bg-transparent overflow-x-auto ${className}`}
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(100px, 1fr))` }}
      role={isTab ? 'tablist' : undefined}
    >
      {items.map((item) => (
        <div
          key={item.id}
          data-item-id={item.id}
          onClick={() => handleItemClick(item)}
          className={`flex items-center justify-center gap-2 whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12 transition-colors cursor-pointer ${
            activeId === item.id
              ? 'bg-app-theme-blue text-primary-foreground'
              : 'text-primary hover:bg-app-theme-blue hover:text-primary-foreground'
          } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${itemClassName}`}
          role={isTab ? 'tab' : undefined}
          aria-selected={isTab ? activeId === item.id : undefined}
        >
          {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
          {item.label && <span>{item.label}</span>}
          {item.content && item.content}
        </div>
      ))}
    </div>
  )
}
