'use client'

import { use } from 'react'
import { GroupProvider } from '@/contexts/GroupContext'

export default function GroupEditLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  return <GroupProvider groupId={resolvedParams.id}>{children}</GroupProvider>
}
