"use client"

import { usePathname } from 'next/navigation'
import { PageHeader } from "@/components/page-header"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  return (
    <>
      {!isAdminRoute && <PageHeader />}
      {children}
    </>
  )
} 