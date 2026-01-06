'use client'

import { useEffect, useState } from 'react'
import { useRealtimeStore } from '@/lib/stores/realtime-store'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PresenceIndicator } from '@/components/presence-badge'
import { RealtimeActivityFeed } from '@/components/realtime-activity-feed'

export default function TestRealtimePage() {
  const { user, loading } = useAuth()
  const {
    isConnected,
    connectionError,
    userPresence,
    onlineUserCount,
    activityFeed,
    initialize,
    updatePresence,
    addActivity,
    disconnect,
  } = useRealtimeStore()

  const [testStatus, setTestStatus] = useState<string[]>([])

  const addLog = (message: string) => {
    setTestStatus((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  useEffect(() => {
    if (user?.id && !isConnected) {
      addLog('Initializing Supabase Realtime...')
      initialize(user.id).then(() => {
        addLog('✅ Realtime initialized successfully')
      }).catch((err) => {
        addLog(`❌ Initialization failed: ${err.message}`)
      })
    }
  }, [user?.id, isConnected, initialize])

  const testPresenceUpdate = async () => {
    addLog('Testing presence update to "away"...')
    try {
      await updatePresence('away', false)
      addLog('✅ Presence updated to "away"')
      
      setTimeout(async () => {
        await updatePresence('online', false)
        addLog('✅ Presence updated back to "online"')
      }, 2000)
    } catch (err: any) {
      addLog(`❌ Presence update failed: ${err.message}`)
    }
  }

  const testTypingIndicator = async () => {
    addLog('Testing typing indicator...')
    try {
      await updatePresence('online', true)
      addLog('✅ Typing indicator set to true')
      
      setTimeout(async () => {
        await updatePresence('online', false)
        addLog('✅ Typing indicator set to false')
      }, 3000)
    } catch (err: any) {
      addLog(`❌ Typing indicator failed: ${err.message}`)
    }
  }

  const testActivityBroadcast = async () => {
    addLog('Testing activity broadcast...')
    try {
      await addActivity({
        userId: user?.id || 'test-user',
        type: 'post_created', // Use a valid activity type from schema
        title: 'Test Activity',
        description: `Test activity created at ${new Date().toLocaleTimeString()}`,
        entityType: 'post',
        entityId: 'test-123',
        visibility: 'public',
        metadata: { test: true },
      })
      addLog('✅ Activity broadcasted successfully')
    } catch (err: any) {
      addLog(`❌ Activity broadcast failed: ${err.message}`)
    }
  }

  const testDisconnect = () => {
    addLog('Testing disconnect...')
    disconnect()
    addLog('✅ Disconnected from Realtime')
  }

  const testReconnect = async () => {
    addLog('Testing reconnect...')
    if (user?.id) {
      await initialize(user.id)
      addLog('✅ Reconnected to Realtime')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-center text-muted-foreground">
              Please sign in to test Supabase Realtime features
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Supabase Realtime Test</h1>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Connection Status
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Online Users:</strong> {onlineUserCount}</p>
          {connectionError && (
            <p className="text-red-500"><strong>Error:</strong> {connectionError}</p>
          )}
          <div className="mt-4">
            <PresenceIndicator />
          </div>
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={testPresenceUpdate} variant="outline">
              Test Presence Update
            </Button>
            <Button onClick={testTypingIndicator} variant="outline">
              Test Typing Indicator
            </Button>
            <Button onClick={testActivityBroadcast} variant="outline">
              Test Activity Broadcast
            </Button>
            <Button onClick={testDisconnect} variant="destructive">
              Disconnect
            </Button>
            <Button onClick={testReconnect} variant="default">
              Reconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Presence State */}
      <Card>
        <CardHeader>
          <CardTitle>Current Presence State ({userPresence.size} users)</CardTitle>
        </CardHeader>
        <CardContent>
          {userPresence.size > 0 ? (
            <div className="space-y-2">
              {Array.from(userPresence.entries()).map(([userId, presence]) => (
                <div key={userId} className="flex items-center gap-2 p-2 border rounded">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      presence.status === 'online'
                        ? 'bg-green-500'
                        : presence.status === 'away'
                        ? 'bg-yellow-500'
                        : 'bg-gray-400'
                    }`}
                  />
                  <span className="font-mono text-sm">{userId.slice(0, 8)}...</span>
                  <Badge variant="outline">{presence.status}</Badge>
                  {presence.typing && <Badge>typing...</Badge>}
                  <span className="text-xs text-muted-foreground ml-auto">
                    Last seen: {new Date(presence.lastSeen).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No users online</p>
          )}
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed ({activityFeed.length} items)</CardTitle>
        </CardHeader>
        <CardContent>
          <RealtimeActivityFeed />
        </CardContent>
      </Card>

      {/* Test Log */}
      <Card>
        <CardHeader>
          <CardTitle>Test Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
            {testStatus.length > 0 ? (
              testStatus.map((log, i) => <div key={i}>{log}</div>)
            ) : (
              <div className="text-gray-500">No test logs yet. Click a test button above.</div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setTestStatus([])}
          >
            Clear Log
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
