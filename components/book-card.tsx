"use client"

import Image from "next/image"
import Link from "next/link"
import { BookOpen, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface BookCardProps {
  id: string
  title: string
  coverImageUrl?: string
  authorName?: string
  authorId?: string
  rating?: number
  reviewCount?: number
  className?: string
  aspectRatio?: "portrait" | "square"
  showRating?: boolean
}

export function BookCard({
  id,
  title,
  coverImageUrl,
  authorName,
  authorId,
  rating,
  reviewCount = 0,
  className = "",
  aspectRatio = "portrait",
  showRating = false,
}: BookCardProps) {
  // Determine aspect ratio class
  const aspectRatioClass = aspectRatio === "portrait" ? "aspect-[2/3]" : "aspect-square"

  return (
    <Link href={`/books/${id}`} className="book-card-link block">
      <Card className={`book-card overflow-hidden h-full transition-transform hover:scale-105 ${className}`}>
        <div className={`book-card-image-container relative w-full ${aspectRatioClass}`}>
          {coverImageUrl ? (
            <Image
              src={coverImageUrl || "/placeholder.svg"}
              alt={title}
              fill
              className="book-card-image object-cover"
            />
          ) : (
            <div className="book-card-placeholder w-full h-full bg-muted flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardContent className="book-card-content p-3">
          <h3 className="book-card-title font-medium text-sm line-clamp-1">{title}</h3>

          {authorName && (
            <p className="book-card-author text-sm text-muted-foreground line-clamp-1">
              {authorId ? (
                <Link href={`/authors/${authorId}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                  {authorName}
                </Link>
              ) : (
                authorName
              )}
            </p>
          )}

          {showRating && rating !== undefined && (
            <div className="book-card-rating flex items-center mt-1">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.floor(Number(rating)) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="ml-1 text-xs text-muted-foreground">
                {Number(rating).toFixed(1)} · {reviewCount} reviews
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
