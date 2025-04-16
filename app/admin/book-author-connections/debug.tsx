"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function DebugStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      // Direct SQL query to get authors without books
      const authorsWithoutBooksQuery = `
        SELECT COUNT(*) AS count
        FROM authors
        WHERE id NOT IN (
          SELECT DISTINCT author_id 
          FROM book_authors
        )
      `

      // Execute the query using fetch to your API
      const response = await fetch("/api/debug-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: authorsWithoutBooksQuery }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error("Error fetching debug stats:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-base">Debug Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
          {loading ? "Loading..." : "Fetch Raw Stats"}
        </Button>

        {error && <div className="mt-4 p-2 bg-red-50 text-red-700 rounded">Error: {error}</div>}

        {stats && (
          <div className="mt-4">
            <pre className="p-4 bg-gray-50 rounded overflow-auto text-xs">{JSON.stringify(stats, null, 2)}</pre>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          <p>Note: This component requires an API route at /api/debug-query to work.</p>
          <p>If you're seeing errors, you may need to create this route first.</p>
        </div>
      </CardContent>
    </Card>
  )
}
