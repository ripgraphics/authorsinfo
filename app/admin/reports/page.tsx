import { Suspense } from 'react'
import { ReportsClient } from './client'

export default function ReportsPage() {
  return (
    <div className="p-4">
      <Suspense fallback={<div>Loading reports...</div>}>
        <ReportsClient />
      </Suspense>
    </div>
  )
}
