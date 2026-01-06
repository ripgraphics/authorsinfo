'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { PrivacyService } from '@/lib/privacy-service'
import type {
  PrivacySettingsForm,
  PrivacyStats,
  PrivacyAuditSummary,
  PrivacyLevel,
} from '@/types/privacy'
import { Shield, Book, Activity, BarChart3, Save, RefreshCw } from "lucide-react";

interface PrivacySettingsProps {
  className?: string
  entityType?: 'user' | 'author' | 'publisher' | 'group' | 'event'
  entityId?: string
  isOwner?: boolean
  onSettingsChange?: (settings: any) => void
}

export function PrivacySettings({
  className,
  entityType = 'user',
  entityId,
  isOwner: _isOwner = true,
  onSettingsChange,
}: PrivacySettingsProps) {
  const { toast } = useToast()
  const [settings, setSettings] = useState<PrivacySettingsForm | null>(null)
  const [stats, setStats] = useState<PrivacyStats | null>(null)
  const [auditSummary, setAuditSummary] = useState<PrivacyAuditSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadPrivacyData = useCallback(async () => {
    if (!entityId || !entityType) return

    setLoading(true)
    try {
      // Use the new entity-agnostic API
      const response = await fetch(`/api/entities/${entityType}/${entityId}/privacy-settings`)
      if (response.ok) {
        const settingsData = await response.json()
        setSettings(settingsData)

        // For now, use default stats and audit data
        // These could be enhanced with entity-specific APIs later
        setStats({
          total_entries: Object.keys(settingsData).length,
          public_entries: settingsData.default_privacy_level === 'public' ? 1 : 0,
          friends_only_entries: settingsData.default_privacy_level === 'friends' ? 1 : 0,
          followers_only_entries: settingsData.default_privacy_level === 'followers' ? 1 : 0,
          private_entries: settingsData.default_privacy_level === 'private' ? 1 : 0,
          custom_entries: 0,
        })
        setAuditSummary({
          total_views: 0,
          total_updates: 0,
          total_permission_changes: 0,
          recent_activity: [],
        })
      } else {
        throw new Error('Failed to fetch privacy settings')
      }
    } catch (error) {
      console.error('Error loading privacy data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load privacy settings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [entityId, entityType, toast])

  useEffect(() => {
    if (entityId && entityType) {
      loadPrivacyData()
    }
  }, [entityId, entityType, loadPrivacyData])

  const handleSettingChange = (key: keyof PrivacySettingsForm, value: any) => {
    if (!settings) return
    setSettings((prev) => (prev ? { ...prev, [key]: value } : null))
  }

  const handleSaveSettings = async () => {
    if (!settings || !entityId || !entityType) return

    setSaving(true)
    try {
      // Use the new entity-agnostic API
      const response = await fetch(`/api/entities/${entityType}/${entityId}/privacy-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        const updatedSettings = await response.json()
        setSettings(updatedSettings)

        // Notify parent component of changes
        if (onSettingsChange) {
          onSettingsChange(updatedSettings)
        }

        toast({
          title: 'Success',
          description: 'Privacy settings updated successfully',
        })
        await loadPrivacyData() // Reload data
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update privacy settings')
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'An error occurred while saving settings',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const getPrivacyLevelIcon = (level: PrivacyLevel) => {
    return PrivacyService.getPrivacyLevelIcon(level)
  }

  const getPrivacyLevelDescription = (level: PrivacyLevel) => {
    return PrivacyService.getPrivacyLevelDescription(level)
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="flex items-center justify-center p-4">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading privacy settings...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Alert>
          <AlertDescription>
            Unable to load privacy settings. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Privacy Settings</h2>
          <p className="text-muted-foreground">
            Control who can see your reading activity and personal information
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="reading">Reading</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Default Privacy Level
              </CardTitle>
              <CardDescription>
                Set the default privacy level for new reading entries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-privacy">Default Privacy Level</Label>
                <Select
                  value={settings.default_privacy_level}
                  onValueChange={(value: PrivacyLevel) =>
                    handleSettingChange('default_privacy_level', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <span>{getPrivacyLevelIcon('private')}</span>
                        <span>Private</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="friends">
                      <div className="flex items-center gap-2">
                        <span>{getPrivacyLevelIcon('friends')}</span>
                        <span>Friends Only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="followers">
                      <div className="flex items-center gap-2">
                        <span>{getPrivacyLevelIcon('followers')}</span>
                        <span>Followers Only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <span>{getPrivacyLevelIcon('public')}</span>
                        <span>Public</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {getPrivacyLevelDescription(settings.default_privacy_level)}
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Public Reading Profile</Label>
                    <p className="text-sm text-muted-foreground">
                      Let anyone see your reading profile
                    </p>
                  </div>
                  <Switch
                    checked={settings.allow_public_reading_profile}
                    onCheckedChange={(checked) =>
                      handleSettingChange('allow_public_reading_profile', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Friends to See Reading</Label>
                    <p className="text-sm text-muted-foreground">
                      Let your friends see your reading activity
                    </p>
                  </div>
                  <Switch
                    checked={settings.allow_friends_to_see_reading}
                    onCheckedChange={(checked) =>
                      handleSettingChange('allow_friends_to_see_reading', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Followers to See Reading</Label>
                    <p className="text-sm text-muted-foreground">
                      Let your followers see your reading activity
                    </p>
                  </div>
                  <Switch
                    checked={settings.allow_followers_to_see_reading}
                    onCheckedChange={(checked) =>
                      handleSettingChange('allow_followers_to_see_reading', checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reading" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Reading Activity Privacy
              </CardTitle>
              <CardDescription>
                Control what reading information is visible to others
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Currently Reading Publicly</Label>
                  <p className="text-sm text-muted-foreground">
                    Display books you're currently reading on your public profile
                  </p>
                </div>
                <Switch
                  checked={settings.show_currently_reading_publicly}
                  onCheckedChange={(checked) =>
                    handleSettingChange('show_currently_reading_publicly', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Reading History Publicly</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your reading history on your public profile
                  </p>
                </div>
                <Switch
                  checked={settings.show_reading_history_publicly}
                  onCheckedChange={(checked) =>
                    handleSettingChange('show_reading_history_publicly', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Reading Stats Publicly</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your reading statistics on your public profile
                  </p>
                </div>
                <Switch
                  checked={settings.show_reading_stats_publicly}
                  onCheckedChange={(checked) =>
                    handleSettingChange('show_reading_stats_publicly', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Reading Goals Publicly</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your reading goals on your public profile
                  </p>
                </div>
                <Switch
                  checked={settings.show_reading_goals_publicly}
                  onCheckedChange={(checked) =>
                    handleSettingChange('show_reading_goals_publicly', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Privacy Statistics
              </CardTitle>
              <CardDescription>
                Overview of your privacy settings and data distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {stats && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.total_entries}</div>
                      <div className="text-sm text-muted-foreground">Total Entries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.public_entries}
                      </div>
                      <div className="text-sm text-muted-foreground">Public</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.friends_only_entries}
                      </div>
                      <div className="text-sm text-muted-foreground">Friends Only</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {stats.followers_only_entries}
                      </div>
                      <div className="text-sm text-muted-foreground">Followers Only</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {stats.private_entries}
                      </div>
                      <div className="text-sm text-muted-foreground">Private</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {stats.custom_entries}
                      </div>
                      <div className="text-sm text-muted-foreground">Custom</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Public</span>
                        <span>
                          {stats.public_entries} (
                          {stats.total_entries > 0
                            ? Math.round((stats.public_entries / stats.total_entries) * 100)
                            : 0}
                          %)
                        </span>
                      </div>
                      <Progress
                        value={
                          stats.total_entries > 0
                            ? (stats.public_entries / stats.total_entries) * 100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Friends Only</span>
                        <span>
                          {stats.friends_only_entries} (
                          {stats.total_entries > 0
                            ? Math.round((stats.friends_only_entries / stats.total_entries) * 100)
                            : 0}
                          %)
                        </span>
                      </div>
                      <Progress
                        value={
                          stats.total_entries > 0
                            ? (stats.friends_only_entries / stats.total_entries) * 100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Private</span>
                        <span>
                          {stats.private_entries} (
                          {stats.total_entries > 0
                            ? Math.round((stats.private_entries / stats.total_entries) * 100)
                            : 0}
                          %)
                        </span>
                      </div>
                      <Progress
                        value={
                          stats.total_entries > 0
                            ? (stats.private_entries / stats.total_entries) * 100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Privacy Audit Log
              </CardTitle>
              <CardDescription>Recent privacy-related activities and changes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {auditSummary && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {auditSummary.total_views}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Views</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {auditSummary.total_updates}
                      </div>
                      <div className="text-sm text-muted-foreground">Privacy Updates</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {auditSummary.total_permission_changes}
                      </div>
                      <div className="text-sm text-muted-foreground">Permission Changes</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Recent Activity</h4>
                    <div className="space-y-2">
                      {auditSummary.recent_activity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{activity.action}</Badge>
                            <span className="text-sm">{activity.resource_type}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
