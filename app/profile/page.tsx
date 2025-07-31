import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  
  try {
    // Get the current user from the session using getUser() for better security
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error getting user:', error)
      // Redirect to login if there's an error
      redirect('/login')
    }
    
    if (!user) {
      // Redirect to login if no user is authenticated
      redirect('/login')
    }
    
    // Redirect to the user's actual profile page using their real ID
    redirect(`/profile/${user.id}`)
    
  } catch (error) {
    console.error('Error in profile page:', error)
    // Redirect to login on any error
    redirect('/login')
  }
  
  // This won't render, but is needed for TypeScript
  return (
    <div>
      <div className="py-8 space-y-4">
        <div>Redirecting to your profile...</div>
        <div>
          <p>To see all users, visit the <Link href="/profile/user-list" className="text-primary underline">user list page</Link>.</p>
        </div>
      </div>
    </div>
  )
}
