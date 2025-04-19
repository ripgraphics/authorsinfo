import { Suspense } from "react"
import { ReportsClient } from "./client"

export default function ReportsPage() {
  return (
    <div className="p-6">
      <Suspense fallback={<div>Loading reports...</div>}>
        <ReportsClient />
      </Suspense>
    </div>
  )
}
