"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabaseClient } from "@/lib/supabase/client"
import { uploadImage } from "@/app/actions/upload"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"

export default function AddGroupPage() {
  const router = useRouter()
  const [step, setStep] = useState<number>(0)
  const [selectedType, setSelectedType] = useState<number | null>(null)
  const [groupTypes, setGroupTypes] = useState<{ id: number; slug: string; display_name: string }[]>([])
  const [groupTypesLoading, setGroupTypesLoading] = useState<boolean>(true)
  const [groupTypesError, setGroupTypesError] = useState<string | null>(null)
  const [targets, setTargets] = useState<{ id: string; name: string }[]>([])
  const [targetsLoading, setTargetsLoading] = useState<boolean>(false)
  const [targetsError, setTargetsError] = useState<string | null>(null)
  const [selectedTarget, setSelectedTarget] = useState<string>("")

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load all group types
  useEffect(() => {
    async function loadGroupTypes() {
      setGroupTypesLoading(true)
      try {
        const { data, error } = await supabaseClient
          .from('group_types')
          .select('id, slug, display_name')
        if (error) throw error
        setGroupTypes(data || [])
      } catch (err: any) {
        console.error(err)
        setGroupTypesError(err.message)
      } finally {
        setGroupTypesLoading(false)
      }
    }
    loadGroupTypes()
  }, [])

  // Load targets whenever a type is selected
  useEffect(() => {
    async function loadTargets() {
      setTargetsLoading(true)
      setTargetsError(null)
      try {
        const type = groupTypes.find((gt) => gt.id === selectedType)
        if (!type) {
          setTargets([])
          return
        }
        let table = ''
        let label = ''
        switch (type.slug) {
          case 'author':
            table = 'authors'
            label = 'display_name'
            break
          case 'publisher':
            table = 'publishers'
            label = 'name'
            break
          case 'book':
            table = 'books'
            label = 'title'
            break
          default:
            return
        }
        const { data, error } = await supabaseClient.from(table).select(`id, ${label}`)
        if (error) throw error
        setTargets((data || []).map((row: any) => ({ id: row.id, name: row[label] })))
      } catch (err: any) {
        console.error(err)
        setTargetsError(err.message)
      } finally {
        setTargetsLoading(false)
      }
    }
    if (selectedType !== null) loadTargets()
  }, [selectedType, groupTypes])

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      let coverImageId: number | null = null
      if (coverFile) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(coverFile)
        })
        
        const result = await uploadImage(base64, "authorsinfo/page_cover", `Cover for ${name}`)
        coverImageId = result.imageId
      }

      let groupImageId: number | null = null
      if (imageFile) {
        const base64 = await fileToBase64(imageFile)
        const result = await uploadImage(base64, "group_image", `Image for ${name}`)
        groupImageId = result.imageId
      }

      const { data: { user } } = await supabaseClient.auth.getUser()
      // Insert group
      const { data: newGroup, error: groupError } = await supabaseClient
        .from('groups')
        .insert({
          name,
          description,
          cover_image_id: coverImageId,
          group_image_id: groupImageId,
          created_by: user?.id,
        })
        .single()
      if (groupError || !newGroup) throw groupError

      // Attach to target using numeric group_type_id and selected target
      await supabaseClient
        .from('group_target_type')
        .insert({ group_id: newGroup.id, target_type_id: selectedType!, target_id: selectedTarget })

      // Add creator as member
      await supabaseClient
        .from('group_members')
        .insert({ group_id: newGroup.id, user_id: user?.id, role: 'admin' })

      router.push(`/groups/${newGroup.id}`)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to create group')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog defaultOpen onOpenChange={(open) => !open && router.push('/groups')}>  
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>Step {step + 1} of 3</DialogDescription>
        </DialogHeader>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {groupTypesError && <p className="text-red-600 mb-4">Failed to load group types: {groupTypesError}</p>}
        {(groupTypesLoading) ? (
          <p>Loading…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 0 && (
              <div>
                <Label htmlFor="groupType">Group Type</Label>
                <Select
                  id="groupType"
                  value={selectedType?.toString() || ''}
                  onValueChange={(val) => setSelectedType(parseInt(val, 10))}
                >
                  <SelectTrigger><SelectValue placeholder="Select group type" /></SelectTrigger>
                  <SelectContent>
                    {groupTypes.map((gt) => (
                      <SelectItem key={gt.id} value={gt.id.toString()}>
                        {gt.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {step === 1 && selectedType !== null && (() => {
              const type = groupTypes.find((gt) => gt.id === selectedType)
              if (!type) return null
              return (
                <div>
                  <Label htmlFor="targetItem">Select {type.display_name}</Label>
                  {targetsError && <p className="text-red-600 mb-4">{targetsError}</p>}
                  {targetsLoading ? (
                    <p>Loading {type.display_name}s…</p>
                  ) : (
                    <Select id="targetItem" value={selectedTarget} onValueChange={setSelectedTarget}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${type.display_name}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {targets.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )
            })()}
            {step === 2 && (
              <>
                <div>
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter group name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter group description"
                  />
                </div>
                <div>
                  <Label htmlFor="cover-upload">Cover Image</Label>
                  <Input id="cover-upload" type="file" accept="image/*" onChange={handleCoverChange} />
                  {coverPreview && <img src={coverPreview} alt="Cover preview" className="mt-2 h-32 w-full object-cover" />}
                </div>
                <div>
                  <Label htmlFor="image-upload">Group Image</Label>
                  <Input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} />
                  {imagePreview && <img src={imagePreview} alt="Image preview" className="mt-2 h-32 w-32 object-cover" />}
                </div>
              </>
            )}
            <DialogFooter className="flex justify-end space-x-2">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                  Back
                </Button>
              )}
              {step < 2 ? (
                <Button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={
                    (step === 0 && !selectedType) ||
                    (step === 1 && !selectedTarget)
                  }
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={saving}>
                  {saving ? 'Creating…' : 'Create Group'}
                </Button>
              )}
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
} 