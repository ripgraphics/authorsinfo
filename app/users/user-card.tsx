'use client'

import Link from 'next/link'
import EntityAvatar from '@/components/entity-avatar'

interface UserCardProps {
  user: {
    id: string
    name: string
    permalink?: string | null
  }
}

export function UserCard({ user }: UserCardProps) {
  return (
    <Link
      href={user.permalink ? `/profile/${user.permalink}` : `/profile/${user.id}`}
      className="block bg-white rounded-lg shadow-sm hover:shadow-lg p-4 text-center transition-transform hover:scale-105"
    >
      <div className="mx-auto mb-4 w-16 h-[90px] flex items-start justify-center">
        <div className="w-16 h-16 [&>div]:!flex-none [&>div]:!gap-0 [&>div>div>div]:!w-16 [&>div>div>div]:!h-16">
          <EntityAvatar type="user" id={user.id} name={user.name} size="md" className="" />
        </div>
      </div>
      <h2 className="font-medium truncate">{user.name}</h2>
    </Link>
  )
}
