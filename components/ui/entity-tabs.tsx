'use client'

import { useRouter } from 'next/navigation'
import { HorizontalScroller, ScrollerItem } from './horizontal-scroller'

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

  const handleTabClick = (tabId: string) => {
    if (tabId === activeTab) return

    const url = new URL(window.location.href)
    url.searchParams.set('tab', tabId)
    router.replace(url.pathname + url.search, { scroll: false })
    onTabChange(tabId)
  }

  const scrollerItems: ScrollerItem[] = tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    disabled: tab.disabled,
    icon: tab.icon,
  }))

  return (
    <HorizontalScroller
      items={scrollerItems}
      activeId={activeTab}
      onItemClick={handleTabClick}
      className={className}
      isTab={true}
      showChevrons={true}
    />
  )
}
