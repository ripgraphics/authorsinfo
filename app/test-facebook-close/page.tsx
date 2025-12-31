'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CloseButton } from '@/components/ui/close-button'

export default function TestFacebookClosePage() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Close Button Test</h1>

      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>Open Test Modal</Button>

        <div className="p-4 border rounded-sm">
          <h2 className="font-semibold mb-2">Close Button Preview:</h2>
          <div className="flex items-center gap-4">
            <CloseButton onClick={() => alert('Close button clicked!')} />
            <span className="text-sm text-muted-foreground">
              Click the button above to test the close button
            </span>
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Test Modal</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>This modal uses the standard DialogHeader which should have a close button.</p>
            <p className="mt-4 text-sm text-muted-foreground">
              The close button in the header should also be updated to use the new style.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
