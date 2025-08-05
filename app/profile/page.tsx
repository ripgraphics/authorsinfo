import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from "@/lib/supabase/server"

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
    
    // Get the user's permalink from the database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('permalink')
      .eq('id', user.id)
      .single()
    
    if (userError || !userData) {
      console.error('Error getting user data:', userError)
      // Fallback to UUID if permalink not found
      redirect(`/profile/${user.id}`)
    }
    
    // Redirect to the user's profile page using their permalink
    const profileUrl = userData.permalink ? `/profile/${userData.permalink}` : `/profile/${user.id}`
    redirect(profileUrl)
    
  } catch (error) {
    console.error('Error in profile page:', error)
    redirect('/login')
  }
}
