/* eslint-disable descriptive-classname/require-semantic-classname */
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Phone, ShieldAlert, CheckCircle2 } from 'lucide-react'

interface CallSettings {
  turn_provider: string | null
  turn_url: string | null
  turn_username: string | null
  turn_credential: string | null
  stun_url: string | null
  signaling_server_url: string | null
  signaling_auth_token: string | null
  calls_enabled: string | null
}

interface CallStatus {
  enabled: boolean
  ready: boolean
  reason: string | null
  turnConfigured: boolean
  signalingConfigured: boolean
}

export default function AdminCallSettingsPage() {
  const [settings, setSettings] = useState<CallSettings | null>(null)
  const [status, setStatus] = useState<CallStatus | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = async () => {
    const response = await fetch('/api/admin/call-settings', { cache: 'no-store' })
    const data = await response.json()
    if (!response.ok) setError(data.error || 'Unable to load call settings.')
    else {
      setSettings(data.settings as CallSettings)
      setStatus(data.status as CallStatus)
    }
  }

  useEffect(() => {
    void loadSettings()
  }, [])

  const saveSettings = async () => {
    if (!settings) return
    setSaving(true)
    setError(null)
    setMessage(null)
    const response = await fetch('/api/admin/call-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        turn_provider: settings.turn_provider || undefined,
        turn_url: settings.turn_url || undefined,
        turn_username: settings.turn_username || undefined,
        turn_credential: settings.turn_credential || undefined,
        stun_url: settings.stun_url || undefined,
        signaling_server_url: settings.signaling_server_url || undefined,
        signaling_auth_token: settings.signaling_auth_token || undefined,
        calls_enabled: settings.calls_enabled === 'true' ? 'true' : 'false',
      }),
    })
    const data = await response.json()
    if (!response.ok) setError(data.error || 'Unable to save call settings.')
    else {
      setSettings(data.settings as CallSettings)
      setStatus(data.status as CallStatus)
      setMessage('Call settings saved.')
    }
    setSaving(false)
  }

  const update = (key: keyof CallSettings, value: string) => {
    setSettings((current) => (current ? { ...current, [key]: value } : current))
  }

  return (
    <main className="admin-call-settings mx-auto max-w-3xl p-4 md:p-6">
      <header className="admin-call-settings__header mb-6">
        <h1 className="admin-call-settings__title flex items-center gap-2 text-2xl font-bold">
          <Phone className="admin-call-settings__title-icon h-6 w-6" />
          Voice &amp; Video Call Settings
        </h1>
        <p className="admin-call-settings__description text-sm text-muted-foreground">
          Configure the TURN/STUN provider and signaling server. Calls remain disabled until all
          required fields are provided and calls are explicitly enabled.
        </p>
      </header>

      {status ? (
        <div
          className={`admin-call-settings__status mb-6 rounded-lg border p-4 ${
            status.ready ? 'border-green-500/50 bg-green-500/5' : 'border-dashed'
          }`}
        >
          <p className="admin-call-settings__status-text flex items-center gap-2 text-sm">
            {status.ready ? (
              <CheckCircle2 className="admin-call-settings__status-icon-ready h-4 w-4 text-green-600" />
            ) : (
              <ShieldAlert className="admin-call-settings__status-icon-warning h-4 w-4 text-amber-600" />
            )}
            {status.ready
              ? 'Calls are enabled and ready.'
              : status.reason || 'Calls are not configured yet.'}
          </p>
        </div>
      ) : null}

      {settings ? (
        <Card className="admin-call-settings__card">
          <CardHeader className="admin-call-settings__card-header">
            <CardTitle className="admin-call-settings__card-title">
              Provider Configuration
            </CardTitle>
            <CardDescription className="admin-call-settings__card-description">
              Enter the connection details for your TURN/STUN provider and WebRTC signaling server.
              Credentials are stored securely and never exposed to clients.
            </CardDescription>
          </CardHeader>
          <CardContent className="admin-call-settings__card-content space-y-4">
            <div className="admin-call-settings__field space-y-2">
              <Label htmlFor="turn_provider" className="admin-call-settings__label">
                TURN Provider Name
              </Label>
              <Input
                id="turn_provider"
                value={settings.turn_provider ?? ''}
                onChange={(event) => update('turn_provider', event.target.value)}
                placeholder="e.g. Twilio, Xirsys, coturn"
                className="admin-call-settings__input"
              />
            </div>

            <div className="admin-call-settings__field space-y-2">
              <Label htmlFor="turn_url" className="admin-call-settings__label">
                TURN Server URL (required)
              </Label>
              <Input
                id="turn_url"
                value={settings.turn_url ?? ''}
                onChange={(event) => update('turn_url', event.target.value)}
                placeholder="turn:turn.example.com:3478"
                className="admin-call-settings__input"
              />
            </div>

            <div className="admin-call-settings__field space-y-2">
              <Label htmlFor="turn_username" className="admin-call-settings__label">
                TURN Username
              </Label>
              <Input
                id="turn_username"
                value={settings.turn_username ?? ''}
                onChange={(event) => update('turn_username', event.target.value)}
                placeholder="TURN authentication username"
                className="admin-call-settings__input"
              />
            </div>

            <div className="admin-call-settings__field space-y-2">
              <Label htmlFor="turn_credential" className="admin-call-settings__label">
                TURN Credential (secret)
              </Label>
              <Input
                id="turn_credential"
                type="password"
                value={
                  settings.turn_credential === 'configured' ? '' : (settings.turn_credential ?? '')
                }
                onChange={(event) => update('turn_credential', event.target.value)}
                placeholder={
                  settings.turn_credential === 'configured'
                    ? 'Configured (enter to replace)'
                    : 'TURN authentication credential'
                }
                className="admin-call-settings__input"
              />
            </div>

            <div className="admin-call-settings__field space-y-2">
              <Label htmlFor="stun_url" className="admin-call-settings__label">
                STUN Server URL (optional)
              </Label>
              <Input
                id="stun_url"
                value={settings.stun_url ?? ''}
                onChange={(event) => update('stun_url', event.target.value)}
                placeholder="stun:stun.example.com:3478"
                className="admin-call-settings__input"
              />
            </div>

            <div className="admin-call-settings__field space-y-2">
              <Label htmlFor="signaling_server_url" className="admin-call-settings__label">
                Signaling Server URL (required)
              </Label>
              <Input
                id="signaling_server_url"
                value={settings.signaling_server_url ?? ''}
                onChange={(event) => update('signaling_server_url', event.target.value)}
                placeholder="wss://signaling.example.com"
                className="admin-call-settings__input"
              />
            </div>

            <div className="admin-call-settings__field space-y-2">
              <Label htmlFor="signaling_auth_token" className="admin-call-settings__label">
                Signaling Auth Token (secret)
              </Label>
              <Input
                id="signaling_auth_token"
                type="password"
                value={
                  settings.signaling_auth_token === 'configured'
                    ? ''
                    : (settings.signaling_auth_token ?? '')
                }
                onChange={(event) => update('signaling_auth_token', event.target.value)}
                placeholder={
                  settings.signaling_auth_token === 'configured'
                    ? 'Configured (enter to replace)'
                    : 'Signaling server authentication token'
                }
                className="admin-call-settings__input"
              />
            </div>

            <div className="admin-call-settings__field space-y-2">
              <Label htmlFor="calls_enabled" className="admin-call-settings__label">
                Enable Calls
              </Label>
              <select
                id="calls_enabled"
                value={settings.calls_enabled ?? 'false'}
                onChange={(event) => update('calls_enabled', event.target.value)}
                className="admin-call-settings__select w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="false">Disabled (recommended until configured)</option>
                <option value="true">Enabled</option>
              </select>
            </div>

            {error ? (
              <p className="admin-call-settings__error text-sm text-destructive">{error}</p>
            ) : null}
            {message ? (
              <p className="admin-call-settings__message text-sm text-green-600">{message}</p>
            ) : null}

            <Button
              type="button"
              onClick={() => void saveSettings()}
              disabled={saving}
              className="admin-call-settings__save"
            >
              {saving ? 'Saving...' : 'Save Call Settings'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <p className="admin-call-settings__loading text-sm text-muted-foreground">
          Loading call settings...
        </p>
      )}
    </main>
  )
}
