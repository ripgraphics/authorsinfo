import { useState, useEffect } from 'react'
import { ReusableModal } from '@/components/ui/reusable-modal'
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
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { useAuth } from '@/hooks/useAuth'
import { ImageIcon, Globe, Users, Lock, Eye, EyeOff, Share2 } from 'lucide-react'

interface AlbumSettingsDialogProps {
  isOpen?: boolean
  onClose?: () => void
  album: {
    id: string
    name: string
    is_public?: boolean
    cover_image_id?: string
    metadata?: any
  }
  photos?: {
    id: string
    url: string
    alt?: string
  }[]
  onSettingsUpdated?: () => void
}

type PrivacyLevel = 'public' | 'friends' | 'private' | 'custom'

export function AlbumSettingsDialog({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  album,
  photos = [],
  onSettingsUpdated,
}: AlbumSettingsDialogProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const onClose = externalOnClose || (() => setInternalIsOpen(false))

  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('public')
  const [showInFeed, setShowInFeed] = useState(true)
  const [selectedCoverId, setSelectedCoverId] = useState(album.cover_image_id)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [availableUsers, setAvailableUsers] = useState<any[]>([])

  const { toast } = useToast()
  const { user } = useAuth()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const privacyOptions = [
    {
      value: 'public',
      label: 'Public',
      description: 'Anyone can view this album',
      icon: <Globe className="h-4 w-4" />,
    },
    {
      value: 'friends',
      label: 'Friends Only',
      description: 'Only your friends can view this album',
      icon: <Users className="h-4 w-4" />,
    },
    {
      value: 'private',
      label: 'Private',
      description: 'Only you can view this album',
      icon: <Lock className="h-4 w-4" />,
    },
    {
      value: 'custom',
      label: 'Custom',
      description: 'Choose specific people who can view this album',
      icon: <Eye className="h-4 w-4" />,
    },
  ]

  // Load current album settings
  useEffect(() => {
    if (album.metadata) {
      setPrivacyLevel(album.metadata.privacy_level || 'public')
      setShowInFeed(album.metadata.show_in_feed !== false)
    } else {
      setPrivacyLevel((album.is_public ?? false) ? 'public' : 'private')
      setShowInFeed(album.is_public ?? false)
    }
  }, [album])

  // Load available users for custom permissions
  useEffect(() => {
    if (privacyLevel === 'custom' && user) {
      loadAvailableUsers()
    }
  }, [privacyLevel, user])

  const loadAvailableUsers = async () => {
    try {
      const { data: users } = await supabase
        .from('users')
        .select('id, name, avatar_url')
        .neq('id', user?.id)
        .limit(50)

      if (users) {
        setAvailableUsers(users)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const handlePrivacyChange = (level: PrivacyLevel) => {
    setPrivacyLevel(level)
    // Auto-adjust feed visibility based on privacy
    if (level === 'public') {
      setShowInFeed(true)
    } else {
      setShowInFeed(false)
    }
  }

  const handleSave = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to update album settings',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      // Determine privacy settings based on privacy level
      let isPublic = false
      let allowedViewers: string[] = []

      switch (privacyLevel) {
        case 'public':
          isPublic = true
          break
        case 'friends':
          // Get user's friends
          const { data: friends } = await supabase
            .from('user_friends')
            .select('friend_id')
            .eq('user_id', user.id)
            .eq('status', 'accepted')

          if (friends) {
            allowedViewers = friends.map((f) => f.friend_id)
          }
          break
        case 'private':
          isPublic = false
          break
        case 'custom':
          allowedViewers = selectedUsers
          break
      }

      // Update album settings
      const { error: albumError } = await supabase
        .from('photo_albums')
        .update({
          is_public: isPublic,
          cover_image_id: selectedCoverId,
          metadata: {
            privacy_level: privacyLevel,
            show_in_feed: showInFeed,
            allowed_viewers: allowedViewers,
            updated_at: new Date().toISOString(),
          },
        })
        .eq('id', album.id)

      if (albumError) throw albumError

      // Handle custom permissions
      if (privacyLevel === 'custom') {
        // Remove existing shares
        await supabase.from('album_shares').delete().eq('album_id', album.id)

        // Create new shares if users are selected
        if (selectedUsers.length > 0) {
          const shareRecords = selectedUsers.map((userId) => ({
            album_id: album.id,
            share_type: 'view',
            shared_by: user.id,
            shared_with: userId,
            access_token: null,
            expires_at: null,
          }))

          const { error: shareError } = await supabase.from('album_shares').insert(shareRecords)

          if (shareError) {
            console.error('Error updating album shares:', shareError)
          }
        }
      }

      // Update feed activity if needed
      if (isPublic && showInFeed) {
        // Check if feed activity exists
        const { data: existingActivity } = await supabase
          .from('activities')
          .select('id')
          .eq('activity_type', 'album_created')
          .eq('entity_type', 'photo_album')
          .eq('entity_id', album.id)
          .single()

        if (!existingActivity) {
          // Create feed activity
          await supabase.from('activities').insert({
            user_id: user.id,
            activity_type: 'album_created',
            entity_type: 'photo_album',
            entity_id: album.id,
            visibility: 'public',
            metadata: {
              album_name: album.name,
              privacy_level: privacyLevel,
            },
          })
        }
      } else {
        // Remove feed activity if album is no longer public
        await supabase
          .from('activities')
          .delete()
          .eq('activity_type', 'album_created')
          .eq('entity_type', 'photo_album')
          .eq('entity_id', album.id)
      }

      toast({
        title: 'Success',
        description: 'Album settings updated successfully',
      })
      onSettingsUpdated?.()
      onClose()
    } catch (error) {
      console.error('Error updating album settings:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update album settings',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose()
  }

  return (
    <ReusableModal
      open={isOpen}
      onOpenChange={handleOpenChange}
      title="Album Settings"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
          {/* Privacy Settings */}
          <div className="space-y-4">
            <Label>Privacy Settings</Label>
            <div className="space-y-3">
              {privacyOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    privacyLevel === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => handlePrivacyChange(option.value as PrivacyLevel)}
                >
                  <div className="flex-shrink-0">{option.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{option.label}</span>
                      {privacyLevel === option.value && (
                        <Badge variant="secondary" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feed Visibility */}
          {privacyLevel === 'public' && (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="show-in-feed">Show in Feed</Label>
                <p className="text-sm text-muted-foreground">
                  Display this album in your public feed
                </p>
              </div>
              <Switch
                id="show-in-feed"
                checked={showInFeed}
                onCheckedChange={setShowInFeed}
                disabled={isSaving}
              />
            </div>
          )}

          {/* Custom Permissions */}
          {privacyLevel === 'custom' && (
            <div className="space-y-2">
              <Label>Select Users</Label>
              <div className="text-sm text-muted-foreground">
                Choose specific users who can view this album
              </div>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center space-x-2 p-2 rounded-sm border cursor-pointer ${
                      selectedUsers.includes(user.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => {
                      setSelectedUsers((prev) =>
                        prev.includes(user.id)
                          ? prev.filter((id) => id !== user.id)
                          : [...prev, user.id]
                      )
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => {}}
                      className="rounded-sm"
                    />
                    <span className="text-sm">{user.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cover Image Selection */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="grid grid-cols-4 gap-2">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedCoverId(photo.id)}
                  className={`relative aspect-square rounded-md overflow-hidden border-2 ${
                    selectedCoverId === photo.id ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.alt || 'Album photo'}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
              {photos.length === 0 && (
                <div className="aspect-square rounded-md border-2 border-dashed flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
            </div>
          </div>
        </div>
    </ReusableModal>
  )
}
