"use client"

import Image from "next/image"
import Link from "next/link"
import { BookOpen } from "lucide-react"

interface BookCoverProps {
  id: string
  title: string
  coverImageUrl?: string
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  linkToBook?: boolean
}

export function BookCover({
  id,
  title,
  coverImageUrl,
  className = "",
  size = "md",
  linkToBook = true,
}: BookCoverProps) {
  // Size configurations
  const sizeConfig = {
    sm: { width: 48, height: 64, aspectRatio: "3/4" },
    md: { width: 64, height: 96, aspectRatio: "2/3" },
    lg: { width: 80, height: 120, aspectRatio: "2/3" },
    xl: { width: 165, height: 247, aspectRatio: "2/3" },
  }

  const config = sizeConfig[size]

  const coverContent = (
    <div 
      className={`relative overflow-hidden rounded-md shadow-xs hover:shadow-md transition-shadow ${className}`}
      style={{ 
        width: config.width, 
        height: config.height,
        aspectRatio: config.aspectRatio 
      }}
    >
      {coverImageUrl ? (
        <Image
          src={coverImageUrl}
          alt={title}
          fill
          className="object-cover"
          sizes={`${config.width}px`}
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <BookOpen className={`${size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-8 w-8' : size === 'lg' ? 'h-10 w-10' : 'h-16 w-16'} text-muted-foreground`} />
        </div>
      )}
    </div>
  )

  if (linkToBook) {
    return (
      <Link href={`/books/${id}`} className="block">
        {coverContent}
      </Link>
    )
  }

  return coverContent
} 