'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

export default function FixAuthPage() {
  const [debugData, setDebugData] = useState<any>(null)
  const [fixResult, setFixResult] = useState<any>(null)
  const [isDebugging, setIsDebugging] = useState(false)
  const [isFixing, setIsFixing] = useState(false)

  const debugAuth = async () => {
    setIsDebugging(true)
    setDebugData(null)
    try {
      const response = await fetch('/api/debug-auth')
      const data = await response.json()
      setDebugData(data)
    } catch (error) {
      setDebugData({ error: 'Failed to debug auth system' })
    } finally {
      setIsDebugging(false)
    }
  }

  const fixAuthUsers = async () => {
    setIsFixing(true)
    setFixResult(null)
    try {
      const response = await fetch('/api/fix-auth-users', {
        method: 'POST'
      })
      const data = await response.json()
      setFixResult(data)
    } catch (error) {
      setFixResult({ error: 'Failed to fix auth users' })
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Fix Auth System After UUID Migration</h1>
        <p className="text-muted-foreground mt-2">
          This page helps debug and fix authentication issues caused by the UUID migration.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Debug Auth System</CardTitle>
            <CardDescription>
              Check the current state of your Supabase Auth system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={debugAuth} 
              disabled={isDebugging}
              className="w-full"
            >
              {isDebugging ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Debugging...
                </>
              ) : (
                'Debug Auth System'
              )}
            </Button>
            
            {debugData && (
              <div className="mt-4">
                <Alert variant={debugData.error ? "destructive" : "default"}>
                  {debugData.error ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {debugData.error ? 'Error' : 'Debug Results'}
                  </AlertTitle>
                  <AlertDescription>
                    <pre className="text-xs mt-2 overflow-auto">
                      {JSON.stringify(debugData, null, 2)}
                    </pre>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fix Auth Users</CardTitle>
            <CardDescription>
              Fix all users to have valid passwords after UUID migration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={fixAuthUsers} 
              disabled={isFixing}
              className="w-full"
              variant="destructive"
            >
              {isFixing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing...
                </>
              ) : (
                'Fix All Users'
              )}
            </Button>
            
            {fixResult && (
              <div className="mt-4">
                <Alert variant={fixResult.error ? "destructive" : "default"}>
                  {fixResult.error ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {fixResult.error ? 'Error' : 'Fix Results'}
                  </AlertTitle>
                  <AlertDescription>
                    <pre className="text-xs mt-2 overflow-auto">
                      {JSON.stringify(fixResult, null, 2)}
                    </pre>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            <li>First, click "Debug Auth System" to see the current state</li>
            <li>If users have issues, click "Fix All Users" to reset their passwords</li>
            <li>After fixing, go to <code>/login</code> and try logging in with any user email and password: <code>password123</code></li>
            <li>If the fix doesn't work, you may need to recreate users or reset your Supabase Auth</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
} 