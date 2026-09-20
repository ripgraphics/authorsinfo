'use client'

import { usePathname } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { PageContainer } from '@/components/page-container'
import { FloatingChat } from '@/components/floating-chat'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')
  const isMessengerRoute = pathname === '/messages' || pathname?.startsWith('/messages/')

  if (isAdminRoute) {
    return <>{children}</>
  }

  return (
    <>
      <PageHeader showChatLauncher={!isMessengerRoute} />
      <FloatingChat compactInbox openEventName="authorsinfo:open-messenger-chats" />
      {isMessengerRoute ? children : <PageContainer>{children}</PageContainer>}
      {isMessengerRoute ? null : <FloatingChat />}
    </>
  )
}
