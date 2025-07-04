import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { FolderPlus, Users, Lock, Globe, Eye, EyeOff } from 'lucide-react'

interface PhotoAlbumCreatorProps {
  onAlbumCreated: () => void
  trigger?: React.ReactNode
}

type PrivacyLevel = 'public' | 'friends' | 'private' | 'custom'

export function PhotoAlbumCreator({ onAlbumCreated, trigger }: PhotoAlbumCreatorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('public')
  const [showInFeed, setShowInFeed] = useState(true)
  const [customPermissions, setCustomPermissions] = useState<string[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  
  const { toast } = useToast()
  const { user } = useAuth()
  const supabase = createClientComponentClient()

  const privacyOptions = [
    {
      value: 'public',
      label: 'Public',
      description: 'Anyone can view this album',
      icon: <Globe className="h-4 w-4" />
    },
    {
      value: 'friends',
      label: 'Friends Only',
      description: 'Only your friends can view this album',
      icon: <Users className="h-4 w-4" />
    },
    {
      value: 'private',
      label: 'Private',
      description: 'Only you can view this album',
      icon: <Lock className="h-4 w-4" />
    },
    {
      value: 'custom',
      label: 'Custom',
      description: 'Choose specific people who can view this album',
      icon: <Eye className="h-4 w-4" />
    }
  ]

  const handleCreateAlbum = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create albums",
        variant: "destructive"
      })
      return
    }

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter an album name",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)

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
            allowedViewers = friends.map(f => f.friend_id)
          }
          break
        case 'private':
          isPublic = false
          break
        case 'custom':
          allowedViewers = selectedUsers
          break
      }

      // Create the album
      const { data: album, error: albumError } = await supabase
        .from('photo_albums')
        .insert({
          name: name.trim(),
          description: description.trim(),
          is_public: isPublic,
          owner_id: user.id,
          album_type: 'user',
          entity_type: 'user',
          entity_id: user.id,
          metadata: {
            show_in_feed: showInFeed,
            privacy_level: privacyLevel,
            allowed_viewers: allowedViewers,
            created_at: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (albumError) throw albumError

      // If custom permissions, create album shares
      if (privacyLevel === 'custom' && selectedUsers.length > 0) {
        const shareRecords = selectedUsers.map(userId => ({
          album_id: album.id,
          share_type: 'view',
          shared_by: user.id,
          shared_with: userId,
          access_token: null,
          expires_at: null
        }))

        const { error: shareError } = await supabase
          .from('album_shares')
          .insert(shareRecords)

        if (shareError) {
          console.error('Error creating album shares:', shareError)
        }
      }

      // If public and show in feed, create a feed activity
      if (isPublic && showInFeed) {
        const { error: feedError } = await supabase
          .from('user_activities')
          .insert({
            user_id: user.id,
            activity_type: 'album_created',
            entity_type: 'photo_album',
            entity_id: album.id,
            is_public: true,
            metadata: {
              album_name: name.trim(),
              album_description: description.trim(),
              privacy_level: privacyLevel
            }
          })

        if (feedError) {
          console.error('Error creating feed activity:', feedError)
        }
      }

      toast({
        title: "Success",
        description: "Album created successfully"
      })

      setName('')
      setDescription('')
      setPrivacyLevel('public')
      setShowInFeed(true)
      setSelectedUsers([])
      setIsOpen(false)
      onAlbumCreated()
    } catch (error) {
      console.error('Error creating album:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create album",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <FolderPlus className="h-4 w-4" />
            Create Photo Album
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Photo Album</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Album Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Album Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter album name"
              disabled={isCreating}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter album description (optional)"
              disabled={isCreating}
              rows={3}
            />
          </div>

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
                  <div className="flex-shrink-0">
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{option.label}</span>
                      {privacyLevel === option.value && (
                        <Badge variant="secondary" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
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
                disabled={isCreating}
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
              {/* TODO: Add user selector component */}
              <div className="p-3 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  User selector coming soon...
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAlbum}
              disabled={isCreating || !name.trim()}
            >
              {isCreating ? "Creating..." : "Create Album"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 