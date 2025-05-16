import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { ImageIcon } from "lucide-react"

interface AlbumSettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  album: {
    id: string
    name: string
    is_public: boolean
    cover_image_id?: string
  }
  photos: {
    id: string
    url: string
    alt?: string
  }[]
  onSettingsUpdated: () => void
}

export function AlbumSettingsDialog({
  isOpen,
  onClose,
  album,
  photos,
  onSettingsUpdated
}: AlbumSettingsDialogProps) {
  const [isPublic, setIsPublic] = useState(album.is_public)
  const [selectedCoverId, setSelectedCoverId] = useState(album.cover_image_id)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('photo_albums')
        .update({
          is_public: isPublic,
          cover_image_id: selectedCoverId
        })
        .eq('id', album.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Album settings updated successfully"
      })
      onSettingsUpdated()
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update album settings",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Album Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Privacy Settings */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="privacy">Public Album</Label>
              <Switch
                id="privacy"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {isPublic
                ? "Anyone can view this album"
                : "Only you can view this album"}
            </p>
          </div>

          {/* Cover Image Selection */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="grid grid-cols-4 gap-2">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedCoverId(photo.id)}
                  className={`relative aspect-square rounded-md overflow-hidden border-2 ${
                    selectedCoverId === photo.id
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.alt || "Album photo"}
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 