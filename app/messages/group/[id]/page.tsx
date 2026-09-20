import { redirect } from 'next/navigation'

type Props = { params: Promise<{ id: string }> }

export default async function MessengerGroupPage({ params }: Props) {
  const { id } = await params
  redirect(`/messages?group=${encodeURIComponent(id)}`)
}
