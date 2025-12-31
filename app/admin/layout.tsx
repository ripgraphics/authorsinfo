import type { ReactNode } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { Toaster } from '@/components/ui/toaster'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      <main
        className="flex-1 flex flex-col bg-background transition-all duration-300"
        style={{ marginLeft: 'var(--sidebar-width, 16rem)' }}
      >
        <AdminHeader />
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
      <Toaster />
    </div>
  )
}
