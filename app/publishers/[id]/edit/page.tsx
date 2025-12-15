"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Building, AlertTriangle } from "lucide-react"
import { supabaseClient } from "@/lib/supabase/client"
import { uploadImage } from "@/app/actions/upload"
import { CountrySelect } from "@/components/country-select"
import type { Publisher } from "@/types/database"

export default function PublisherEditPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const section = searchParams.get('section')
  const publisherId = params.id as string
  
  // Add refs for each section
  const overviewRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)
  const locationRef = useRef<HTMLDivElement>(null)
  
  const [publisher, setPublisher] = useState<Publisher | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [countryId, setCountryId] = useState<number | null>(null)

  // Fetch publisher data
  useEffect(() => {
    async function fetchPublisher() {
      try {
        setLoading(true)
        const { data, error } = await supabaseClient
          .from("publishers")
          .select(`
            *,
            publisher_image:publisher_image_id(id, url, alt_text),
            cover_image:cover_image_id(id, url, alt_text),
            country_details:country_id(id, name, code)
          `)
          .eq("id", publisherId)
          .single()

        if (error) {
          console.error("Error fetching publisher:", error)
          setError(`Error fetching publisher: ${error.message}`)
          return
        }

        setPublisher(data as Publisher)

        // Set country ID if available
        if ((data as any).country_id) {
          setCountryId((data as any).country_id)
        }

        // Set logo preview if publisher_image exists
        if ((data as any).publisher_image?.url) {
          setLogoPreview((data as any).publisher_image.url)
        }

        // Set cover preview if cover_image exists
        if ((data as any).cover_image?.url) {
          setCoverPreview((data as any).cover_image.url)
        }
      } catch (error) {
        console.error("Error in fetchPublisher:", error)
        setError("An unexpected error occurred. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchPublisher()
  }, [publisherId])

  // Scroll to the specific section when the component mounts and data is loaded
  useEffect(() => {
    if (!loading && section) {
      setTimeout(() => {
        let targetRef = null
        
        switch (section) {
          case 'overview':
            targetRef = overviewRef.current
            break
          case 'contact':
            targetRef = contactRef.current
            break
          case 'location':
            targetRef = locationRef.current
            break
        }
        
        if (targetRef) {
          targetRef.scrollIntoView({ behavior: 'smooth' })
          // Add a highlight effect
          targetRef.classList.add('ring-2', 'ring-primary', 'ring-opacity-50')
          setTimeout(() => {
            targetRef.classList.remove('ring-2', 'ring-primary', 'ring-opacity-50')
          }, 2000)
        }
      }, 500) // Short delay to ensure the component is fully rendered
    }
  }, [loading, section])

  // Handle logo image change
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  // Handle cover image change
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!publisher) return

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const formData = new FormData(e.currentTarget)

      // Create update data object
      const updateData: Partial<Publisher> = {
        name: formData.get("name") as string,
        website: formData.get("website") as string,
        founded_year: Number.parseInt(formData.get("founded_year") as string) || null,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        address_line1: formData.get("address_line1") as string,
        address_line2: formData.get("address_line2") as string,
        city: formData.get("city") as string,
        state: formData.get("state") as string,
        postal_code: formData.get("postal_code") as string,
        about: formData.get("about") as string,
        country_id: countryId,
      }

      // Handle logo upload if changed
      if (logoFile) {
        try {
          // Convert the file to base64
          const base64Promise = new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              const base64 = reader.result as string
              resolve(base64)
            }
            reader.readAsDataURL(logoFile)
          })

          const base64Image = await base64Promise
          const logoResult = await uploadImage(base64Image, "authorsinfo/publisher_image", `Logo for ${publisher.name}`)

          if (logoResult) {
            updateData.publisher_image_id = logoResult.imageId
          }
        } catch (error) {
          console.error("Error uploading logo:", error)
          setError("Failed to upload logo image. Please try again.")
          setSaving(false)
          return
        }
      }

      // Handle cover image upload if changed
      if (coverFile) {
        try {
          // Convert the file to base64
          const base64Promise = new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              const base64 = reader.result as string
              resolve(base64)
            }
            reader.readAsDataURL(coverFile)
          })

          const base64Image = await base64Promise
          const coverResult = await uploadImage(base64Image, "authorsinfo/page_cover", `Cover for ${publisher.name}`)

          if (coverResult) {
            updateData.cover_image_id = coverResult.imageId
          }
        } catch (error) {
          console.error("Error uploading cover:", error)
          setError("Failed to upload cover image. Please try again.")
          setSaving(false)
          return
        }
      }

      // Update publisher in database
      const { error: updateError } = await (supabaseClient.from("publishers") as any).update(updateData).eq("id", publisherId)

      if (updateError) {
        console.error("Error updating publisher:", updateError)
        setError(`Error updating publisher: ${updateError.message}`)
        setSaving(false)
        return
      }

      setSuccessMessage("Publisher updated successfully!")

      // Redirect back to the publisher page after a short delay
      setTimeout(() => {
        router.push(`/publishers/${publisherId}`)
      }, 1500)
    } catch (error: any) {
      console.error("Error in handleSubmit:", error)
      setError("An unexpected error occurred while saving. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container py-8">
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Loading publisher information...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!publisher) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container py-8">
          <div className="flex items-center justify-center h-full">
            <p>Publisher not found</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Edit Publisher</h1>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Publisher Images</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo upload section */}
                  <div>
                    <Label htmlFor="logo">Logo</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="relative h-32 w-32 overflow-hidden rounded-md border">
                        {logoPreview ? (
                          <Image 
                            src={logoPreview} 
                            alt="Publisher logo" 
                            fill 
                            className="object-cover"
                            sizes="128px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-secondary">
                            <Building className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <Input
                        id="logo"
                        name="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="max-w-xs"
                      />
                    </div>
                  </div>

                  {/* Cover image upload section */}
                  <div>
                    <Label htmlFor="cover">Cover Image</Label>
                    <div className="mt-2 flex flex-col gap-4">
                      <div className="relative h-48 w-full overflow-hidden rounded-md border">
                        {coverPreview ? (
                          <Image
                            src={coverPreview}
                            alt="Publisher cover"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-secondary">
                            <span className="text-muted-foreground">No cover image</span>
                          </div>
                        )}
                      </div>
                      <Input
                        id="cover"
                        name="cover"
                        type="file"
                        accept="image/*"
                        onChange={handleCoverChange}
                        className="max-w-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Overview Section */}
              <Card ref={overviewRef}>
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Publisher Name</Label>
                    <Input id="name" name="name" defaultValue={publisher.name || ""} required />
                  </div>

                  <div>
                    <Label htmlFor="founded_year">Founded Year</Label>
                    <Input
                      id="founded_year"
                      name="founded_year"
                      type="number"
                      defaultValue={publisher.founded_year?.toString() || ""}
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" name="website" type="url" defaultValue={publisher.website || ""} />
                  </div>

                  <div>
                    <Label htmlFor="about">About</Label>
                    <Textarea
                      id="about"
                      name="about"
                      rows={8}
                      defaultValue={publisher.about || ""}
                      placeholder="Enter information about the publisher..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information Section */}
              <Card ref={contactRef}>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" defaultValue={publisher.email || ""} />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" defaultValue={publisher.phone || ""} />
                  </div>
                </CardContent>
              </Card>

              {/* Location Section */}
              <Card ref={locationRef}>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address_line1">Address Line 1</Label>
                    <Input id="address_line1" name="address_line1" defaultValue={publisher.address_line1 || ""} />
                  </div>

                  <div>
                    <Label htmlFor="address_line2">Address Line 2</Label>
                    <Input id="address_line2" name="address_line2" defaultValue={publisher.address_line2 || ""} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" name="city" defaultValue={publisher.city || ""} />
                    </div>
                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Input id="state" name="state" defaultValue={publisher.state || ""} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input id="postal_code" name="postal_code" defaultValue={publisher.postal_code || ""} />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <CountrySelect value={countryId} onChange={setCountryId} placeholder="Select country" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4 justify-end">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
