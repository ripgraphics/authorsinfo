import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface PhotoUploadDialogProps {
  entityId: string
  entityType: string
  onUploadComplete: () => void
}

export function PhotoUploadDialog({ entityId, entityType, onUploadComplete }: PhotoUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [supabase] = useState(() => createClientComponentClient())
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsLoading(true)

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${entityType}/${entityId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, file)

        if (uploadError) {
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(filePath)

        const { error: dbError } = await supabase
          .from('images')
          .insert({
            url: publicUrl,
            alt_text: file.name,
            img_type_id: 1 // Assuming 1 is the ID for photo type
          })

        if (dbError) {
          throw dbError
        }
      }

      toast({
        title: "Success",
        description: "Photos uploaded successfully"
      })
      setIsOpen(false)
      onUploadComplete()
    } catch (error) {
      console.error('Error uploading photos:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload photos"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Upload Photos</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Photos</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={isLoading}
            className="w-full"
          />
          {isLoading && <p>Uploading...</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
} 