'use client'

import { use } from 'react'
import { FloatingChat } from '@/components/floating-chat'

type Props = { params: Promise<{ id: string }> }

export default function DirectMessagePage({ params }: Props) {
  const { id } = use(params)
  return <FloatingChat fullPage initialConversationId={id} />
}
