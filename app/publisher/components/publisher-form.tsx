"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { updatePublisher } from "../actions"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface PublisherFormProps {
  publisher: {
    id: string
    name: string
    description: string | null
    website: string | null
    founded: number | null
    logo_url: string | null
  }
}

export function PublisherForm({ publisher }: PublisherFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [logoPreview, setLogoPreview] = useState<string | null>(publisher.logo_url)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setIsSaving(true)
    setMessage("")

    try {
      const result = await updatePublisher(publisher.id, formData)

      if (result.success) {
        setMessage("Publisher updated successfully!")
        setIsEditing(false)
        router.refresh()
      } else {
        setMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      setMessage("An unexpected error occurred")
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{isEditing ? "Edit Publisher" : publisher.name}</span>
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Publisher Logo */}
        <div className="mb-6 flex justify-center">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border">
            {logoPreview ? (
              <Image
                src={logoPreview || "/placeholder.svg"}
                alt={`${publisher.name} logo`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">{publisher.name?.charAt(0) || "P"}</span>
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo">Publisher Logo</Label>
              <Input id="logo" name="logo" type="file" accept="image/*" onChange={handleLogoChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Publisher Name</Label>
              <Input id="name" name="name" defaultValue={publisher.name} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={publisher.description || ""} rows={4} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" type="url" defaultValue={publisher.website || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="founded">Founded (Year)</Label>
              <Input id="founded" name="founded" type="number" defaultValue={publisher.founded?.toString() || ""} />
            </div>

            <CardFooter className="px-0 pt-4">
              <Button type="submit" disabled={isSaving} className="mr-2">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                Cancel
              </Button>
              {message && (
                <p className={`ml-4 ${message.includes("Error") ? "text-red-500" : "text-green-500"}`}>{message}</p>
              )}
            </CardFooter>
          </form>
        ) : (
          <div className="space-y-4">
            {publisher.description && (
              <div>
                <h3 className="font-medium text-sm text-gray-500">Description</h3>
                <p>{publisher.description}</p>
              </div>
            )}

            {publisher.website && (
              <div>
                <h3 className="font-medium text-sm text-gray-500">Website</h3>
                <a
                  href={publisher.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {publisher.website}
                </a>
              </div>
            )}

            {publisher.founded && (
              <div>
                <h3 className="font-medium text-sm text-gray-500">Founded</h3>
                <p>{publisher.founded}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
