import { supabaseAdmin } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { ClientDiscussionPage } from "./client"

export const dynamic = "force-dynamic"

interface DiscussionPageProps {
  params: { id: string }
}

export default async function DiscussionPage({ params }: DiscussionPageProps) {
  const { id } = await params

  // Fetch discussion data
  const { data: discussion, error } = await supabaseAdmin
    .from('discussions')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !discussion) {
    notFound()
  }

  return (
    <ClientDiscussionPage
      discussion={discussion}
      params={{ id }}
    />
  )
}