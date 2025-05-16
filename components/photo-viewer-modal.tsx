import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface PhotoViewerModalProps {
  isOpen: boolean
  onClose: () => void
  photos: {
    id: string
    url: string
    alt?: string
  }[]
  initialPhotoIndex: number
}

export function PhotoViewerModal({
  isOpen,
  onClose,
  photos,
  initialPhotoIndex
}: PhotoViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialPhotoIndex)

  useEffect(() => {
    setCurrentIndex(initialPhotoIndex)
  }, [initialPhotoIndex])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      switch (e.key) {
        case "ArrowLeft":
          handlePrevious()
          break
        case "ArrowRight":
          handleNext()
          break
        case "Escape":
          onClose()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  if (!photos.length) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-black/90 border-none">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Previous button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 z-10 text-white hover:bg-white/20"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>

          {/* Photo */}
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={photos[currentIndex].url}
              alt={photos[currentIndex].alt || "Photo"}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>

          {/* Next button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 z-10 text-white hover:bg-white/20"
            onClick={handleNext}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>

          {/* Photo counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded-full">
            {currentIndex + 1} / {photos.length}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 