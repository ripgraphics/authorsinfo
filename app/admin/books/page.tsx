import type { Metadata } from 'next'
import { AdminBooksManager } from '@/components/admin/admin-books-manager'

export const metadata: Metadata = {
  title: "Admin - Books Management | Author's Info",
  description: 'Admin interface for managing all books and related data',
}

export default async function AdminBooksPage() {
  return (
    <div className="space-y-6">
      <div className="py-4">
        <h1 className="text-3xl font-bold tracking-tight">Books Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage all books, authors, publishers, images, and related data
        </p>
      </div>

      <AdminBooksManager />
    </div>
  )
}
