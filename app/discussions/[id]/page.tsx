import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDiscussionById } from '@/app/actions/data'

export const dynamic = 'force-dynamic'

interface DiscussionPageProps {
  params: Promise<{ id: string }>
}

export default async function DiscussionPage({ params }: DiscussionPageProps) {
  const { id } = await params

  const discussion = await getDiscussionById(id)

  if (!discussion) {
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
