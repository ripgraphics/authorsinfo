"use client"

import Image from "next/image"
import Link from "next/link"
import { BookOpen } from "lucide-react"
import { Card } from "@/components/ui/card"
import { EntityHoverCard } from "@/components/entity-hover-cards"

interface BookCardProps {
  id: string
  title: string
  coverImageUrl?: string
  className?: string
  author?: {
    id: number
    name: string
    author_image?: {
      url: string
    }
  }
  authorBookCount?: number
}

export function BookCard({
  id,
  title,
  coverImageUrl,
  className = "",
  author,
  authorBookCount = 0,
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
          {author && (
            <div className="text-xs text-muted-foreground mt-1">
              by{" "}
              <EntityHoverCard
                type="author"
                entity={{
                  id: author.id,
                  name: author.name,
                  author_image: author.author_image,
                  bookCount: authorBookCount
                }}
              >
                <span className="hover:underline cursor-pointer">{author.name}</span>
              </EntityHoverCard>
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}
