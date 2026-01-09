import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

interface EditSectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  section: 'overview' | 'contact' | 'location'
  authorId: string | number
  initialData: any
  onSuccess: () => void
}

export function EditSectionModal({
  open,
  onOpenChange,
  section,
  authorId,
  initialData,
  onSuccess,
}: EditSectionModalProps) {
  const [formData, setFormData] = useState(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Fetch fresh author data from Supabase when modal opens (single source of truth)
  useEffect(() => {
    if (open && section === 'overview') {
      const fetchAuthorData = async () => {
        setIsLoading(true)
        try {
          const response = await fetch(`/api/authors/${authorId}`)
          if (!response.ok) {
            throw new Error('Failed to fetch author data')
          }
          const authorData = await response.json()
          
          // Update form data with fresh data from Supabase
          setFormData({
            bio: authorData.bio || '',
            birth_date: authorData.birth_date || '',
            nationality: authorData.nationality || '',
            website: authorData.website || '',
            twitter_handle: authorData.twitter_handle || '',
            facebook_handle: authorData.facebook_handle || '',
            instagram_handle: authorData.instagram_handle || '',
            goodreads_url: authorData.goodreads_url || '',
          })
        } catch (error) {
          console.error('Error fetching author data:', error)
          // Fallback to initialData if fetch fails
          setFormData(initialData)
        } finally {
          setIsLoading(false)
        }
      }
      fetchAuthorData()
    } else {
      // For other sections, use initialData
      setFormData(initialData)
    }
  }, [open, section, authorId, initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: typeof initialData) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/authors/${authorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section,
          data: formData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update author')
      }

      toast({
        title: 'Success',
        description: 'Author information updated successfully',
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating author:', error)
      toast({
        title: 'Error',
        description: 'Failed to update author information',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="edit-section-modal w-[95vw] max-w-[500px] h-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="edit-section-modal__title">
            {section === 'overview' && 'Edit Overview'}
            {section === 'contact' && 'Edit Contact Information'}
            {section === 'location' && 'Edit Location'}
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="edit-section-modal__form space-y-4 py-4">
          {section === 'overview' && (
            <>
              <div className="edit-section-modal__field grid w-full gap-1.5">
                <Label htmlFor="bio" className="edit-section-modal__label">
                  Biography
                </Label>
                <Textarea
                  id="bio"
                  name="bio"
                  rows={10}
                  placeholder="Enter author biography"
                  value={formData.bio || ''}
                  onChange={handleChange}
                  className="edit-section-modal__textarea"
                />
              </div>
              <div className="edit-section-modal__field grid w-full gap-1.5">
                <Label htmlFor="birth_date" className="edit-section-modal__label">
                  Birth Date
                </Label>
                <Input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  placeholder="YYYY-MM-DD"
                  value={formData.birth_date || ''}
                  onChange={handleChange}
                  className="edit-section-modal__input"
                />
              </div>
              <div className="edit-section-modal__field grid w-full gap-1.5">
                <Label htmlFor="nationality" className="edit-section-modal__label">
                  Nationality
                </Label>
                <Input
                  id="nationality"
                  name="nationality"
                  placeholder="e.g. American, British"
                  value={formData.nationality || ''}
                  onChange={handleChange}
                  className="edit-section-modal__input"
                />
              </div>
              <div className="edit-section-modal__field grid w-full gap-1.5">
                <Label htmlFor="website" className="edit-section-modal__label">
                  Website
                </Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="e.g. https://author.com"
                  value={formData.website || ''}
                  onChange={handleChange}
                  className="edit-section-modal__input"
                />
              </div>
              <div className="edit-section-modal__field grid w-full gap-1.5">
                <Label htmlFor="twitter_handle" className="edit-section-modal__label">
                  Twitter Handle
                </Label>
                <Input
                  id="twitter_handle"
                  name="twitter_handle"
                  placeholder="e.g. @author_handle"
                  value={formData.twitter_handle || ''}
                  onChange={handleChange}
                  className="edit-section-modal__input"
                />
              </div>
              <div className="edit-section-modal__field grid w-full gap-1.5">
                <Label htmlFor="facebook_handle" className="edit-section-modal__label">
                  Facebook Handle
                </Label>
                <Input
                  id="facebook_handle"
                  name="facebook_handle"
                  placeholder="e.g. authorpage"
                  value={formData.facebook_handle || ''}
                  onChange={handleChange}
                  className="edit-section-modal__input"
                />
              </div>
              <div className="edit-section-modal__field grid w-full gap-1.5">
                <Label htmlFor="instagram_handle" className="edit-section-modal__label">
                  Instagram Handle
                </Label>
                <Input
                  id="instagram_handle"
                  name="instagram_handle"
                  placeholder="e.g. @author_handle"
                  value={formData.instagram_handle || ''}
                  onChange={handleChange}
                  className="edit-section-modal__input"
                />
              </div>
              <div className="edit-section-modal__field grid w-full gap-1.5">
                <Label htmlFor="goodreads_url" className="edit-section-modal__label">
                  Goodreads URL
                </Label>
                <Input
                  id="goodreads_url"
                  name="goodreads_url"
                  type="url"
                  placeholder="e.g. https://www.goodreads.com/author/show/12345"
                  value={formData.goodreads_url || ''}
                  onChange={handleChange}
                  className="edit-section-modal__input"
                />
              </div>
            </>
          )}

          {section === 'location' && (
            <>
              <div className="edit-section-modal__field grid w-full gap-1.5">
                <Label htmlFor="address_line1" className="edit-section-modal__label">
                  Address Line 1
                </Label>
                <Input
                  id="address_line1"
                  name="address_line1"
                  placeholder="Street address, P.O. box, etc."
                  value={formData.address_line1 || ''}
                  onChange={handleChange}
                  className="edit-section-modal__input"
                />
              </div>
              <div className="edit-section-modal__field grid w-full gap-1.5">
                <Label htmlFor="address_line2" className="edit-section-modal__label">
                  Address Line 2
                </Label>
                <Input
                  id="address_line2"
                  name="address_line2"
                  placeholder="Apartment, suite, unit, building, floor, etc."
                  value={formData.address_line2 || ''}
                  onChange={handleChange}
                  className="edit-section-modal__input"
                />
              </div>
              <div className="edit-section-modal__field-group grid grid-cols-2 gap-2">
                <div className="edit-section-modal__field grid w-full gap-1.5">
                  <Label htmlFor="city" className="edit-section-modal__label">
                    City
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="City"
                    value={formData.city || ''}
                    onChange={handleChange}
                    className="edit-section-modal__input"
                  />
                </div>
                <div className="edit-section-modal__field grid w-full gap-1.5">
                  <Label htmlFor="state" className="edit-section-modal__label">
                    State/Province
                  </Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="State/Province"
                    value={formData.state || ''}
                    onChange={handleChange}
                    className="edit-section-modal__input"
                  />
                </div>
              </div>
              <div className="edit-section-modal__field-group grid grid-cols-2 gap-2">
                <div className="edit-section-modal__field grid w-full gap-1.5">
                  <Label htmlFor="postal_code" className="edit-section-modal__label">
                    Postal Code
                  </Label>
                  <Input
                    id="postal_code"
                    name="postal_code"
                    placeholder="Postal Code"
                    value={formData.postal_code || ''}
                    onChange={handleChange}
                    className="edit-section-modal__input"
                  />
                </div>
                <div className="edit-section-modal__field grid w-full gap-1.5">
                  <Label htmlFor="country" className="edit-section-modal__label">
                    Country
                  </Label>
                  <Input
                    id="country"
                    name="country"
                    placeholder="Country"
                    value={formData.country || ''}
                    onChange={handleChange}
                    className="edit-section-modal__input"
                  />
                </div>
              </div>
            </>
          )}

          <DialogFooter className="edit-section-modal__footer">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="edit-section-modal__cancel-button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="edit-section-modal__submit-button"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
