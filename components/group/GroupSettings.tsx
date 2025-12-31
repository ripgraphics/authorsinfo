'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createBrowserClient } from '@supabase/ssr'
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/types/database'

interface GroupSettingsProps {
  groupId: string
  userRole: string
}

interface GroupSettings {
  id: string
  name: string
  description: string
  privacy: 'public' | 'private' | 'hidden'
  join_type: 'open' | 'request' | 'invite'
  moderation_settings: {
    auto_moderation: boolean
    toxicity_threshold: number
    require_approval: boolean
    allowed_content_types: string[]
    banned_keywords: string[]
    notification_settings: {
      email: boolean
      push: boolean
      slack: boolean
      discord: boolean
    }
  }
  branding: {
    logo_url?: string
    banner_url?: string
    primary_color?: string
    secondary_color?: string
  }
  integrations: {
    slack_webhook?: string
    discord_webhook?: string
    api_key?: string
  }
  updated_at: string
}

export default function GroupSettings({ groupId, userRole }: GroupSettingsProps) {
  const [settings, setSettings] = useState<GroupSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDirty, setIsDirty] = useState(false)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('group_settings')
        .select('*')
        .eq('group_id', groupId)
        .single()

      if (error) throw error
      setSettings(data)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to load group settings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveSettings() {
    if (!settings) return

    try {
      const { error } = await (supabase.from('group_settings') as any)
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id)

      if (error) throw error

      setIsDirty(false)
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      })
    }
  }

  function updateSettings<K extends keyof GroupSettings>(key: K, value: GroupSettings[K]) {
    if (!settings) return

    setSettings({ ...settings, [key]: value })
    setIsDirty(true)
  }

  function updateModerationSettings<K extends keyof GroupSettings['moderation_settings']>(
    key: K,
    value: GroupSettings['moderation_settings'][K]
  ) {
    if (!settings) return

    setSettings({
      ...settings,
      moderation_settings: {
        ...settings.moderation_settings,
        [key]: value,
      },
    })
    setIsDirty(true)
  }

  function updateNotificationSettings<
    K extends keyof GroupSettings['moderation_settings']['notification_settings'],
  >(key: K, value: boolean) {
    if (!settings) return

    setSettings({
      ...settings,
      moderation_settings: {
        ...settings.moderation_settings,
        notification_settings: {
          ...settings.moderation_settings.notification_settings,
          [key]: value,
        },
      },
    })
    setIsDirty(true)
  }

  function updateBranding<K extends keyof GroupSettings['branding']>(key: K, value: string) {
    if (!settings) return

    setSettings({
      ...settings,
      branding: {
        ...settings.branding,
        [key]: value,
      },
    })
    setIsDirty(true)
  }

  function updateIntegrations<K extends keyof GroupSettings['integrations']>(
    key: K,
    value: string
  ) {
    if (!settings) return

    setSettings({
      ...settings,
      integrations: {
        ...settings.integrations,
        [key]: value,
      },
    })
    setIsDirty(true)
  }

  if (loading) {
    return <div>Loading settings...</div>
  }

  if (!settings) {
    return (
      <Alert>
        <AlertDescription>Failed to load group settings</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Group Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="moderation">Moderation</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div>
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) => updateSettings('name', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={settings.description}
                  onChange={(e) => updateSettings('description', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="privacy">Privacy</Label>
                <Select
                  value={settings.privacy}
                  onValueChange={(value: GroupSettings['privacy']) =>
                    updateSettings('privacy', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="join_type">Join Type</Label>
                <Select
                  value={settings.join_type}
                  onValueChange={(value: GroupSettings['join_type']) =>
                    updateSettings('join_type', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="request">Request to Join</SelectItem>
                    <SelectItem value="invite">Invite Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="moderation" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto_moderation">Auto Moderation</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically moderate content using AI
                  </p>
                </div>
                <Switch
                  id="auto_moderation"
                  checked={settings.moderation_settings.auto_moderation}
                  onCheckedChange={(checked) =>
                    updateModerationSettings('auto_moderation', checked)
                  }
                />
              </div>

              <div>
                <Label htmlFor="toxicity_threshold">
                  Toxicity Threshold ({settings.moderation_settings.toxicity_threshold}%)
                </Label>
                <Input
                  id="toxicity_threshold"
                  type="range"
                  min="0"
                  max="100"
                  value={settings.moderation_settings.toxicity_threshold}
                  onChange={(e) =>
                    updateModerationSettings('toxicity_threshold', parseInt(e.target.value))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="require_approval">Require Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    All content requires moderator approval
                  </p>
                </div>
                <Switch
                  id="require_approval"
                  checked={settings.moderation_settings.require_approval}
                  onCheckedChange={(checked) =>
                    updateModerationSettings('require_approval', checked)
                  }
                />
              </div>

              <div>
                <Label htmlFor="banned_keywords">Banned Keywords</Label>
                <Textarea
                  id="banned_keywords"
                  value={settings.moderation_settings.banned_keywords.join('\n')}
                  onChange={(e) =>
                    updateModerationSettings(
                      'banned_keywords',
                      e.target.value.split('\n').filter(Boolean)
                    )
                  }
                  placeholder="Enter one keyword per line"
                />
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email_notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send notifications via email</p>
                </div>
                <Switch
                  id="email_notifications"
                  checked={settings.moderation_settings.notification_settings.email}
                  onCheckedChange={(checked) => updateNotificationSettings('email', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push_notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send browser push notifications</p>
                </div>
                <Switch
                  id="push_notifications"
                  checked={settings.moderation_settings.notification_settings.push}
                  onCheckedChange={(checked) => updateNotificationSettings('push', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="slack_notifications">Slack Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send notifications to Slack</p>
                </div>
                <Switch
                  id="slack_notifications"
                  checked={settings.moderation_settings.notification_settings.slack}
                  onCheckedChange={(checked) => updateNotificationSettings('slack', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="discord_notifications">Discord Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send notifications to Discord</p>
                </div>
                <Switch
                  id="discord_notifications"
                  checked={settings.moderation_settings.notification_settings.discord}
                  onCheckedChange={(checked) => updateNotificationSettings('discord', checked)}
                />
              </div>
            </TabsContent>

            <TabsContent value="branding" className="space-y-4">
              <div>
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={settings.branding.logo_url || ''}
                  onChange={(e) => updateBranding('logo_url', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <Label htmlFor="banner_url">Banner URL</Label>
                <Input
                  id="banner_url"
                  value={settings.branding.banner_url || ''}
                  onChange={(e) => updateBranding('banner_url', e.target.value)}
                  placeholder="https://example.com/banner.png"
                />
              </div>

              <div>
                <Label htmlFor="primary_color">Primary Color</Label>
                <Input
                  id="primary_color"
                  type="color"
                  value={settings.branding.primary_color || '#000000'}
                  onChange={(e) => updateBranding('primary_color', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <Input
                  id="secondary_color"
                  type="color"
                  value={settings.branding.secondary_color || '#000000'}
                  onChange={(e) => updateBranding('secondary_color', e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-4">
              <div>
                <Label htmlFor="slack_webhook">Slack Webhook URL</Label>
                <Input
                  id="slack_webhook"
                  value={settings.integrations.slack_webhook || ''}
                  onChange={(e) => updateIntegrations('slack_webhook', e.target.value)}
                  placeholder="https://hooks.slack.com/..."
                />
              </div>

              <div>
                <Label htmlFor="discord_webhook">Discord Webhook URL</Label>
                <Input
                  id="discord_webhook"
                  value={settings.integrations.discord_webhook || ''}
                  onChange={(e) => updateIntegrations('discord_webhook', e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                />
              </div>

              <div>
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  value={settings.integrations.api_key || ''}
                  onChange={(e) => updateIntegrations('api_key', e.target.value)}
                  type="password"
                />
              </div>
            </TabsContent>
          </Tabs>

          {isDirty && (
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
