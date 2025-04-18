import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import Image from "next/image"

interface PublisherBooksProps {
  publisherId: string
}

export async function PublisherBooks({ publisherId }: PublisherBooksProps) {
  const supabase = createClient()

  const { data: books, error } = await supabase
    .from("books")
    .select("id, title, cover_image")
    .eq("publisher_id", publisherId)
    .order("title")
    .limit(12)

  if (error) {
    console.error("Error fetching publisher books:", error)
    return <div>Failed to load books</div>
  }

  if (!books || books.length === 0) {
    return <div className="text-gray-500">No books found for this publisher</div>
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {books.map((book) => (
        <Link key={book.id} href={`/book/${book.id}`} className="group">
          <div className="aspect-[2/3] relative overflow-hidden rounded-md shadow-md group-hover:shadow-lg transition-shadow">
            {book.cover_image ? (
              <Image src={book.cover_image || "/placeholder.svg"} alt={book.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-sm text-center px-2">No Cover</span>
              </div>
            )}
          </div>
          <h3 className="mt-2 text-sm font-medium truncate group-hover:text-blue-600">{book.title}</h3>
        </Link>
      ))}
    </div>
  )
}
