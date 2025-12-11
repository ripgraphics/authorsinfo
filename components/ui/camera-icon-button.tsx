"use client"

import { useState } from "react"
import { Camera, Crop } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface CameraIconButtonProps {
  onChangeCover?: () => void
  onCrop?: () => void
  showChangeCover?: boolean
  showCrop?: boolean
  changeCoverLabel?: string
  cropLabel?: string
  size?: "sm" | "md" | "lg"
  className?: string
  onOpenChange?: (open: boolean) => void
}

const sizeMap = {
  sm: {
    button: "h-10 w-10",
    icon: "h-5 w-5",
  },
  md: {
    button: "h-12 w-12",
    icon: "h-6 w-6",
  },
  lg: {
    button: "h-14 w-14",
    icon: "h-7 w-7",
  },
}

export function CameraIconButton({
  onChangeCover,
  onCrop,
  showChangeCover = true,
  showCrop = true,
  changeCoverLabel = "Change Cover",
  cropLabel = "Crop Cover",
  size = "md",
  className,
  onOpenChange,
}: CameraIconButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const config = sizeMap[size] || sizeMap.md

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)
  }

  const handleChangeCover = () => {
    onChangeCover?.()
    handleOpenChange(false)
  }

  const handleCrop = () => {
    onCrop?.()
    handleOpenChange(false)
  }

  // Don't render if no actions are provided
  if (!showChangeCover && !showCrop) {
    return null
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "rounded-full bg-white/90 hover:bg-white border-white shadow-lg",
            config.button,
            className
          )}
        >
          <Camera className={config.icon} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        {showChangeCover && onChangeCover && (
          <DropdownMenuItem onClick={handleChangeCover}>
            <Camera className="h-4 w-4 mr-2" />
            {changeCoverLabel}
          </DropdownMenuItem>
        )}
        {showCrop && onCrop && (
          <DropdownMenuItem onClick={handleCrop}>
            <Crop className="h-4 w-4 mr-2" />
            {cropLabel}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

