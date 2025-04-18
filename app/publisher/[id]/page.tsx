import type { PublisherPageProps } from "@/types/page-props"
import { createClient } from "@/utils/supabase/server"
import { PublisherForm } from "../components/publisher-form"
import { PublisherBooks } from "../components/publisher-books"
import { notFound } from "next/navigation"

export default async function PublisherPage({ params }: PublisherPageProps) {
  // Validate that we have an ID
  if (!params.id) {
    notFound()
  }

  const supabase = createClient()

  // Fetch the publisher directly here instead of using the action
  const { data: publisher, error } = await supabase.from("publishers").select("*").eq("id", params.id).single()

  if (error || !publisher) {
    console.error("Error fetching publisher:", error)
    notFound()
  }

  return (
    <div className="container py-8">
      <PublisherForm publisher={publisher} />

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Published Books</h2>
        <PublisherBooks publisherId={params.id} />
      </div>
    </div>
  )
}
