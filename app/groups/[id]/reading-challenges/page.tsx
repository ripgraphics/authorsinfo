'use client'

import GroupReadingChallenges from '@/components/group/GroupReadingChallenges'
import { useParams } from 'next/navigation'

export default function GroupReadingChallengesPage() {
  const params = useParams()
  const groupId = params?.id as string
  if (!groupId) return <div>Loading...</div>
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Group Reading Challenges</h1>
      <GroupReadingChallenges groupId={groupId} />
    </div>
  )
}
