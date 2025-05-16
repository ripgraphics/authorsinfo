import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { FolderPlus } from "lucide-react"

interface PhotoAlbumManagerProps {
  entityId: string
  entityType: string
  onAlbumCreated?: () => void
}

export function PhotoAlbumManager({
  entityId,
  entityType,
  onAlbumCreated
}: PhotoAlbumManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const handleCreateAlbum = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter an album title",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)

    try {
      const { data: album, error } = await supabase
        .from('photo_albums')
        .insert({
          name: title.trim(),
          description: description.trim(),
          entity_type: entityType,
          entity_id: entityId,
          is_public: true,
          album_type: 'author'
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Success",
        description: "Album created successfully"
      })

      setTitle("")
      setDescription("")
      setIsOpen(false)
      onAlbumCreated?.()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create album",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FolderPlus className="h-4 w-4" />
          Create Album
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Album</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter album title"
              disabled={isCreating}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description (optional)
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter album description"
              disabled={isCreating}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAlbum}
              disabled={isCreating}
            >
              {isCreating ? "Creating..." : "Create Album"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 