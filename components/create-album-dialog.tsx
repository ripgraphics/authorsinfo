import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { createBrowserClient } from '@supabase/ssr'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface CreateAlbumDialogProps {
  entityId: string
  entityType: string
  onAlbumCreated: () => void
}

export function CreateAlbumDialog({
  entityId,
  entityType,
  onAlbumCreated,
}: CreateAlbumDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [supabase, setSupabase] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const initializeClient = async () => {
      try {
        const client = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        setSupabase(client)

        const {
          data: { user },
          error: userError,
        } = await client.auth.getUser()
        if (userError) {
          console.error('Error authenticating user:', userError)
          return
        }

        if (!user) {
          console.log('No active session found')
          return
        }

        console.log('User authenticated:', user.id)
        setUserId(user.id)
      } catch (error) {
        console.error('Error initializing client:', error)
      }
    }

    initializeClient()
  }, [])

  const handleSignIn = () => {
    setIsOpen(false)
    router.push('/login')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!supabase) {
      console.error('Supabase client not initialized')
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create album: Database connection not available',
      })
      return
    }

    if (!userId) {
      console.error('User not authenticated')
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please sign in to create albums',
      })
      handleSignIn()
      return
    }

    console.log('Form submitted:', { name, description, isPublic, entityId, entityType, userId })
    setIsLoading(true)

    try {
      // Convert entityId to UUID format
      const uuidEntityId = `00000000-0000-0000-0000-${entityId.padStart(12, '0')}`

      const albumData = {
        name: name.trim(),
        description: description.trim(),
        is_public: isPublic,
        entity_id: uuidEntityId,
        entity_type: entityType,
        album_type: 'author',
        owner_id: userId,
      }
      console.log('Creating album with data:', albumData)

      const { data: album, error } = await supabase
        .from('photo_albums')
        .insert(albumData)
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Album created:', album)
      toast({
        title: 'Success',
        description: 'Album created successfully',
      })
      setName('')
      setDescription('')
      setIsPublic(true)
      setIsOpen(false)
      onAlbumCreated()
    } catch (error) {
      console.error('Error creating album:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create album',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Create Album</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Album</DialogTitle>
        </DialogHeader>
        {!userId ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Please sign in to create albums</p>
            <div className="flex justify-end">
              <Button onClick={handleSignIn}>Sign In</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Album Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter album name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter album description"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
              <Label htmlFor="public">Public Album</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Album'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
