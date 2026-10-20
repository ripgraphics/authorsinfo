'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createGroupWithValidation } from '@/app/actions/groups/create-group-with-validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

interface CreateGroupForm {
  name: string
  description: string
  isPrivate: boolean
  coverImage: File | null
}

export default function CreateGroupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState<CreateGroupForm>({
    name: '',
    description: '',
    isPrivate: false,
    coverImage: null,
  })
  const [loading, setLoading] = useState(false)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setForm((prev) => ({ ...prev, coverImage: file }))
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    if (!form.name.trim()) {
      toast({
        title: 'Error',
        description: 'Group name is required',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      const result = await createGroupWithValidation({
        name: form.name,
        description: form.description,
        is_private: form.isPrivate,
      })
      if (!result.success || !result.group) {
        throw new Error(result.error || 'Failed to create group')
      }
      const group = result.group

      let coverUploadFailed = false
      if (form.coverImage) {
        const imageFormData = new FormData()
        imageFormData.set('file', form.coverImage)
        imageFormData.set('entityType', 'group')
        imageFormData.set('entityId', group.id)
        imageFormData.set('imageType', 'cover')
        imageFormData.set('originalType', 'entityHeaderCover')

        const imageResponse = await fetch('/api/upload/entity-image', {
          method: 'POST',
          body: imageFormData,
        })
        coverUploadFailed = !imageResponse.ok
      }

      toast({
        title: 'Success',
        description: coverUploadFailed
          ? 'Group created, but the cover image could not be uploaded.'
          : 'Group created successfully',
      })

      router.push(`/groups/${group.id}`)
    } catch (err: any) {
      console.error('Error creating group:', {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code,
        error: err,
      })
      toast({
        title: 'Error',
        description: err.message || err.details || err.hint || 'Failed to create group',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Group</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter group name"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter group description"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image</Label>
              <Input
                id="coverImage"
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
                disabled={loading}
              />
              {coverPreview && (
                <div className="mt-2 relative aspect-video">
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="rounded-lg object-cover w-full h-full"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPrivate"
                checked={form.isPrivate}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isPrivate: checked }))}
                disabled={loading}
              />
              <Label htmlFor="isPrivate">Make group private</Label>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Group'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
