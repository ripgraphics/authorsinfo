import type React from "react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookOpen } from "lucide-react"
import type { Publisher } from "@/types/database"

interface PublisherHoverCardProps {
  publisher: Publisher
  bookCount: number
  children: React.ReactNode
}

export function PublisherHoverCard({ publisher, bookCount, children }: PublisherHoverCardProps) {
  const imageUrl = publisher.publisher_image?.url || publisher.logo_url || "/placeholder.svg"

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-80">
        <Link href={`/publishers/${publisher.id}`} className="block no-underline">
          <div className="flex items-start space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={imageUrl} alt={publisher.name} />
              <AvatarFallback>{publisher.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <h4 className="text-sm font-semibold">{publisher.name}</h4>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <BookOpen className="mr-1 h-3 w-3" />
                <span>{bookCount} books</span>
              </div>
            </div>
          </div>
        </Link>
      </HoverCardContent>
    </HoverCard>
  )
} 