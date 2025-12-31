import GroupContentPageClient from './page-client'

export default async function GroupContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <GroupContentPageClient params={{ id }} />
}
