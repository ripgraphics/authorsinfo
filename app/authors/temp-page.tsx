import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase"
import { ClientAuthorPage } from "./[id]/client"
import { PageContainer } from "@/components/page-container"

export default async function Page({ params }: { params: { id: string } }) {
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