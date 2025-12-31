'use client'

import { usePathname } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { PageContainer } from '@/components/page-container'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  if (isAdminRoute) {
    return <>{children}</>
  }

  return (
    <>
      <PageHeader />
      <PageContainer>{children}</PageContainer>
    </>
  )
}
