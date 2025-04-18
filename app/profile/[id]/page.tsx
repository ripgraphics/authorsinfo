import type { ProfilePageProps } from "@/types/page-props"

export default async function ProfilePage({ params }: ProfilePageProps) {
  // Component implementation
  return (
    <div>
      <h1>User Profile: {params.id}</h1>
      {/* Rest of the component */}
    </div>
  )
}
