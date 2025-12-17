"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAuthorBookStats } from "@/app/actions/admin-book-authors"

export function DebugStats() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getAuthorBookStats()
      setStats(result)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">Debug Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={fetchStats} disabled={loading}>
          {loading ? "Loading..." : "Fetch Stats Directly"}
        </Button>

        {error && (
          <div className="mt-2 p-2 bg-red-50 text-red-700 rounded-sm">
            <p className="font-semibold">Error:</p>
            <pre className="text-xs overflow-auto">{error}</pre>
          </div>
        )}

        {stats && (
          <div className="mt-2 p-2 bg-gray-50 rounded-sm">
            <p className="font-semibold">Raw Stats:</p>
            <pre className="text-xs overflow-auto">{JSON.stringify(stats, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
