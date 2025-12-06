import { Button } from "@/components/ui/button";
import { EntityHeader } from "@/components/entity-header";
import { Users, Globe, Star } from "lucide-react";
import type { Group } from "@/types/group";

interface GroupHeaderProps {
  group: Group;
  avatarUrl: string;
  coverImageUrl: string;
  isEditable: boolean;
  onCoverImageChange: () => void;
  onProfileImageChange: () => void;
}

export function GroupHeader({
  group,
  avatarUrl,
  coverImageUrl,
  isEditable,
  onCoverImageChange,
  onProfileImageChange,
}: GroupHeaderProps) {
  const tabs = [
    { id: "timeline", label: "Timeline" },
    { id: "about", label: "About" },
    { id: "members", label: "Members" },
    { id: "discussions", label: "Discussions" },
    { id: "photos", label: "Photos" },
    { id: "more", label: "More" }
  ];

  const groupStats = [
    { 
      icon: <Users className="h-4 w-4 mr-1" />, 
      text: `${group.member_count || 0} members` 
    },
    {
      icon: <Globe className="h-4 w-4 mr-1" />,
      text: group.privacy === 'public' ? "Public" : group.privacy === 'private' ? "Private" : "Hidden"
    },
    {
      icon: <Star className="h-4 w-4 mr-1" />,
      text: group.is_discoverable ? "Discoverable" : "Hidden"
    }
  ];

  return (
    <EntityHeader
      entityType="group"
      name={group.name}
      coverImageUrl={coverImageUrl}
      profileImageUrl={avatarUrl}
      stats={groupStats}
      tabs={tabs}
      creatorName={group.creatorName}
      creator={{
        id: group.created_by,
        name: group.creatorName || '',
        email: group.creatorEmail || '',
        joined_at: group.creatorJoinedAt || group.created_at
      }}
      group={group}
      isEditable={isEditable}
      onCoverImageChange={onCoverImageChange}
      onProfileImageChange={onProfileImageChange}
    />
  );
} 