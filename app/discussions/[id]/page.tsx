import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

interface DiscussionPageProps {
  params: Promise<{ id: string }>
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
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>{discussion.title || 'Discussion'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p>{discussion.content || discussion.description || 'No content available.'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
