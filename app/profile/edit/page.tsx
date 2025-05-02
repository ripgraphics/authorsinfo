import { redirect } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase"

// This function will try to find a publisher associated with the current user
// For demonstration, we're hardcoding to publisher ID 117 
// In a real application, you would query the database to find the publisher associated with the user
async function getPublisherIdForCurrentUser() {
  try {
    // Get current user ID from session
    const { data: { session } } = await supabaseAdmin.auth.getSession()
    const userId = session?.user?.id
    
    if (!userId) {
      return null
    }

    // For demonstration purposes, return a hardcoded ID
    // In a real application, query your database to find the publisher record for this user
    return "117" // Replace with logic to find the publisher ID for the current user
  } catch (error) {
    console.error("Error getting publisher ID:", error)
    return null
  }
}

export default async function ProfileEditPage() {
  const publisherId = await getPublisherIdForCurrentUser()
  
  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader />
      <main className="flex-1 container py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Edit Options</h1>
          
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Publisher Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Edit your publisher profile, including contact information, logo, and other details.
                </p>
                {publisherId ? (
                  <Button asChild>
                    <Link href={`/publishers/${publisherId}/edit`}>
                      Edit Publisher Profile
                    </Link>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No publisher account is associated with your user.
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>User Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Edit your user profile, including personal information and preferences.
                </p>
                <Button asChild>
                  <Link href="/profile">
                    Back to Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Direct links to specific publishers for testing/demo purposes */}
          <div className="mt-8 p-4 border rounded-md bg-gray-50">
            <h3 className="font-medium mb-2">For Testing: Direct Publisher Links</h3>
            <div className="grid gap-2">
              <Link href="/publishers/117/edit" className="text-blue-600 hover:underline">
                Edit Publisher #117
              </Link>
              <Link href="/publishers/291/edit" className="text-blue-600 hover:underline">
                Edit Publisher #291
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 