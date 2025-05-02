"use client"

import Image from "next/image"
import Link from "next/link"
import { BookOpen } from "lucide-react"
import { Card } from "@/components/ui/card"

interface BookCardProps {
  id: string
  title: string
  coverImageUrl?: string
  className?: string
}

export function BookCard({
  id,
  title,
  coverImageUrl,
  className = "",
}: BookCardProps) {
  return (
    <Link href={`/books/${id}`} className="block">
      <Card className={`overflow-hidden h-full transition-transform hover:scale-105 ${className}`}>
        {/* Image container with 2:3 aspect ratio */}
        <div className="relative w-full" style={{ aspectRatio: "2/3" }}>
          {coverImageUrl ? (
            <Image
              src={coverImageUrl || "/placeholder.svg"}
              alt={title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="p-3 text-center">
          <h3 className="font-medium text-sm line-clamp-1">{title}</h3>
        </div>
      </Card>
    </Link>
  )
}
