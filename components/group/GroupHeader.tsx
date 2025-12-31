import { Button } from '@/components/ui/button'
import { EntityHeader } from '@/components/entity-header'
import { Users, Globe, Star } from 'lucide-react'
import type { Group } from '@/types/group'
import { useState } from 'react'

interface GroupHeaderProps {
  group: Group
  avatarUrl: string
  coverImageUrl: string
  isEditable: boolean
  onCoverImageChange: () => void
  onProfileImageChange: () => void
  activeTab?: string
  onTabChange?: (tabId: string) => void
}

export function GroupHeader({
  group,
  avatarUrl,
  coverImageUrl,
  isEditable,
  onCoverImageChange,
  onProfileImageChange,
  activeTab: initialActiveTab,
  onTabChange: initialOnTabChange,
}: GroupHeaderProps) {
  const [activeTab, setActiveTab] = useState(initialActiveTab || 'timeline')

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    if (initialOnTabChange) {
      initialOnTabChange(tabId)
    }
  }

  const tabs = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'about', label: 'About' },
    { id: 'members', label: 'Members' },
    { id: 'discussions', label: 'Discussions' },
    { id: 'photos', label: 'Photos' },
    { id: 'more', label: 'More' },
  ]

  const groupStats = [
    {
      icon: <Users className="h-4 w-4 mr-1" />,
      text: `${group.member_count || 0} members`,
    },
    {
      icon: <Globe className="h-4 w-4 mr-1" />,
      text: group.is_private ? 'Private' : 'Public',
    },
  ]

  return (
    <EntityHeader
      entityType="group"
      name={group.name}
      coverImageUrl={coverImageUrl}
      profileImageUrl={avatarUrl}
      stats={groupStats}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      creator={{
        id: group.created_by,
        name: '',
        email: '',
        created_at: group.created_at,
      }}
      group={group}
      isEditable={isEditable}
      onCoverImageChange={onCoverImageChange}
      onProfileImageChange={onProfileImageChange}
    />
  )
}
