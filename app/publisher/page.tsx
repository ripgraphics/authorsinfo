import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import Image from "next/image"

export default async function PublishersPage() {
  const supabase = createClient()

  const { data: publishers, error } = await supabase.from("publishers").select("id, name, logo_url").order("name")

  if (error) {
    console.error("Error fetching publishers:", error)
    return <div>Failed to load publishers</div>
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Publishers</h1>
      </div>

      {publishers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No publishers found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {publishers.map((publisher) => (
            <Link
              key={publisher.id}
              href={`/publisher/${publisher.id}`}
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4 border">
                {publisher.logo_url ? (
                  <Image
                    src={publisher.logo_url || "/placeholder.svg"}
                    alt={`${publisher.name} logo`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 font-medium">{publisher.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <h2 className="text-xl font-medium">{publisher.name}</h2>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
