import { EntityType, EntityTabContent } from '@/types/entity'

export const tabContentRegistry: Record<EntityType, EntityTabContent[]> = {
  author: [
    { id: 'timeline', label: 'Timeline' },
    { id: 'about', label: 'About' },
    { id: 'books', label: 'Books' },
    { id: 'followers', label: 'Followers' },
    { id: 'photos', label: 'Photos' },
    { id: 'more', label: 'More' },
  ],
  book: [
    { id: 'details', label: 'Details' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'about', label: 'About' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'followers', label: 'Followers' },
    { id: 'photos', label: 'Photos' },
    { id: 'more', label: 'More' },
  ],
  publisher: [
    { id: 'timeline', label: 'Timeline' },
    { id: 'about', label: 'About' },
    { id: 'books', label: 'Books' },
    { id: 'followers', label: 'Followers' },
    { id: 'photos', label: 'Photos' },
    { id: 'more', label: 'More' },
  ],
  user: [
    { id: 'timeline', label: 'Timeline' },
    { id: 'about', label: 'About' },
    { id: 'books', label: 'Books' },
    { id: 'shelves', label: 'Shelves' },
    { id: 'friends', label: 'Friends' },
    { id: 'followers', label: 'Followers' },
    { id: 'photos', label: 'Photos' },
    { id: 'more', label: 'More' },
  ],
  group: [
    { id: 'timeline', label: 'Timeline' },
    { id: 'about', label: 'About' },
    { id: 'books', label: 'Books' },
    { id: 'members', label: 'Members' },
    { id: 'discussions', label: 'Discussions' },
    { id: 'photos', label: 'Photos' },
    { id: 'more', label: 'More' },
  ],
  event: [
    { id: 'details', label: 'Details' },
    { id: 'about', label: 'About' },
    { id: 'attendees', label: 'Attendees' },
    { id: 'photos', label: 'Photos' },
    { id: 'more', label: 'More' },
  ],
}

export function getTabsForEntity(entityType: EntityType): EntityTabContent[] {
  return tabContentRegistry[entityType] || []
}

export function isValidTab(entityType: EntityType, tabId: string): boolean {
  const tabs = getTabsForEntity(entityType)
  return tabs.some((tab) => tab.id === tabId)
}
