"use client"

import GroupPolls from '@/components/group/GroupPolls';
import { useParams } from 'next/navigation';

export default function GroupPollsPage() {
  const params = useParams();
  const groupId = params?.id as string;
  if (!groupId) return <div>Loading...</div>;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Group Polls</h1>
      <GroupPolls groupId={groupId} />
    </div>
  );
} 