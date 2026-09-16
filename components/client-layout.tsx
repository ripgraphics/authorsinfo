'use client'

import { usePathname } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { PageContainer } from '@/components/page-container'
import { FloatingChat } from '@/components/floating-chat'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')
  const isDirectMessageRoute = pathname?.startsWith('/messages/direct/')

  if (isAdminRoute) {
    return <>{children}</>
  }

  return (
    <>
      <PageHeader showChatLauncher={!isDirectMessageRoute} />
      <PageContainer>{children}</PageContainer>
      {isDirectMessageRoute ? null : <FloatingChat />}
    </>
  )
}
