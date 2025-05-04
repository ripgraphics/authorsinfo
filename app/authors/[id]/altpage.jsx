// Simple server component
import { PageContainer } from "@/components/page-container"
import { ClientAuthorPage } from "./client"
import { supabaseAdmin } from "@/lib/supabase"
import { notFound } from "next/navigation"

export default async function Page({ params }) {
  const id = params.id
  
  // Get author data
  const { data: author, error } = await supabaseAdmin
    .from("authors")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !author) {
    notFound()
  }

  return (
    <PageContainer>
      <ClientAuthorPage
        author={author}
        authorImageUrl="/placeholder.svg?height=200&width=200"
        coverImageUrl="/placeholder.svg?height=400&width=1200"
        params={{ id }}
        books={[]}
        booksCount={0}
      />
    </PageContainer>
  )
} 