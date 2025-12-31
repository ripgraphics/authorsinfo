'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabaseClient } from '@/lib/supabase/client'

interface GroupSettingsProps {
  groupId: string
}

interface GroupSettings {
  name: string
  description: string
  description_html: string
  guidelines: string
  visibility: 'public' | 'private' | 'secret'
  max_members: number | null
  tags: string[]
  category: string
  settings: {
    allow_member_invites: boolean
    require_approval: boolean
    content_moderation: {
      enabled: boolean
      auto_moderate: boolean
      toxicity_threshold: number
      banned_keywords: string[]
    }
    notifications: {
      new_members: boolean
      new_content: boolean
      reports: boolean
      analytics: boolean
    }
    branding: {
      primary_color: string
      logo_url: string
      banner_url: string
    }
    integrations: {
      slack_webhook?: string
      discord_webhook?: string
      email_notifications: boolean
    }
  }
}

export function GroupSettings({ groupId }: GroupSettingsProps) {
  const [settings, setSettings] = useState<GroupSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    fetchSettings()
  }, [groupId])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabaseClient
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (error) throw error

      setSettings(data)
    } catch (error) {
      console.error('Error fetching group settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    try {
      setSaving(true)
      const { error } = await (supabaseClient.from('groups') as any)
        .update({
          name: settings.name,
          description: settings.description,
          description_html: settings.description_html,
          guidelines: settings.guidelines,
          visibility: settings.visibility,
          max_members: settings.max_members,
          tags: settings.tags,
          category: settings.category,
          settings: settings.settings,
        })
        .eq('id', groupId)

      if (error) throw error
    } catch (error) {
      console.error('Error saving group settings:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Group Settings</h2>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Group Name</label>
                <Input
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={settings.description}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Guidelines</label>
                <Textarea
                  value={settings.guidelines}
                  onChange={(e) => setSettings({ ...settings, guidelines: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Visibility</label>
                <Select
                  value={settings.visibility}
                  onValueChange={(value: 'public' | 'private' | 'secret') =>
                    setSettings({ ...settings, visibility: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="secret">Secret</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Member Limit</label>
                <Input
                  type="number"
                  value={settings.max_members || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      max_members: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Allow Member Invites</label>
                <Switch
                  checked={settings.settings.allow_member_invites}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      settings: {
                        ...settings.settings,
                        allow_member_invites: checked,
                      },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Require Approval</label>
                <Switch
                  checked={settings.settings.require_approval}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      settings: {
                        ...settings.settings,
                        require_approval: checked,
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation">
          <Card>
            <CardHeader>
              <CardTitle>Content Moderation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Enable Content Moderation</label>
                <Switch
                  checked={settings.settings.content_moderation.enabled}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      settings: {
                        ...settings.settings,
                        content_moderation: {
                          ...settings.settings.content_moderation,
                          enabled: checked,
                        },
                      },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Auto-Moderate Content</label>
                <Switch
                  checked={settings.settings.content_moderation.auto_moderate}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      settings: {
                        ...settings.settings,
                        content_moderation: {
                          ...settings.settings.content_moderation,
                          auto_moderate: checked,
                        },
                      },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Toxicity Threshold (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.settings.content_moderation.toxicity_threshold * 100}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      settings: {
                        ...settings.settings,
                        content_moderation: {
                          ...settings.settings.content_moderation,
                          toxicity_threshold: parseInt(e.target.value) / 100,
                        },
                      },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Banned Keywords</label>
                <Textarea
                  value={settings.settings.content_moderation.banned_keywords.join('\n')}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      settings: {
                        ...settings.settings,
                        content_moderation: {
                          ...settings.settings.content_moderation,
                          banned_keywords: e.target.value.split('\n').filter(Boolean),
                        },
                      },
                    })
                  }
                  placeholder="One keyword per line"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">New Members</label>
                <Switch
                  checked={settings.settings.notifications.new_members}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      settings: {
                        ...settings.settings,
                        notifications: {
                          ...settings.settings.notifications,
                          new_members: checked,
                        },
                      },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">New Content</label>
                <Switch
                  checked={settings.settings.notifications.new_content}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      settings: {
                        ...settings.settings,
                        notifications: {
                          ...settings.settings.notifications,
                          new_content: checked,
                        },
                      },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Reports</label>
                <Switch
                  checked={settings.settings.notifications.reports}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      settings: {
                        ...settings.settings,
                        notifications: {
                          ...settings.settings.notifications,
                          reports: checked,
                        },
                      },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Analytics</label>
                <Switch
                  checked={settings.settings.notifications.analytics}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      settings: {
                        ...settings.settings,
                        notifications: {
                          ...settings.settings.notifications,
                          analytics: checked,
                        },
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Primary Color</label>
                <Input
                  type="color"
                  value={settings.settings.branding.primary_color}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      settings: {
                        ...settings.settings,
                        branding: {
                          ...settings.settings.branding,
                          primary_color: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Logo URL</label>
                <Input
                  value={settings.settings.branding.logo_url}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      settings: {
                        ...settings.settings,
                        branding: {
                          ...settings.settings.branding,
                          logo_url: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Banner URL</label>
                <Input
                  value={settings.settings.branding.banner_url}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      settings: {
                        ...settings.settings,
                        branding: {
                          ...settings.settings.branding,
                          banner_url: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Slack Webhook URL</label>
                <Input
                  type="password"
                  value={settings.settings.integrations.slack_webhook || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      settings: {
                        ...settings.settings,
                        integrations: {
                          ...settings.settings.integrations,
                          slack_webhook: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Discord Webhook URL</label>
                <Input
                  type="password"
                  value={settings.settings.integrations.discord_webhook || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      settings: {
                        ...settings.settings,
                        integrations: {
                          ...settings.settings.integrations,
                          discord_webhook: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email Notifications</label>
                <Switch
                  checked={settings.settings.integrations.email_notifications}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      settings: {
                        ...settings.settings,
                        integrations: {
                          ...settings.settings.integrations,
                          email_notifications: checked,
                        },
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
