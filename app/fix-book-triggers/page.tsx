'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, Loader2, Bug } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function FixBookTriggersPage() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const { toast } = useToast()

  const testBookUpdate = async () => {
    setLoading(true)
    setError('')
    setStatus('')
    setDebugInfo(null)

    try {
      // Use the debug endpoint to test book update
      const response = await fetch('/api/debug-book-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: '94d23dab-6c0d-4311-b433-d5f8af3ddd27',
        }),
      })

      const result = await response.json()

      if (result.success) {
        setStatus('Book update test successful! The updated_at column is working.')
        setDebugInfo(result)
        toast({
          title: 'Success',
          description: 'Book update test completed successfully',
        })
      } else {
        setError(`Failed to test update: ${result.error}`)
        setDebugInfo(result)
        toast({
          title: 'Error',
          description: `Failed to test update: ${result.error}`,
          variant: 'destructive',
        })
      }
    } catch (err) {
      console.error('Exception:', err)
      setError(`Exception: ${err instanceof Error ? err.message : String(err)}`)
      toast({
        title: 'Error',
        description: `An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const debugBookUpdate = async () => {
    setLoading(true)
    setError('')
    setStatus('')
    setDebugInfo(null)

    try {
      // Use the debug endpoint to get more detailed information
      const response = await fetch('/api/debug-book-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: '94d23dab-6c0d-4311-b433-d5f8af3ddd27',
          updateData: {
            title: 'Test Update',
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        setStatus('Debug update successful!')
        setDebugInfo(result)
        toast({
          title: 'Success',
          description: 'Debug book update completed successfully',
        })
      } else {
        setError(`Debug failed: ${result.error}`)
        setDebugInfo(result)
        toast({
          title: 'Error',
          description: `Debug failed: ${result.error}`,
          variant: 'destructive',
        })
      }
    } catch (err) {
      console.error('Exception:', err)
      setError(`Exception: ${err instanceof Error ? err.message : String(err)}`)
      toast({
        title: 'Error',
        description: `An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fixTriggers = async () => {
    setLoading(true)
    setError('')
    setStatus('')
    setDebugInfo(null)

    try {
      // Call the API to test triggers
      const response = await fetch('/api/disable-book-triggers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        setStatus('Book update test successful!')
        setDebugInfo(result)
        toast({
          title: 'Success',
          description: 'Book update test completed successfully',
        })
      } else {
        setError(`Failed to test update: ${result.error}`)
        setDebugInfo(result)
        toast({
          title: 'Error',
          description: `Failed to test update: ${result.error}`,
          variant: 'destructive',
        })
      }
    } catch (err) {
      console.error('Exception:', err)
      setError(`Exception: ${err instanceof Error ? err.message : String(err)}`)
      toast({
        title: 'Error',
        description: `An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Fix Book Update Triggers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This page helps fix the "column role does not exist" error that occurs when updating
              books. The error is caused by database triggers that reference a non-existent role
              column.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <Button onClick={testBookUpdate} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Book Update...
                </>
              ) : (
                'Test Book Update'
              )}
            </Button>

            <Button
              onClick={debugBookUpdate}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Debugging...
                </>
              ) : (
                <>
                  <Bug className="mr-2 h-4 w-4" />
                  Debug Book Update
                </>
              )}
            </Button>

            <Button
              onClick={fixTriggers}
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Admin Update'
              )}
            </Button>
          </div>

          {status && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">{status}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Debug Information:</h3>
              <pre className="text-xs overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>First, try the "Test Book Update" button to see if the issue persists</li>
              <li>Use "Debug Book Update" to get detailed error information</li>
              <li>Try "Test Admin Update" to test with admin privileges</li>
              <li>After successful tests, try editing a book again</li>
              <li>If successful, you should be able to save book edits without errors</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
