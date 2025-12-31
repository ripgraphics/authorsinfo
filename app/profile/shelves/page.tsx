'use client'

import { ShelfManager } from '@/components/shelf-manager'
import { PageContainer } from '@/components/page-container'
import { PageHeader } from '@/components/page-header'

export default function ShelvesPage() {
  return (
    <PageContainer>
      <PageHeader 
        title="My Bookshelves" 
        description="Organize your reading collection into custom shelves."
      />
      <div className="mt-8">
        <ShelfManager />
      </div>
    </PageContainer>
  )
}
