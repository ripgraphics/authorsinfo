'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'

export default function DebugDatabase() {
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (type: 'SUCCESS' | 'ERROR' | 'INFO', message: string, data?: any) => {
    setResults(prev => [{
      id: Date.now(),
      type,
      message,
      data,
      timestamp: new Date().toISOString()
    }, ...prev])
  }

  const testDatabaseConnection = async () => {
    setIsLoading(true)
    try {
      // Quiet: remove verbose test log
      
      const response = await fetch('/api/test-supabase', {
        method: 'GET'
      })
      
      if (response.ok) {
        const data = await response.json()
        addResult('SUCCESS', 'Database connection successful', data)
      } else {
        const error = await response.text()
        addResult('ERROR', 'Database connection failed', error)
      }
    } catch (error) {
      addResult('ERROR', 'Database connection error', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testPhotoAlbumsTable = async () => {
    setIsLoading(true)
    try {
      addResult('INFO', 'Testing photo_albums table access...')
      
      const response = await fetch('/api/test-db', {
        method: 'GET'
      })
      
      if (response.ok) {
        const data = await response.json()
        addResult('SUCCESS', 'Photo albums table accessible', data)
      } else {
        const error = await response.text()
        addResult('ERROR', 'Photo albums table access failed', error)
      }
    } catch (error) {
      addResult('ERROR', 'Photo albums table test error', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Debug Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button
            onClick={testDatabaseConnection}
            disabled={isLoading}
            variant="outline"
          >
            Test DB Connection
          </Button>
          
          <Button
            onClick={testPhotoAlbumsTable}
            disabled={isLoading}
            variant="outline"
          >
            Test Photo Albums Table
          </Button>
          
          <Button
            onClick={clearResults}
            variant="ghost"
          >
            Clear Results
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Testing...
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.map((result) => (
              <div
                key={result.id}
                className={`p-3 rounded-lg border text-sm ${
                  result.type === 'SUCCESS' 
                    ? 'border-green-200 bg-green-50' 
                    : result.type === 'ERROR'
                    ? 'border-red-200 bg-red-50'
                    : 'border-blue-200 bg-blue-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-medium ${
                    result.type === 'SUCCESS' ? 'text-green-800' :
                    result.type === 'ERROR' ? 'text-red-800' : 'text-blue-800'
                  }`}>
                    {result.type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mb-2">{result.message}</p>
                {result.data && (
                  <pre className="text-xs bg-white/50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}








