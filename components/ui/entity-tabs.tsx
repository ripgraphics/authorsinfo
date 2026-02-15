import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface EntityTab {
  id: string
  label: string
  disabled?: boolean
  icon?: React.ReactNode
}

interface EntityTabsProps {
  tabs: EntityTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export function EntityTabs({ tabs, activeTab, onTabChange, className = '' }: EntityTabsProps) {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const validTabIds = tabs.map((t) => t.id)

  // Check if mobile on mount and on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
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
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5) // 5px buffer for rounding
  }

  // Monitor scroll state on mount, resize, and content changes
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Initial check
    setTimeout(checkScroll, 0)

    // Check on scroll events
    container.addEventListener('scroll', checkScroll)

    // Check on resize
    window.addEventListener('resize', checkScroll)

    // Use ResizeObserver to detect content changes
    const resizeObserver = new ResizeObserver(checkScroll)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
      resizeObserver.disconnect()
    }
  }, [isMobile])

  // If the activeTab is invalid, update the URL to the first valid tab
  useEffect(() => {
    if (!validTabIds.includes(activeTab)) {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', validTabIds[0])
      router.replace(url.pathname + url.search, { scroll: false })
      onTabChange(validTabIds[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, validTabIds])

  // Update URL and notify parent when tab is clicked
  const handleTabClick = (tabId: string) => {
    if (tabId !== activeTab) {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', tabId)
      router.replace(url.pathname + url.search, { scroll: false })
      onTabChange(tabId)
    }
  }

  // Scroll handlers for chevron buttons
  const handleScrollLeft = () => {
    if (containerRef.current) {
      const container = containerRef.current
      const scrollAmount = container.clientWidth * 0.8 // Scroll 80% of visible width
      container.scrollTo({
        left: container.scrollLeft - scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const handleScrollRight = () => {
    if (containerRef.current) {
      const container = containerRef.current
      const scrollAmount = container.clientWidth * 0.8 // Scroll 80% of visible width
      container.scrollTo({
        left: container.scrollLeft + scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  // Mobile horizontal scrolling version
  if (isMobile) {
    return (
      <div className={`entity-tabs-mobile relative w-full ${className}`}>
        {/* Left Chevron */}
        <button
          onClick={handleScrollLeft}
          aria-label="Scroll tabs left"
          className={`absolute left-0 top-0 bottom-0 z-20 flex items-center justify-center w-10 bg-gradient-to-r from-white via-white to-transparent transition-opacity duration-300 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronLeft className="h-5 w-5 text-app-theme-blue flex-shrink-0" />
        </button>

        {/* Scrollable Tabs Container */}
        <div
          ref={containerRef}
          className="flex overflow-x-auto scroll-smooth gap-0 px-10 py-0 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          role="tablist"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && handleTabClick(tab.id)}
              disabled={tab.disabled}
              aria-selected={activeTab === tab.id}
              role="tab"
              className={`flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium h-12 min-w-max whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'bg-transparent text-app-theme-blue border-b-2 border-app-theme-blue'
                  : 'text-primary hover:text-app-theme-blue border-b-2 border-transparent'
              } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Chevron */}
        <button
          onClick={handleScrollRight}
          aria-label="Scroll tabs right"
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
      </div>
    )
  }

  // Desktop grid version
  return (
    <div
      className={`entity-tabs-desktop grid h-auto mt-0 bg-transparent overflow-x-auto ${className}`}
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(100px, 1fr))` }}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`entity-tab flex items-center justify-center gap-2 whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12 transition-colors ${activeTab === tab.id ? 'bg-app-theme-blue text-primary-foreground border-b-2 border-app-theme-blue' : 'text-primary hover:bg-app-theme-blue hover:text-primary-foreground'} ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !tab.disabled && handleTabClick(tab.id)}
          disabled={tab.disabled}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
