import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const validTabIds = tabs.map((t) => t.id)
  const activeTabLabel = tabs.find((t) => t.id === activeTab)?.label || 'Select Tab'

  // Check if mobile on mount and on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
      setIsDropdownOpen(false)
    }
  }

  // Mobile dropdown version
  if (isMobile) {
    return (
      <div className={`entity-tabs-mobile relative w-full ${className}`}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <span className="truncate">{activeTabLabel}</span>
          <ChevronDown
            className={`h-4 w-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && handleTabClick(tab.id)}
                disabled={tab.disabled}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-app-theme-blue/10 text-app-theme-blue border-l-4 border-app-theme-blue'
                    : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${
                  tabs.indexOf(tab) !== tabs.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
                <span className="flex-1 truncate">{tab.label}</span>
              </button>
            ))}
          </div>
        )}
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
          className={`entity-tab flex items-center justify-center gap-2 whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12 transition-colors ${activeTab === tab.id ? 'border-b-2 border-app-theme-blue text-app-theme-blue' : 'text-gray-700 hover:text-app-theme-blue'} ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
