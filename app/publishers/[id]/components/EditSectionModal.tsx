import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

interface EditSectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  section: 'overview' | 'contact' | 'location'
  publisherId: string | number
  initialData: any
  onSuccess: () => void
}

export function EditSectionModal({ 
  open, 
  onOpenChange, 
  section, 
  publisherId, 
  initialData,
  onSuccess
}: EditSectionModalProps) {
  const [formData, setFormData] = useState(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: typeof initialData) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/publishers/${publisherId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section,
          data: formData
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update publisher')
      }

      toast({
        title: "Success",
        description: "Publisher information updated successfully",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating publisher:', error)
      toast({
        title: "Error",
        description: "Failed to update publisher information",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="edit-section-modal sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="edit-section-modal__title">
            {section === 'overview' && 'Edit Overview'}
            {section === 'contact' && 'Edit Contact Information'}
            {section === 'location' && 'Edit Location'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="edit-section-modal__form space-y-4 py-4">
          {section === 'overview' && (
            <>
              <div className="edit-section-modal__field grid w-full gap-1.5">
                <Label htmlFor="about" className="edit-section-modal__label">About</Label>
                <Textarea
                  id="about"
                  name="about"
                  rows={10}
                  placeholder="Enter publisher description"
                  value={formData.about || ''}
                  onChange={handleChange}
                  className="edit-section-modal__textarea"
                />
              </div>
              <div className="edit-section-modal__field grid w-full gap-1.5">
                <Label htmlFor="founded_year" className="edit-section-modal__label">Founded Year</Label>
                <Input
                  id="founded_year"
                  name="founded_year"
                  type="number"
                  placeholder="e.g. 1995"
                  value={formData.founded_year || ''}
                  onChange={handleChange}
                  className="edit-section-modal__input"
                />
              </div>
              <div className="edit-section-modal__field grid w-full gap-1.5">
                <Label htmlFor="website" className="edit-section-modal__label">Website</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="e.g. https://publisher.com"
                  value={formData.website || ''}
                  onChange={handleChange}
                  className="edit-section-modal__input"
                />
              </div>
            </>
          )}

          {section === 'contact' && (
            <>
              <div className="edit-section-modal__field grid w-full gap-1.5">
                <Label htmlFor="email" className="edit-section-modal__label">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contact@publisher.com"
                  value={formData.email || ''}
                  onChange={handleChange}
                  className="edit-section-modal__input"
                />
              </div>
              <div className="edit-section-modal__field grid w-full gap-1.5">
                <Label htmlFor="phone" className="edit-section-modal__label">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  className="edit-section-modal__input"
                />
              </div>
            </>
          )}

          {section === 'location' && (
            <>
              <div className="edit-section-modal__field grid w-full gap-1.5">
                <Label htmlFor="address_line1" className="edit-section-modal__label">Address Line 1</Label>
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
                <Label htmlFor="address_line2" className="edit-section-modal__label">Address Line 2</Label>
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
                  <Label htmlFor="city" className="edit-section-modal__label">City</Label>
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
                  <Label htmlFor="state" className="edit-section-modal__label">State/Province</Label>
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
                  <Label htmlFor="postal_code" className="edit-section-modal__label">Postal Code</Label>
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
                  <Label htmlFor="country" className="edit-section-modal__label">Country</Label>
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
      </DialogContent>
    </Dialog>
  )
} 