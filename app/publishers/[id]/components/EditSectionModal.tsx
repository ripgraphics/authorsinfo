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
    setFormData(prev => ({
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {section === 'overview' && 'Edit Overview'}
            {section === 'contact' && 'Edit Contact Information'}
            {section === 'location' && 'Edit Location'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {section === 'overview' && (
            <>
              <div className="grid w-full gap-1.5">
                <Label htmlFor="about">About</Label>
                <Textarea
                  id="about"
                  name="about"
                  rows={10}
                  placeholder="Enter publisher description"
                  value={formData.about || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="grid w-full gap-1.5">
                <Label htmlFor="founded_year">Founded Year</Label>
                <Input
                  id="founded_year"
                  name="founded_year"
                  type="number"
                  placeholder="e.g. 1995"
                  value={formData.founded_year || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="grid w-full gap-1.5">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="e.g. https://publisher.com"
                  value={formData.website || ''}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          {section === 'contact' && (
            <>
              <div className="grid w-full gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contact@publisher.com"
                  value={formData.email || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="grid w-full gap-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone || ''}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          {section === 'location' && (
            <>
              <div className="grid w-full gap-1.5">
                <Label htmlFor="address_line1">Address Line 1</Label>
                <Input
                  id="address_line1"
                  name="address_line1"
                  placeholder="Street address, P.O. box, etc."
                  value={formData.address_line1 || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="grid w-full gap-1.5">
                <Label htmlFor="address_line2">Address Line 2</Label>
                <Input
                  id="address_line2"
                  name="address_line2"
                  placeholder="Apartment, suite, unit, building, floor, etc."
                  value={formData.address_line2 || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="City"
                    value={formData.city || ''}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="State/Province"
                    value={formData.state || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    name="postal_code"
                    placeholder="Postal Code"
                    value={formData.postal_code || ''}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    placeholder="Country"
                    value={formData.country || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 