'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient as supabaseClientUnsafe } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

const supabaseClient = supabaseClientUnsafe as any

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

      // Check authentication
      const {
        data: { user },
        error: authError,
      } = await supabaseClient.auth.getUser()
      if (authError || !user) {
        console.error('Auth error:', authError)
        router.push('/auth/signin?redirect=/groups/create')
        return
      }

      console.log('Creating group with data:', {
        name: form.name,
        description: form.description,
        is_private: form.isPrivate,
        created_by: user.id,
      })

      // Upload cover image if provided
      let coverImageUrl = null
      if (form.coverImage) {
        const fileExt = form.coverImage.name.split('.').pop()
        const filePath = `group-covers/${user.id}-${Date.now()}.${fileExt}`

        console.log('Uploading cover image:', filePath)
        const { error: uploadError } = await supabaseClient.storage
          .from('groups')
          .upload(filePath, form.coverImage)

        if (uploadError) {
          console.error('Cover image upload error:', uploadError)
          throw uploadError
        }

        const {
          data: { publicUrl },
        } = supabaseClient.storage.from('groups').getPublicUrl(filePath)

        coverImageUrl = publicUrl
        console.log('Cover image uploaded:', coverImageUrl)
      }

      // Create group
      console.log('Attempting to create group with data:', {
        name: form.name,
        description: form.description,
        is_private: form.isPrivate,
        created_by: user.id,
        cover_image_url: coverImageUrl,
        member_count: 1,
      })

      const { data: group, error: groupError } = await supabaseClient
        .from('groups')
        .insert({
          name: form.name,
          description: form.description,
          is_private: form.isPrivate,
          created_by: user.id,
          cover_image_url: coverImageUrl,
          member_count: 1,
        })
        .select()
        .single()

      if (groupError) {
        console.error('Group creation error details:', {
          message: groupError.message,
          details: groupError.details,
          hint: groupError.hint,
          code: groupError.code,
          error: groupError,
        })
        throw groupError
      }

      console.log('Group created:', group)

      // Create default roles
      console.log('Group object before creating roles:', group)
      const rolesToInsert = [
        {
          group_id: group.id,
          name: 'Owner',
          description: 'Group owner with full permissions',
          permissions: ['manage_group', 'manage_members', 'manage_content'],
          is_default: false,
        },
        {
          group_id: group.id,
          name: 'Member',
          description: 'Regular group member',
          permissions: ['view_content', 'create_content'],
          is_default: true,
        },
      ]
      console.log('Attempting to insert roles:', rolesToInsert)
      const { data: roles, error: rolesError } = await supabaseClient
        .from('group_roles')
        .insert(rolesToInsert)
        .select()

      if (rolesError) {
        console.error('Role creation error details:', rolesError)
        throw rolesError
      }

      console.log('Roles created:', roles)

      // Add creator as owner
      const ownerRole = roles.find((r: any) => r.name === 'Owner')
      if (!ownerRole) {
        console.error('Owner role not found in:', roles)
        throw new Error('Owner role not found')
      }

      const { error: memberError } = await supabaseClient
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role_id: ownerRole.id,
          joined_at: new Date().toISOString(),
          status: 'active',
      })

      if (memberError) {
        console.error('Member creation error:', memberError)
        throw memberError
      }

      console.log('Member added successfully')

      toast({
        title: 'Success',
        description: 'Group created successfully',
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
