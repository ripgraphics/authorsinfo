import { PendingFriendRequests } from '@/components/pending-friend-requests'

export default function FriendRequestsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Friend Requests</h1>
        <p className="text-muted-foreground mt-2">
          Manage your incoming friend requests
        </p>
      </div>
      
      <PendingFriendRequests />
    </div>
  )
} 